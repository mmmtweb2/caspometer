// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/Logger')('authMiddleware');

const protect = async (req, res, next) => {
    let token;

    // בדיקה האם יש טוקן בכותרות
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // קבלת הטוקן מהכותרת
            token = req.headers.authorization.split(' ')[1];

            // פענוח הטוקן
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // מציאת משתמש והוספתו לבקשה (ללא הסיסמה)
            req.user = await User.findById(decoded.id).select('-password');

            // לוג אימות מוצלח
            logger.debug('אימות משתמש הצליח', { userId: req.user._id });

            next();
        } catch (error) {
            logger.warn('אימות נכשל', {
                error: error.message,
                token: token ? `${token.substring(0, 10)}...` : 'לא נמצא'
            });
            res.status(401).json({ message: 'לא מורשה, הטוקן אינו תקף' });
        }
    }

    if (!token) {
        logger.warn('ניסיון גישה ללא טוקן', {
            method: req.method,
            path: req.originalUrl,
            ip: req.ip
        });
        res.status(401).json({ message: 'לא מורשה, אין טוקן' });
    }
};

module.exports = { protect };