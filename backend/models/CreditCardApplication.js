const mongoose = require('mongoose');

const CARD_TIERS = {
    silver: {
        name: 'Silver Card',
        minCreditScore: 500,
        creditLimit: 25000,
        annualFee: 499,
        interestRate: 3.5,
        cashbackRate: 0.5,
        benefits: [
            'Basic reward points on all purchases',
            '0.5% cashback on all transactions',
            'Free ATM withdrawals (5/month)',
            'SMS & Email transaction alerts',
            'Zero liability fraud protection',
            'Contactless payment enabled'
        ],
        color: '#C0C0C0'
    },
    gold: {
        name: 'Gold Card',
        minCreditScore: 650,
        creditLimit: 100000,
        annualFee: 1499,
        interestRate: 2.9,
        cashbackRate: 1.0,
        benefits: [
            '2X reward points on dining & entertainment',
            '1% cashback on all transactions',
            'Airport lounge access (4 visits/year)',
            'Fuel surcharge waiver',
            'Complimentary movie tickets (2/month)',
            'Travel insurance up to ₹5 Lakhs',
            'Priority customer support',
            'EMI conversion on purchases above ₹2,500'
        ],
        color: '#FFD700'
    },
    platinum: {
        name: 'Platinum Card',
        minCreditScore: 750,
        creditLimit: 500000,
        annualFee: 4999,
        interestRate: 2.2,
        cashbackRate: 2.0,
        benefits: [
            '5X reward points on travel & flights',
            '3X reward points on dining & hotels',
            '2% cashback on all transactions',
            'Unlimited domestic airport lounge access',
            'International lounge access (8 visits/year)',
            'Complimentary flight tickets (2/year up to ₹10,000)',
            'Hotel stay vouchers worth ₹5,000/quarter',
            'Travel insurance up to ₹25 Lakhs',
            'Concierge services 24/7',
            'Golf privileges at premium courses',
            'Priority Pass membership',
            'Milestone bonus: Spend ₹2L, get ₹5,000 voucher'
        ],
        color: '#E5E4E2'
    },
    black: {
        name: 'Black Card',
        minCreditScore: 800,
        creditLimit: 1500000,
        annualFee: 14999,
        interestRate: 1.5,
        cashbackRate: 3.0,
        benefits: [
            '10X reward points on international transactions',
            '5X reward points on all travel & hotels',
            '3% cashback on all transactions',
            'Unlimited global airport lounge access',
            'Complimentary business class upgrades (2/year)',
            'Free international flight tickets (2/year up to ₹50,000)',
            'Luxury hotel stays at 50% off worldwide',
            'Travel insurance up to ₹1 Crore',
            'Personal relationship manager',
            'Invitation to exclusive events & premieres',
            'Complimentary spa & wellness memberships',
            'Premium golf memberships worldwide',
            'No foreign transaction fees',
            'Emergency card replacement worldwide',
            'Dedicated 24/7 luxury concierge',
            'Annual gift worth ₹10,000'
        ],
        color: '#1a1a1a'
    }
};

const creditCardApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cardTier: {
        type: String,
        enum: ['silver', 'gold', 'platinum', 'black'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'cancelled'],
        default: 'pending'
    },
    applicantDetails: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        income: { type: Number, required: true },
        employment: { type: String, enum: ['salaried', 'self_employed', 'business', 'student', 'other'], required: true },
        address: { type: String, required: true }
    },
    creditScoreAtApplication: {
        type: Number,
        default: 750
    },
    assignedCreditLimit: {
        type: Number,
        default: 0
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
    cardNumber: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index
creditCardApplicationSchema.index({ userId: 1, status: 1 });
creditCardApplicationSchema.index({ status: 1 });

// Static method to get card tier info
creditCardApplicationSchema.statics.getCardTiers = function () {
    return CARD_TIERS;
};

creditCardApplicationSchema.statics.getCardTierInfo = function (tier) {
    return CARD_TIERS[tier] || null;
};

module.exports = mongoose.model('CreditCardApplication', creditCardApplicationSchema);
module.exports.CARD_TIERS = CARD_TIERS;
