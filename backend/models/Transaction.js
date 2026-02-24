const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required'],
        min: [0.01, 'Amount must be at least 0.01']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    merchant: {
        type: String,
        required: [true, 'Merchant name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'otp_sent', 'otp_verified', 'approved', 'rejected', 'completed', 'failed'],
        default: 'pending'
    },
    maskedCard: {
        type: String,
        required: true
    },
    cardType: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'rupay', 'unknown'],
        required: true
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpHash: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ cardType: 1 });
transactionSchema.index({ createdAt: -1 });

// Format amount with currency
transactionSchema.methods.getFormattedAmount = function () {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[this.currency] || ''}${this.amount.toFixed(2)}`;
};

module.exports = mongoose.model('Transaction', transactionSchema);
