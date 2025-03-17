// middleware/error.js
const logger = require('../utils/Logger')('errorHandler');

const errorHandler = (err, req, res, next) => {
    // לוג מפורט יותר עם מידע על הבקשה
    logger.error('שגיאת שרת', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user: req.user ? req.user._id : 'לא מחובר'
    });

    // טיפול בשגיאות מונגוס
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: messages.join(', ') });
    }

    // טיפול בשגיאת כפילות (למשל אימייל שכבר קיים)
    if (err.code === 11000) {
        return res.status(400).json({ success: false, error: 'ערך זה כבר קיים במערכת' });
    }

    // שגיאות JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'טוקן לא תקף' });
    }

    // שגיאות אחרות
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'שגיאת שרת'
    });
};

module.exports = errorHandler;