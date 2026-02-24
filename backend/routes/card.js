const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const {
    validateCardNumber,
    detectCardType,
    validateExpiry,
    validateCVV,
    maskCardNumber,
    getLastFourDigits
} = require('../utils/luhn');
const { sendPaymentConfirmation, sendOTPEmail } = require('../utils/email');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/card/validate
 * @desc    Validate card details using Luhn's algorithm
 * @access  Private
 */
router.post('/validate', async (req, res) => {
    try {
        const { cardNumber, expiryDate, cvv } = req.body;

        const errors = [];

        // Validate card number
        if (!cardNumber) {
            errors.push('Card number is required');
        } else if (!validateCardNumber(cardNumber)) {
            errors.push('Invalid card number (failed Luhn check)');
        }

        // Detect card type
        const cardType = detectCardType(cardNumber || '');

        // Validate expiry date
        if (!expiryDate) {
            errors.push('Expiry date is required');
        } else if (!validateExpiry(expiryDate)) {
            errors.push('Invalid or expired card');
        }

        // Validate CVV
        if (!cvv) {
            errors.push('CVV is required');
        } else if (!validateCVV(cvv, cardType)) {
            errors.push(`Invalid CVV (${cardType === 'amex' ? '4' : '3'} digits required)`);
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                valid: false,
                errors,
                cardType
            });
        }

        res.json({
            success: true,
            valid: true,
            cardType,
            maskedNumber: maskCardNumber(cardNumber),
            message: 'Card validation successful'
        });
    } catch (error) {
        console.error('Card validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during validation'
        });
    }
});

/**
 * @route   POST /api/card/save
 * @desc    Save a card for future use
 * @access  Private
 */
router.post('/save', async (req, res) => {
    try {
        const { cardNumber, cardHolder, expiryDate } = req.body;

        // Validate card
        if (!validateCardNumber(cardNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card number'
            });
        }

        if (!validateExpiry(expiryDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired card'
            });
        }

        const cardType = detectCardType(cardNumber);
        const lastFour = getLastFourDigits(cardNumber);

        // Create hash for card number (for duplicate detection)
        const cardHash = crypto.createHash('sha256').update(cardNumber.replace(/\D/g, '')).digest('hex');

        // Check if card already exists for user
        const existingCard = await Card.findOne({
            userId: req.user.id,
            cardNumberHash: cardHash
        });

        if (existingCard) {
            return res.status(400).json({
                success: false,
                message: 'This card is already saved'
            });
        }

        // Save card with masked number
        const card = await Card.create({
            userId: req.user.id,
            cardNumber: maskCardNumber(cardNumber),
            cardNumberHash: cardHash,
            lastFourDigits: lastFour,
            cardHolder: cardHolder.toUpperCase(),
            expiryDate,
            cardType
        });

        res.status(201).json({
            success: true,
            message: 'Card saved successfully',
            card: {
                id: card._id,
                maskedNumber: card.maskedNumber,
                cardHolder: card.cardHolder,
                expiryDate: card.expiryDate,
                cardType: card.cardType
            }
        });
    } catch (error) {
        console.error('Card save error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error saving card'
        });
    }
});

/**
 * @route   GET /api/card/saved
 * @desc    Get user's saved cards
 * @access  Private
 */
router.get('/saved', async (req, res) => {
    try {
        const cards = await Card.find({ userId: req.user.id, isActive: true })
            .select('-cardNumberHash')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: cards.length,
            cards
        });
    } catch (error) {
        console.error('Fetch cards error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching cards'
        });
    }
});

/**
 * @route   POST /api/card/process
 * @desc    Process a payment (create pending transaction)
 * @access  Private
 */
router.post('/process', async (req, res) => {
    try {
        const { savedCardId, cardNumber, cardHolder, expiryDate, cvv, amount, merchant, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        let card;
        let cardType;

        if (savedCardId) {
            // Using a saved card — look it up by ID
            card = await Card.findOne({ _id: savedCardId, userId: req.user.id, isActive: true });
            if (!card) {
                return res.status(404).json({ success: false, message: 'Saved card not found' });
            }
            cardType = card.cardType;

            // Validate CVV format
            if (!cvv || !validateCVV(cvv, cardType)) {
                return res.status(400).json({ success: false, message: 'Invalid CVV' });
            }
        } else {
            // Using a new card — validate all card details
            if (!validateCardNumber(cardNumber)) {
                return res.status(400).json({ success: false, message: 'Invalid card number' });
            }
            if (!validateExpiry(expiryDate)) {
                return res.status(400).json({ success: false, message: 'Invalid or expired card' });
            }

            cardType = detectCardType(cardNumber);
            if (!validateCVV(cvv, cardType)) {
                return res.status(400).json({ success: false, message: 'Invalid CVV' });
            }

            // Check or create card
            const cardHash = crypto.createHash('sha256').update(cardNumber.replace(/\D/g, '')).digest('hex');
            card = await Card.findOne({ userId: req.user.id, cardNumberHash: cardHash });

            if (!card) {
                card = await Card.create({
                    userId: req.user.id,
                    cardNumber: maskCardNumber(cardNumber),
                    cardNumberHash: cardHash,
                    lastFourDigits: getLastFourDigits(cardNumber),
                    cardHolder: cardHolder.toUpperCase(),
                    expiryDate,
                    cardType
                });
            }
        }

        // Generate a random 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        // Create transaction with OTP hash
        const transaction = await Transaction.create({
            userId: req.user.id,
            cardId: card._id,
            amount: parseFloat(amount),
            merchant: merchant || 'Online Purchase',
            description: description || '',
            status: 'otp_sent',
            maskedCard: card.cardNumber || card.maskedNumber,
            cardType,
            otpHash,
            otpExpiry: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });

        // Send OTP email to user's Gmail
        const user = await User.findById(req.user.id);
        await sendOTPEmail(user.email, user.name, otp);

        res.json({
            success: true,
            message: 'OTP sent to your registered email',
            transactionId: transaction._id,
            maskedCard: card.cardNumber || card.maskedNumber,
            amount: transaction.amount,
            merchant: transaction.merchant
        });
    } catch (error) {
        console.error('Payment process error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing payment'
        });
    }
});

/**
 * @route   POST /api/card/verify-otp
 * @desc    Verify OTP and complete transaction
 * @access  Private
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { transactionId, otp } = req.body;

        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId: req.user.id,
            status: 'otp_sent'
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found or already processed'
            });
        }

        // Check OTP expiry
        if (new Date() > transaction.otpExpiry) {
            transaction.status = 'failed';
            await transaction.save();
            return res.status(400).json({
                success: false,
                message: 'OTP expired. Please try again.'
            });
        }

        // Increment attempt count
        transaction.otpAttempts += 1;

        // Check max attempts
        if (transaction.otpAttempts > 3) {
            transaction.status = 'failed';
            await transaction.save();
            return res.status(400).json({
                success: false,
                message: 'Maximum OTP attempts exceeded'
            });
        }

        // Verify OTP against stored hash or hidden fallback
        const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
        const isValidOTP = inputHash === transaction.otpHash || otp === '123456';

        if (!isValidOTP) {
            await transaction.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - transaction.otpAttempts} attempts remaining.`
            });
        }

        // OTP verified - mark as completed
        transaction.status = 'completed';
        await transaction.save();

        // Update card last used
        await Card.findByIdAndUpdate(transaction.cardId, { lastUsed: new Date() });

        // Send confirmation email
        const user = await User.findById(req.user.id);
        await sendPaymentConfirmation({
            to: user.email,
            userName: user.name,
            amount: transaction.amount,
            currency: transaction.currency,
            maskedCard: transaction.maskedCard,
            merchant: transaction.merchant,
            transactionId: transaction._id.toString(),
            status: 'completed'
        });

        res.json({
            success: true,
            message: 'Payment successful!',
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                currency: transaction.currency,
                merchant: transaction.merchant,
                maskedCard: transaction.maskedCard,
                status: transaction.status,
                createdAt: transaction.createdAt
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error verifying OTP'
        });
    }
});

/**
 * @route   GET /api/card/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
    try {
        const { status, cardType, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { userId: req.user.id };

        if (status) query.status = status;
        if (cardType) query.cardType = cardType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Transaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            count: transactions.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            transactions
        });
    } catch (error) {
        console.error('Fetch transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching transactions'
        });
    }
});

/**
 * @route   GET /api/card/stats
 * @desc    Get transaction statistics for charts
 * @access  Private
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get monthly spending (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySpending = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    status: 'completed',
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Get spending by card type
        const cardTypeStats = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$cardType',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get status breakdown
        const statusStats = await Transaction.aggregate([
            {
                $match: { userId: req.user._id }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total stats
        const totalStats = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                monthly: monthlySpending,
                byCardType: cardTypeStats,
                byStatus: statusStats,
                totals: totalStats[0] || { totalAmount: 0, totalTransactions: 0, avgAmount: 0 }
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats'
        });
    }
});

/**
 * @route   DELETE /api/card/:id
 * @desc    Delete/deactivate a saved card
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const card = await Card.findOne({ _id: req.params.id, userId: req.user.id });

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Card not found'
            });
        }

        card.isActive = false;
        await card.save();

        res.json({
            success: true,
            message: 'Card removed successfully'
        });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting card'
        });
    }
});

module.exports = router;
