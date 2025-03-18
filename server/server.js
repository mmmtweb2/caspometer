// server.js - קובץ ראשי לשרת
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const exportRoutes = require('./routes/export');
const errorHandler = require('./middleware/error');
const logger = require('./utils/Logger')('server');

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// ✅ הגדרת CORS **לפני כל הנתיבים**
const corsOptions = {
    origin: ['https://caspometer.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ תמיכה ב-Preflight Requests

app.use(express.json());

// ✅ חיבור למסד הנתונים עם טיפול בשגיאות
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB חיבור למסד הנתונים הצליח'))
    .catch(err => {
        logger.error('שגיאה בהתחברות למסד הנתונים', { error: err.message });
        process.exit(1);
    });

// ✅ ווידוא שכל הנתיבים מוגדרים עם `/api/`
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/export', exportRoutes);

// ✅ Route לבדיקה שהשרת עובד
app.get('/', (req, res) => {
    res.send('API is running...');
});

// ✅ טיפול בשגיאות
app.use(errorHandler);

// ✅ הפעלת השרת
app.listen(PORT, () => {
    logger.info(`שרת רץ במצב ${process.env.NODE_ENV} על פורט ${PORT}`);
});
