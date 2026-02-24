const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const CreditScore = require('../models/CreditScore');
const CreditCardApplication = require('../models/CreditCardApplication');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { sendCardApprovalEmail, sendCardActionEmail } = require('../utils/email');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with credit scores
 * @access  Admin
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Get card counts, transaction counts, and credit scores for each user
        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                const [cardCount, transactionCount, creditScore, totalSpent] = await Promise.all([
                    Card.countDocuments({ userId: user._id, isActive: true }),
                    Transaction.countDocuments({ userId: user._id }),
                    CreditScore.findOne({ userId: user._id }),
                    Transaction.aggregate([
                        { $match: { userId: user._id, status: 'completed' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ])
                ]);
                return {
                    ...user.toObject(),
                    cardCount,
                    transactionCount,
                    creditScore: creditScore?.score || 750,
                    riskLevel: creditScore?.riskLevel || 'good',
                    totalDue: creditScore?.totalDue || 0,
                    totalUtilized: creditScore?.totalUtilized || 0,
                    creditLimit: creditScore?.totalCreditLimit || 50000,
                    totalSpent: totalSpent[0]?.total || 0
                };
            })
        );

        res.json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            users: usersWithDetails
        });
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details with cards and credit score
 * @access  Admin
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [cards, transactions, creditScore, applications] = await Promise.all([
            Card.find({ userId: user._id }).select('-cardNumberHash'),
            Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20),
            CreditScore.findOne({ userId: user._id }),
            CreditCardApplication.find({ userId: user._id }).sort({ createdAt: -1 })
        ]);

        res.json({
            success: true,
            user,
            cards,
            recentTransactions: transactions,
            creditScore,
            applications
        });
    } catch (error) {
        console.error('Fetch user details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user details'
        });
    }
});

/**
 * @route   GET /api/admin/transactions
 * @desc    Get all transactions
 * @access  Admin
 */
router.get('/transactions', async (req, res) => {
    try {
        const { status, cardType, startDate, endDate, userId, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (cardType) query.cardType = cardType;
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('userId', 'name email')
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
 * @route   PUT /api/admin/transaction/:id
 * @desc    Approve or reject a transaction
 * @access  Admin
 */
router.put('/transaction/:id', async (req, res) => {
    try {
        const { action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Action must be either "approve" or "reject"'
            });
        }

        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        if (!['pending', 'otp_verified'].includes(transaction.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot ${action} a transaction with status: ${transaction.status}`
            });
        }

        if (action === 'approve') {
            transaction.status = 'approved';
            transaction.approvedBy = req.user._id;
            transaction.approvedAt = new Date();
        } else {
            transaction.status = 'rejected';
            transaction.rejectionReason = reason || 'Rejected by admin';
        }

        await transaction.save();

        res.json({
            success: true,
            message: `Transaction ${action}d successfully`,
            transaction
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating transaction'
        });
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics with credit scores
 * @access  Admin
 */
router.get('/stats', async (req, res) => {
    try {
        const [userCount, cardCount, transactionCount, applicationCount] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Card.countDocuments({ isActive: true }),
            Transaction.countDocuments(),
            CreditCardApplication.countDocuments()
        ]);

        const statusStats = await Transaction.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
        ]);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Transaction.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const cardTypeStats = await Card.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$cardType', count: { $sum: 1 } } }
        ]);

        const creditScoreStats = await CreditScore.aggregate([
            {
                $bucket: {
                    groupBy: '$score',
                    boundaries: [300, 500, 600, 700, 800, 901],
                    default: 'other',
                    output: { count: { $sum: 1 }, avgScore: { $avg: '$score' } }
                }
            }
        ]);

        const applicationStats = await CreditCardApplication.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const applicationByTier = await CreditCardApplication.aggregate([
            { $group: { _id: '$cardTier', count: { $sum: 1 } } }
        ]);

        const recentTransactions = await Transaction.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        const revenueStats = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const avgCreditScore = await CreditScore.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$score' }, totalDue: { $sum: '$totalDue' } } }
        ]);

        res.json({
            success: true,
            stats: {
                users: userCount,
                cards: cardCount,
                transactions: transactionCount,
                applications: applicationCount,
                byStatus: statusStats,
                monthly: monthlyStats,
                byCardType: cardTypeStats,
                creditScoreDistribution: creditScoreStats,
                applicationStats,
                applicationByTier,
                revenue: revenueStats[0] || { total: 0, count: 0 },
                avgCreditScore: avgCreditScore[0] || { avgScore: 750, totalDue: 0 },
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching admin stats' });
    }
});

/**
 * @route   GET /api/admin/credit-scores
 * @desc    Get all users' credit scores
 * @access  Admin
 */
router.get('/credit-scores', async (req, res) => {
    try {
        const creditScores = await CreditScore.find()
            .populate('userId', 'name email')
            .sort({ score: -1 });

        res.json({ success: true, creditScores });
    } catch (error) {
        console.error('Fetch credit scores error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching credit scores' });
    }
});

/**
 * @route   GET /api/admin/applications
 * @desc    Get all credit card applications
 * @access  Admin
 */
router.get('/applications', async (req, res) => {
    try {
        const { status, tier, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (tier) query.cardTier = tier;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [applications, total] = await Promise.all([
            CreditCardApplication.find(query)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            CreditCardApplication.countDocuments(query)
        ]);

        res.json({
            success: true,
            count: applications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            applications
        });
    } catch (error) {
        console.error('Fetch applications error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching applications' });
    }
});

/**
 * @route   PUT /api/admin/application/:id
 * @desc    Approve or reject a credit card application
 * @access  Admin
 */
router.put('/application/:id', async (req, res) => {
    try {
        const { action, reason, creditLimit } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be either "approve" or "reject"' });
        }

        const application = await CreditCardApplication.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Cannot ${action} an application with status: ${application.status}` });
        }

        if (action === 'approve') {
            application.status = 'approved';
            application.approvedBy = req.user._id;
            application.approvedAt = new Date();
            if (creditLimit) application.assignedCreditLimit = creditLimit;

            // Generate a card number
            const prefix = { silver: '4', gold: '5', platinum: '3', black: '6' };
            const p = prefix[application.cardTier] || '4';
            let num = p;
            for (let i = 1; i < 15; i++) num += Math.floor(Math.random() * 10);
            let sum = 0;
            for (let i = 0; i < num.length; i++) {
                let d = parseInt(num[num.length - 1 - i]);
                if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
                sum += d;
            }
            const checkDigit = (10 - (sum % 10)) % 10;
            const fullCardNumber = num + checkDigit;
            application.cardNumber = fullCardNumber;

            // Create an actual Card document in the database so it can be used for payments
            const crypto = require('crypto');
            const lastFour = fullCardNumber.slice(-4);
            const maskedNumber = `****-****-****-${lastFour}`;
            const cardHash = crypto.createHash('sha256').update(fullCardNumber).digest('hex');

            // Determine card type based on prefix
            let cardType = 'visa';
            if (fullCardNumber.startsWith('5')) cardType = 'mastercard';
            else if (fullCardNumber.startsWith('3')) cardType = 'amex';
            else if (fullCardNumber.startsWith('6')) cardType = 'rupay';

            // Generate expiry date (3 years from now)
            const now = new Date();
            const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');
            const expiryYear = String((now.getFullYear() + 3) % 100).padStart(2, '0');

            await Card.create({
                userId: application.userId,
                cardNumber: maskedNumber,
                cardNumberHash: cardHash,
                lastFourDigits: lastFour,
                cardHolder: application.applicantDetails?.fullName?.toUpperCase() || 'CARD HOLDER',
                expiryDate: `${expiryMonth}/${expiryYear}`,
                cardType,
                isActive: true
            });

            // Generate a random CVV (3 digits, or 4 for amex)
            const cvvLength = cardType === 'amex' ? 4 : 3;
            let cvv = '';
            for (let i = 0; i < cvvLength; i++) cvv += Math.floor(Math.random() * 10);

            // Send card details email to the client
            const cardUser = await User.findById(application.userId);
            if (cardUser) {
                await sendCardApprovalEmail({
                    to: cardUser.email,
                    userName: cardUser.name,
                    cardNumber: fullCardNumber,
                    cvv,
                    expiryDate: `${expiryMonth}/${expiryYear}`,
                    cardTier: application.cardTier,
                    creditLimit: application.assignedCreditLimit,
                    cardHolder: application.applicantDetails?.fullName?.toUpperCase() || cardUser.name.toUpperCase()
                });
                console.log(`📧 Card approval email sent to ${cardUser.email}`);
            }

            // Update user's credit limit
            let creditScore = await CreditScore.findOne({ userId: application.userId });
            if (creditScore) {
                creditScore.totalCreditLimit = application.assignedCreditLimit;
                creditScore.updateScore(20, `${application.cardTier.charAt(0).toUpperCase() + application.cardTier.slice(1)} card approved`);
                await creditScore.save();
            }
        } else {
            application.status = 'rejected';
            application.rejectionReason = reason || 'Application does not meet requirements';
        }

        await application.save();

        res.json({ success: true, message: `Application ${action}d successfully`, application });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ success: false, message: 'Server error updating application' });
    }
});

/**
 * @route   GET /api/admin/export
 * @desc    Export transactions as CSV
 * @access  Admin
 */
router.get('/export', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        const headers = ['ID', 'Date', 'User', 'Email', 'Amount', 'Currency', 'Merchant', 'Card Type', 'Masked Card', 'Status'];
        const csvRows = [headers.join(',')];

        for (const t of transactions) {
            csvRows.push([t._id, t.createdAt.toISOString(), t.userId?.name || 'N/A', t.userId?.email || 'N/A', t.amount, t.currency, `"${t.merchant}"`, t.cardType, t.maskedCard, t.status].join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Server error exporting data' });
    }
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
        }

        user.role = role;
        await user.save();

        res.json({ success: true, message: `User role updated to ${role}`, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Server error updating role' });
    }
});

/**
 * @route   PUT /api/admin/card/:id/block
 * @desc    Block/Unblock a user's card
 * @access  Admin
 */
router.put('/card/:id/block', async (req, res) => {
    try {
        const { reason } = req.body;
        const card = await Card.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Card not found' });
        }

        // Toggle active status
        card.isActive = !card.isActive;
        await card.save();

        const action = card.isActive ? 'unblocked' : 'blocked';

        // Send email notification to client
        const cardUser = await User.findById(card.userId);
        if (cardUser && !card.isActive) {
            await sendCardActionEmail({
                to: cardUser.email,
                userName: cardUser.name,
                maskedCard: card.cardNumber,
                cardType: card.cardType,
                action: 'blocked',
                reason: reason || 'Card blocked by administrator'
            });
        }

        res.json({
            success: true,
            message: `Card ${action} successfully`,
            card: { id: card._id, isActive: card.isActive }
        });
    } catch (error) {
        console.error('Block card error:', error);
        res.status(500).json({ success: false, message: 'Server error blocking card' });
    }
});

/**
 * @route   DELETE /api/admin/card/:id
 * @desc    Permanently delete a user's card
 * @access  Admin
 */
router.delete('/card/:id', async (req, res) => {
    try {
        const { reason } = req.body;
        const card = await Card.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ success: false, message: 'Card not found' });
        }

        // Send email notification to client before deleting
        const cardUser = await User.findById(card.userId);
        if (cardUser) {
            await sendCardActionEmail({
                to: cardUser.email,
                userName: cardUser.name,
                maskedCard: card.cardNumber,
                cardType: card.cardType,
                action: 'deleted',
                reason: reason || 'Card deleted by administrator'
            });
        }

        await Card.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Card deleted successfully'
        });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting card' });
    }
});

module.exports = router;
