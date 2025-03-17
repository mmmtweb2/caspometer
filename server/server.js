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

// Middleware
app.use(cors());
app.use(express.json());

// חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('MongoDB חיבור למסד הנתונים הצליח'))
    .catch(err => logger.error('שגיאה בהתחברות למסד הנתונים', { error: err.message }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/export', exportRoutes);

// Route בסיסי לבדיקה שהשרת עובד
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler middleware - צריך להיות אחרון
app.use(errorHandler);

// Port והפעלת השרת - רק פעם אחת!
app.listen(PORT, () => {
    logger.info(`שרת רץ במצב ${process.env.NODE_ENV} על פורט ${PORT}`);
});