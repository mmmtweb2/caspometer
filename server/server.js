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

// טעינת משתני סביבה מקובץ .env
dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();

// 🔹 הגדרת CORS **לפני** הנתיבים
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://caspometer.vercel.app', 'http://localhost:3000']
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ מאפשר Preflight לכל הנתיבים

// Middleware
app.use(express.json());

// חיבור למסד הנתונים עם טיפול בשגיאות
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB חיבור למסד הנתונים הצליח'))
    .catch(err => {
        logger.error('שגיאה בהתחברות למסד הנתונים', { error: err.message });
        process.exit(1); // ✅ מפסיק את השרת במקרה של שגיאה
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // ✅ מאפשר גם נתיב `/auth`
app.use('/api/expenses', expenseRoutes);
app.use('/api/export', exportRoutes);

// Route בסיסי לבדיקה שהשרת עובד
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler middleware - צריך להיות אחרון
app.use(errorHandler);

// הפעלת השרת
app.listen(PORT, () => {
    logger.info(`שרת רץ במצב ${process.env.NODE_ENV} על פורט ${PORT}`);
});
