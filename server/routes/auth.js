// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const logger = require('../utils/Logger')('authRoutes');

// יצירת טוקן JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ✅ הרשמה משתמש חדש (נתיב נכון: /api/auth/register)
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'משתמש עם כתובת מייל זו כבר קיים' });
        }

        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'נתוני משתמש לא תקינים' });
        }
    } catch (error) {
        logger.error('שגיאה בהרשמה', { error: error.message });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// ✅ התחברות משתמש (נתיב נכון: /api/auth/login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }
    } catch (error) {
        logger.error('שגיאה בהתחברות', { error: error.message });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// ✅ קבלת פרטי משתמש (נתיב נכון: /api/auth/profile)
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email
            });
        } else {
            res.status(404).json({ message: 'משתמש לא נמצא' });
        }
    } catch (error) {
        logger.error('שגיאה בפרופיל', { error: error.message });
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
