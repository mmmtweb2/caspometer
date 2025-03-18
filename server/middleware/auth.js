// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/Logger')('authMiddleware');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            logger.debug('אימות משתמש הצליח', { userId: req.user._id });
            next();
        } catch (error) {
            logger.warn('אימות נכשל', { error: error.message });
            res.status(401).json({ message: 'לא מורשה, הטוקן אינו תקף' });
        }
    } else {
        logger.warn('ניסיון גישה ללא טוקן');
        res.status(401).json({ message: 'לא מורשה, אין טוקן' });
    }
};

module.exports = { protect };
