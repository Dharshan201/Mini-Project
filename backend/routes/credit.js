const express = require('express');
const router = express.Router();
const CreditScore = require('../models/CreditScore');
const CreditCardApplication = require('../models/CreditCardApplication');
const { CARD_TIERS } = require('../models/CreditCardApplication');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/credit/score
 * @desc    Get user's credit score
 * @access  Private
 */
router.get('/score', async (req, res) => {
    try {
        let creditScore = await CreditScore.findOne({ userId: req.user.id });

        // Create default credit score if not exists
        if (!creditScore) {
            creditScore = await CreditScore.create({
                userId: req.user.id,
                score: 750,
                history: [{
                    score: 750,
                    change: 0,
                    reason: 'Initial credit score assigned'
                }]
            });
        }

        // Check for missed payments
        creditScore.checkMissedPayment();
        await creditScore.save();

        res.json({
            success: true,
            creditScore
        });
    } catch (error) {
        console.error('Fetch credit score error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching credit score'
        });
    }
});

/**
 * @route   POST /api/credit/spend
 * @desc    Record a spending (simulates credit card usage)
 * @access  Private
 */
router.post('/spend', async (req, res) => {
    try {
        const { amount, merchant } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        let creditScore = await CreditScore.findOne({ userId: req.user.id });
        if (!creditScore) {
            creditScore = await CreditScore.create({ userId: req.user.id });
        }

        // Check if within credit limit
        if (creditScore.totalUtilized + amount > creditScore.totalCreditLimit) {
            return res.status(400).json({
                success: false,
                message: 'Transaction exceeds credit limit'
            });
        }

        creditScore.addSpending(amount);
        await creditScore.save();

        res.json({
            success: true,
            message: `₹${amount} spent at ${merchant || 'Merchant'}. Please pay back before due date.`,
            creditScore
        });
    } catch (error) {
        console.error('Spend error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error recording spending'
        });
    }
});

/**
 * @route   POST /api/credit/payback
 * @desc    Pay back credit card bill
 * @access  Private
 */
router.post('/payback', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment amount'
            });
        }

        let creditScore = await CreditScore.findOne({ userId: req.user.id });
        if (!creditScore) {
            return res.status(404).json({
                success: false,
                message: 'No credit score found'
            });
        }

        if (creditScore.totalDue <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No outstanding dues to pay'
            });
        }

        creditScore.makePayment(amount);
        await creditScore.save();

        res.json({
            success: true,
            message: `Payment of ₹${amount} received successfully`,
            creditScore
        });
    } catch (error) {
        console.error('Payback error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing payment'
        });
    }
});

/**
 * @route   GET /api/credit/history
 * @desc    Get credit score history
 * @access  Private
 */
router.get('/history', async (req, res) => {
    try {
        const creditScore = await CreditScore.findOne({ userId: req.user.id });

        if (!creditScore) {
            return res.json({
                success: true,
                history: []
            });
        }

        res.json({
            success: true,
            history: creditScore.history.sort((a, b) => b.date - a.date)
        });
    } catch (error) {
        console.error('Credit history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching history'
        });
    }
});

/**
 * @route   GET /api/credit/card-tiers
 * @desc    Get available card tiers
 * @access  Private
 */
router.get('/card-tiers', async (req, res) => {
    try {
        res.json({
            success: true,
            tiers: CARD_TIERS
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching card tiers'
        });
    }
});

/**
 * @route   POST /api/credit/apply
 * @desc    Apply for a credit card
 * @access  Private
 */
router.post('/apply', async (req, res) => {
    try {
        const { cardTier, fullName, phone, income, employment, address } = req.body;

        // Validate tier
        if (!CARD_TIERS[cardTier]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid card tier'
            });
        }

        // Check for existing pending/active application for same tier
        const existingApp = await CreditCardApplication.findOne({
            userId: req.user.id,
            cardTier,
            status: { $in: ['pending', 'approved', 'active'] }
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: `You already have a ${existingApp.status} application for this card`
            });
        }

        // Get credit score
        let creditScore = await CreditScore.findOne({ userId: req.user.id });
        if (!creditScore) {
            creditScore = await CreditScore.create({ userId: req.user.id });
        }

        const tierInfo = CARD_TIERS[cardTier];

        // Check minimum credit score requirement
        if (creditScore.score < tierInfo.minCreditScore) {
            return res.status(400).json({
                success: false,
                message: `Minimum credit score of ${tierInfo.minCreditScore} required for ${tierInfo.name}. Your current score: ${creditScore.score}`
            });
        }

        // Create application
        const application = await CreditCardApplication.create({
            userId: req.user.id,
            cardTier,
            applicantDetails: {
                fullName,
                phone,
                income,
                employment,
                address
            },
            creditScoreAtApplication: creditScore.score,
            assignedCreditLimit: tierInfo.creditLimit
        });

        res.status(201).json({
            success: true,
            message: `Application for ${tierInfo.name} submitted successfully!`,
            application
        });
    } catch (error) {
        console.error('Card application error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error submitting application'
        });
    }
});

/**
 * @route   GET /api/credit/applications
 * @desc    Get user's card applications
 * @access  Private
 */
router.get('/applications', async (req, res) => {
    try {
        const applications = await CreditCardApplication.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            applications
        });
    } catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching applications'
        });
    }
});

module.exports = router;
