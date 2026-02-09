const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
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

        // Get card counts for each user
        const usersWithCards = await Promise.all(
            users.map(async (user) => {
                const cardCount = await Card.countDocuments({ userId: user._id, isActive: true });
                const transactionCount = await Transaction.countDocuments({ userId: user._id });
                return {
                    ...user.toObject(),
                    cardCount,
                    transactionCount
                };
            })
        );

        res.json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            users: usersWithCards
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
 * @desc    Get user details with cards
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

        const cards = await Card.find({ userId: user._id }).select('-cardNumberHash');
        const transactions = await Transaction.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            user,
            cards,
            recentTransactions: transactions
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
        const {
            status,
            cardType,
            startDate,
            endDate,
            userId,
            page = 1,
            limit = 20
        } = req.query;

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
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/stats', async (req, res) => {
    try {
        // Overall counts
        const [userCount, cardCount, transactionCount] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Card.countDocuments({ isActive: true }),
            Transaction.countDocuments()
        ]);

        // Transaction stats by status
        const statusStats = await Transaction.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Monthly transactions (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Transaction.aggregate([
            {
                $match: { createdAt: { $gte: sixMonthsAgo } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Card type distribution
        const cardTypeStats = await Card.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$cardType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent transactions
        const recentTransactions = await Transaction.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        // Total revenue
        const revenueStats = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                users: userCount,
                cards: cardCount,
                transactions: transactionCount,
                byStatus: statusStats,
                monthly: monthlyStats,
                byCardType: cardTypeStats,
                revenue: revenueStats[0] || { total: 0, count: 0 },
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching admin stats'
        });
    }
});

/**
 * @route   GET /api/admin/export
 * @desc    Export transactions as CSV
 * @access  Admin
 */
router.get('/export', async (req, res) => {
    try {
        const { startDate, endDate, format = 'csv' } = req.query;

        const query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        // Generate CSV
        const headers = ['ID', 'Date', 'User', 'Email', 'Amount', 'Currency', 'Merchant', 'Card Type', 'Masked Card', 'Status'];
        const csvRows = [headers.join(',')];

        for (const t of transactions) {
            const row = [
                t._id,
                t.createdAt.toISOString(),
                t.userId?.name || 'N/A',
                t.userId?.email || 'N/A',
                t.amount,
                t.currency,
                `"${t.merchant}"`,
                t.cardType,
                t.maskedCard,
                t.status
            ];
            csvRows.push(row.join(','));
        }

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error exporting data'
        });
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
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent self-demotion
        if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot demote yourself'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating role'
        });
    }
});

module.exports = router;
