// routes/expenses.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const logger = require('../utils/Logger')('expensesRoutes');


// @route   GET /api/expenses
// @desc    קבלת כל ההוצאות של המשתמש
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id })
            .sort({ date: -1 });

        res.json(expenses);
    } catch (error) {
        logger.error('שגיאה בקבלת הוצאות:', { error });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   POST /api/expenses
// @desc    הוספת הוצאה חדשה
// @access  Private
router.post('/', protect, async (req, res) => {
    const { amount, description, category, date, paymentMethod, notes, tags } = req.body;

    try {
        const expense = new Expense({
            user: req.user._id,
            amount,
            description,
            category,
            date: date || Date.now(),
            paymentMethod: paymentMethod || 'אשראי',
            notes,
            tags
        });

        const createdExpense = await expense.save();
        res.status(201).json(createdExpense);
    } catch (error) {
        logger.error('שגיאה בהוספת הוצאה:', { error });
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET /api/expenses/:id
// @desc    קבלת הוצאה לפי ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        // וידוא שההוצאה שייכת למשתמש
        if (!expense) {
            return res.status(404).json({ message: 'הוצאה לא נמצאה' });
        }

        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'לא מורשה' });
        }

        res.json(expense);
    } catch (error) {
        logger.error('שגיאה בקבלת הוצאה לפי ID:', { error });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   PUT /api/expenses/:id
// @desc    עדכון הוצאה
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);

        // וידוא שההוצאה קיימת ושייכת למשתמש
        if (!expense) {
            return res.status(404).json({ message: 'הוצאה לא נמצאה' });
        }

        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'לא מורשה' });
        }

        // עדכון ההוצאה
        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json(expense);
    } catch (error) {
        logger.error('שגיאה בעדכון הוצאה:', { error });
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   DELETE /api/expenses/:id
// @desc    מחיקת הוצאה
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        // וידוא שההוצאה קיימת ושייכת למשתמש
        if (!expense) {
            return res.status(404).json({ message: 'הוצאה לא נמצאה' });
        }

        if (expense.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'לא מורשה' });
        }

        await expense.remove();

        res.json({ message: 'הוצאה נמחקה בהצלחה' });
    } catch (error) {
        logger.error('שגיאה במחיקת הוצאה:', { error });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET /api/expenses/summary/monthly
// @desc    קבלת סיכום הוצאות חודשי
// @access  Private
router.get('/summary/monthly', protect, async (req, res) => {
    try {
        // קבלת סיכום הוצאות חודשי עבור 6 החודשים האחרונים
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const summary = await Expense.aggregate([
            {
                $match: {
                    user: req.user._id,
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        res.json(summary);
    } catch (error) {
        logger.error('שגיאה בקבלת סיכום הוצאות חודשי:', { error });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET /api/expenses/summary/category
// @desc    קבלת סיכום הוצאות לפי קטגוריה
// @access  Private
router.get('/summary/category', protect, async (req, res) => {
    try {
        // פילטור לפי תאריך אם סופק
        const dateQuery = {};

        if (req.query.startDate) {
            dateQuery.$gte = new Date(req.query.startDate);
        }

        if (req.query.endDate) {
            dateQuery.$lte = new Date(req.query.endDate);
        }

        const matchQuery = {
            user: req.user._id
        };

        if (Object.keys(dateQuery).length > 0) {
            matchQuery.date = dateQuery;
        }

        const summary = await Expense.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    totalAmount: -1
                }
            }
        ]);

        res.json(summary);
    } catch (error) {
        logger.error('שגיאה בקבלת סיכום הוצאות לפי קטגוריה:', { error });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;