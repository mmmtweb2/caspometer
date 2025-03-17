// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/Logger')('authRoutes');

// יצירת טוקן JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    הרשמת משתמש חדש
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // בדוק אם המשתמש כבר קיים
        const userExists = await User.findOne({ email });

        if (userExists) {
            logger.info('ניסיון הרשמה עם אימייל קיים', { email });
            return res.status(400).json({ message: 'משתמש עם כתובת מייל זו כבר קיים' });
        }

        // יצירת משתמש חדש
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            logger.info('משתמש חדש נרשם בהצלחה', { userId: user._id });
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                settings: user.settings,
                token: generateToken(user._id)
            });
        } else {
            logger.warn('יצירת משתמש נכשלה עם נתונים לא תקינים');
            res.status(400).json({ message: 'נתוני משתמש לא תקינים' });
        }
    } catch (error) {
        logger.error('שגיאה בתהליך הרשמה', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   POST /api/auth/login
// @desc    התחברות משתמש וקבלת טוקן
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // מציאת המשתמש לפי אימייל
        const user = await User.findOne({ email });

        // אימות המשתמש והסיסמה
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                settings: user.settings,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   GET /api/auth/profile
// @desc    קבלת פרטי המשתמש
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        // קבלת המשתמש (ללא הסיסמה) מה-middleware 
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                settings: user.settings
            });
        } else {
            res.status(404).json({ message: 'משתמש לא נמצא' });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// @route   PUT /api/auth/profile
// @desc    עדכון פרטי משתמש
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            // עדכון סיסמה רק אם סופקה
            if (req.body.password) {
                user.password = req.body.password;
            }

            // עדכון הגדרות
            if (req.body.settings) {
                // מיזוג הגדרות קיימות עם חדשות
                user.settings = {
                    ...user.settings,
                    ...req.body.settings
                };

                // טיפול מיוחד בהגדרות מקוננות
                if (req.body.settings.budgets) {
                    user.settings.budgets = req.body.settings.budgets;
                }

                if (req.body.settings.notifications) {
                    user.settings.notifications = {
                        ...user.settings.notifications,
                        ...req.body.settings.notifications
                    };
                }
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                settings: updatedUser.settings,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'משתמש לא נמצא' });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;