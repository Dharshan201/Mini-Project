const mongoose = require('mongoose');

const creditScoreHistorySchema = new mongoose.Schema({
    score: { type: Number, required: true },
    change: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const creditScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    score: {
        type: Number,
        default: 750,
        min: 300,
        max: 900
    },
    totalCreditLimit: {
        type: Number,
        default: 50000
    },
    totalUtilized: {
        type: Number,
        default: 0
    },
    totalDue: {
        type: Number,
        default: 0
    },
    onTimePayments: {
        type: Number,
        default: 0
    },
    latePayments: {
        type: Number,
        default: 0
    },
    missedPayments: {
        type: Number,
        default: 0
    },
    lastPaymentDate: {
        type: Date,
        default: null
    },
    nextDueDate: {
        type: Date,
        default: null
    },
    history: [creditScoreHistorySchema],
    riskLevel: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'very_poor'],
        default: 'good'
    }
}, {
    timestamps: true
});

// Calculate risk level based on score
creditScoreSchema.pre('save', function (next) {
    if (this.score >= 800) this.riskLevel = 'excellent';
    else if (this.score >= 700) this.riskLevel = 'good';
    else if (this.score >= 600) this.riskLevel = 'fair';
    else if (this.score >= 500) this.riskLevel = 'poor';
    else this.riskLevel = 'very_poor';
    next();
});

// Method to update score
creditScoreSchema.methods.updateScore = function (change, reason) {
    const newScore = Math.max(300, Math.min(900, this.score + change));
    this.history.push({
        score: newScore,
        change: change,
        reason: reason
    });
    this.score = newScore;
    return this;
};

// Method to add spending
creditScoreSchema.methods.addSpending = function (amount) {
    this.totalUtilized += amount;
    this.totalDue += amount;

    // Set next due date to 30 days from now if not already set
    if (!this.nextDueDate) {
        this.nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // High utilization impacts score negatively
    const utilizationRatio = this.totalUtilized / this.totalCreditLimit;
    if (utilizationRatio > 0.9) {
        this.updateScore(-25, 'Credit utilization exceeded 90%');
    } else if (utilizationRatio > 0.7) {
        this.updateScore(-10, 'Credit utilization exceeded 70%');
    } else if (utilizationRatio > 0.5) {
        this.updateScore(-5, 'Credit utilization exceeded 50%');
    }

    return this;
};

// Method to make payment (pay back)
creditScoreSchema.methods.makePayment = function (amount) {
    const paymentAmount = Math.min(amount, this.totalDue);
    this.totalDue -= paymentAmount;
    this.lastPaymentDate = new Date();

    // Check if payment is on time
    if (this.nextDueDate && new Date() <= this.nextDueDate) {
        this.onTimePayments += 1;
        this.updateScore(15, 'On-time payment received');
    } else if (this.nextDueDate && new Date() > this.nextDueDate) {
        this.latePayments += 1;
        this.updateScore(-30, 'Late payment - past due date');
    }

    // Reset due date if fully paid
    if (this.totalDue <= 0) {
        this.totalDue = 0;
        this.nextDueDate = null;
        this.updateScore(10, 'Outstanding balance fully cleared');
    }

    return this;
};

// Method to check for missed payments
creditScoreSchema.methods.checkMissedPayment = function () {
    if (this.nextDueDate && new Date() > this.nextDueDate && this.totalDue > 0) {
        const daysPast = Math.floor((new Date() - this.nextDueDate) / (1000 * 60 * 60 * 24));

        if (daysPast > 90) {
            this.missedPayments += 1;
            this.updateScore(-100, 'Payment overdue by 90+ days - severely impacts credit');
        } else if (daysPast > 60) {
            this.missedPayments += 1;
            this.updateScore(-75, 'Payment overdue by 60+ days');
        } else if (daysPast > 30) {
            this.missedPayments += 1;
            this.updateScore(-50, 'Payment overdue by 30+ days');
        }
    }
    return this;
};

// Virtual for utilization percentage
creditScoreSchema.virtual('utilizationPercentage').get(function () {
    return this.totalCreditLimit > 0
        ? Math.round((this.totalUtilized / this.totalCreditLimit) * 100)
        : 0;
});

creditScoreSchema.set('toJSON', { virtuals: true });
creditScoreSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CreditScore', creditScoreSchema);
