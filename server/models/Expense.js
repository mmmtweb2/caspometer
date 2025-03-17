// models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        default: 'אשראי'
    },
    notes: {
        type: String
    },
    tags: [String]
}, {
    timestamps: true
});

// אינדקס לחיפוש מהיר לפי משתמש ותאריך
ExpenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);