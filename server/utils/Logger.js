// utils/logger.js
const winston = require('winston');
const path = require('path');

// וודא שתיקיית הלוגים קיימת
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'caspometer-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    info => `${info.timestamp} ${info.level}: ${info.message}`
                )
            )
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
        }),
    ],
});

// הוספת שם המודול ללוג
const getLogger = (moduleName) => {
    return {
        debug: (message, meta = {}) => logger.debug(message, { ...meta, module: moduleName }),
        info: (message, meta = {}) => logger.info(message, { ...meta, module: moduleName }),
        warn: (message, meta = {}) => logger.warn(message, { ...meta, module: moduleName }),
        error: (message, meta = {}) => logger.error(message, { ...meta, module: moduleName })
    };
};

module.exports = getLogger;  