// routes/export.js
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/Logger')('exportRoutes');

// @route   GET /api/export/expenses-csv
// @desc    ייצוא הוצאות לפורמט CSV
// @access  Private
router.get('/expenses-csv', protect, async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id });

        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ message: 'לא נמצאו הוצאות לייצוא' });
        }

        // יצירת כותרת ה-CSV
        let csv = 'Date,Amount,Description,Category,PaymentMethod\n';

        // הוספת כל הוצאה כשורה
        expenses.forEach(expense => {
            const date = new Date(expense.date).toISOString().split('T')[0];
            const row = [
                date,
                expense.amount,
                `"${expense.description.replace(/"/g, '""')}"`, // מניעת שגיאות בגלל גרשיים
                expense.category,
                expense.paymentMethod
            ].join(',');

            csv += row + '\n';
        });

        // הגדרת כותרות התגובה
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');

        res.send(csv);
    } catch (error) {
        logger.error('שגיאה בייצוא הוצאות:', { error });
        res.status(500).json({ message: 'שגיאה בייצוא הנתונים' });
    }
});

// @route   GET /api/export/user-data
// @desc    ייצוא כל נתוני המשתמש (כולל הגדרות והוצאות) לפורמט JSON
// @access  Private
router.get('/user-data', protect, async (req, res) => {
    try {
        // קבלת נתוני המשתמש (ללא סיסמה)
        const user = await User.findById(req.user._id).select('-password');
        // קבלת כל ההוצאות של המשתמש
        const expenses = await Expense.find({ user: req.user._id });

        // יצירת אובייקט המכיל את כל הנתונים
        const exportData = {
            user: {
                name: user.name,
                email: user.email,
                settings: user.settings,
                registerDate: user.registerDate
            },
            expenses: expenses
        };

        // הגדרת כותרות התגובה
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="user-data.json"');

        res.json(exportData);
    } catch (error) {
        logger.error('שגיאה בייצוא נתוני משתמש:', { error });
        res.status(500).json({ message: 'שגיאה בייצוא נתוני המשתמש' });
    }
});

module.exports = router;