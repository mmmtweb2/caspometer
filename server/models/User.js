// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    settings: {
        currency: {
            type: String,
            default: 'ILS'
        },
        theme: {
            type: String,
            default: 'light'
        },
        language: {
            type: String,
            default: 'he'
        },
        budgets: {
            type: Map,
            of: Number,
            default: {
                'מזון': 2000,
                'קניות': 1000,
                'בילויים': 800,
                'תחבורה': 600,
                'חשבונות': 1500,
                'בריאות': 500,
                'אחר': 700
            }
        },
        notifications: {
            budgetAlerts: {
                type: Boolean,
                default: true
            },
            weeklyReports: {
                type: Boolean,
                default: true
            },
            monthlyReports: {
                type: Boolean,
                default: true
            }
        }
    },
    registerDate: {
        type: Date,
        default: Date.now
    }
});

// שיטה להשוואת הסיסמה (בהתחברות)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// הצפנת הסיסמה לפני שמירה במסד הנתונים
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);