const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cardNumber: {
        type: String,
        required: [true, 'Card number is required'],
        // Stored as masked: ****-****-****-1234
    },
    cardNumberHash: {
        type: String,
        required: true,
        select: false // Never expose the hash
    },
    lastFourDigits: {
        type: String,
        required: true,
        maxlength: 4
    },
    cardHolder: {
        type: String,
        required: [true, 'Card holder name is required'],
        uppercase: true,
        trim: true
    },
    expiryDate: {
        type: String,
        required: [true, 'Expiry date is required'],
        match: [/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Expiry date must be in MM/YY format']
    },
    cardType: {
        type: String,
        enum: ['visa', 'mastercard', 'amex', 'rupay', 'unknown'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
cardSchema.index({ userId: 1, isActive: 1 });

// Virtual for masked display
cardSchema.virtual('maskedNumber').get(function () {
    return `****-****-****-${this.lastFourDigits}`;
});

// Virtual for lastFour (alias)
cardSchema.virtual('lastFour').get(function () {
    return this.lastFourDigits;
});

// Ensure virtuals are included in JSON
cardSchema.set('toJSON', { virtuals: true });
cardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Card', cardSchema);
