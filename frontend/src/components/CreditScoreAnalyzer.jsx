import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    CircularProgress,
    LinearProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    AccountBalance,
    Payment,
    Warning,
    CheckCircle,
    History,
    Speed
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CreditScoreAnalyzer = () => {
    const { api } = useAuth();
    const [creditScore, setCreditScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paybackDialog, setPaybackDialog] = useState(false);
    const [spendDialog, setSpendDialog] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [spendAmount, setSpendAmount] = useState('');
    const [spendMerchant, setSpendMerchant] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchCreditScore();
    }, []);

    const fetchCreditScore = async () => {
        try {
            const response = await api.get('/credit/score');
            if (response.data.success) {
                setCreditScore(response.data.creditScore);
            }
        } catch (error) {
            console.error('Error fetching credit score:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayback = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        setActionLoading(true);
        try {
            const response = await api.post('/credit/payback', { amount: parseFloat(payAmount) });
            if (response.data.success) {
                toast.success(response.data.message);
                setCreditScore(response.data.creditScore);
                setPaybackDialog(false);
                setPayAmount('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Payment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSpend = async () => {
        if (!spendAmount || parseFloat(spendAmount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        setActionLoading(true);
        try {
            const response = await api.post('/credit/spend', {
                amount: parseFloat(spendAmount),
                merchant: spendMerchant || 'Online Purchase'
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setCreditScore(response.data.creditScore);
                setSpendDialog(false);
                setSpendAmount('');
                setSpendMerchant('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Transaction failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 800) return '#4caf50';
        if (score >= 700) return '#8bc34a';
        if (score >= 600) return '#ff9800';
        if (score >= 500) return '#ff5722';
        return '#f44336';
    };

    const getScoreLabel = (score) => {
        if (score >= 800) return 'Excellent';
        if (score >= 700) return 'Good';
        if (score >= 600) return 'Fair';
        if (score >= 500) return 'Poor';
        return 'Very Poor';
    };

    const getRiskBadgeColor = (risk) => {
        const colors = {
            excellent: 'success',
            good: 'info',
            fair: 'warning',
            poor: 'error',
            very_poor: 'error'
        };
        return colors[risk] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const score = creditScore?.score || 750;
    const scorePercentage = ((score - 300) / 600) * 100;
    const utilizationPercentage = creditScore?.totalCreditLimit > 0
        ? (creditScore.totalUtilized / creditScore.totalCreditLimit) * 100
        : 0;

    const historyData = (creditScore?.history || [])
        .slice(-20)
        .map((h, i) => ({
            name: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            score: h.score,
            change: h.change
        }));

    return (
        <Box>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Credit Score Analyzer
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
                    Monitor your credit health and manage payments
                </Typography>
            </motion.div>

            <Grid container spacing={3}>
                {/* Credit Score Gauge */}
                <Grid item xs={12} md={5}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Paper
                            sx={{
                                p: 4,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: `linear-gradient(90deg, #f44336, #ff9800, #4caf50)`,
                            }} />

                            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
                                Your Credit Score
                            </Typography>

                            {/* Circular Score Display */}
                            <Box sx={{ position: 'relative', display: 'inline-flex', my: 3 }}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={200}
                                    thickness={4}
                                    sx={{ color: 'rgba(255,255,255,0.05)' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={scorePercentage}
                                    size={200}
                                    thickness={4}
                                    sx={{
                                        color: getScoreColor(score),
                                        position: 'absolute',
                                        left: 0,
                                        '& .MuiCircularProgress-circle': {
                                            strokeLinecap: 'round',
                                        }
                                    }}
                                />
                                <Box sx={{
                                    top: 0, left: 0, bottom: 0, right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            color: getScoreColor(score),
                                            lineHeight: 1
                                        }}
                                    >
                                        {score}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                        out of 900
                                    </Typography>
                                </Box>
                            </Box>

                            <Chip
                                icon={<Speed />}
                                label={getScoreLabel(score)}
                                color={getRiskBadgeColor(creditScore?.riskLevel)}
                                sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5, px: 1 }}
                            />

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ color: '#f44336' }}>300</Typography>
                                <Box sx={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 4,
                                    background: 'linear-gradient(90deg, #f44336, #ff5722, #ff9800, #8bc34a, #4caf50)',
                                    position: 'relative',
                                    maxWidth: 200
                                }}>
                                    <Box sx={{
                                        position: 'absolute',
                                        left: `${scorePercentage}%`,
                                        top: -4,
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        background: '#fff',
                                        border: `3px solid ${getScoreColor(score)}`,
                                        transform: 'translateX(-50%)'
                                    }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: '#4caf50' }}>900</Typography>
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} md={7}>
                    <Grid container spacing={2}>
                        {/* Credit Utilization */}
                        <Grid item xs={12}>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Paper
                                    sx={{
                                        p: 3,
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 3,
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                                        Credit Utilization
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            ₹{(creditScore?.totalUtilized || 0).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            / ₹{(creditScore?.totalCreditLimit || 50000).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(utilizationPercentage, 100)}
                                        sx={{
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 5,
                                                background: utilizationPercentage > 70
                                                    ? 'linear-gradient(90deg, #ff9800, #f44336)'
                                                    : 'linear-gradient(90deg, #667eea, #764ba2)'
                                            }
                                        }}
                                    />
                                    <Typography variant="caption" sx={{
                                        color: utilizationPercentage > 70 ? '#ff9800' : 'rgba(255,255,255,0.5)',
                                        mt: 0.5,
                                        display: 'block'
                                    }}>
                                        {utilizationPercentage.toFixed(1)}% utilized
                                        {utilizationPercentage > 70 && ' ⚠️ High utilization affects your score'}
                                    </Typography>
                                </Paper>
                            </motion.div>
                        </Grid>

                        {/* Stats Grid */}
                        {[
                            {
                                icon: <Warning />,
                                label: 'Outstanding Due',
                                value: `₹${(creditScore?.totalDue || 0).toLocaleString()}`,
                                color: creditScore?.totalDue > 0 ? '#ff9800' : '#4caf50',
                                sub: creditScore?.nextDueDate
                                    ? `Due by ${new Date(creditScore.nextDueDate).toLocaleDateString()}`
                                    : 'No pending dues'
                            },
                            {
                                icon: <CheckCircle />,
                                label: 'On-time Payments',
                                value: creditScore?.onTimePayments || 0,
                                color: '#4caf50',
                                sub: 'Payments made on time'
                            },
                            {
                                icon: <TrendingDown />,
                                label: 'Late Payments',
                                value: creditScore?.latePayments || 0,
                                color: '#f44336',
                                sub: 'Payments made late'
                            },
                            {
                                icon: <AccountBalance />,
                                label: 'Missed Payments',
                                value: creditScore?.missedPayments || 0,
                                color: '#f44336',
                                sub: 'Severely impacts score'
                            }
                        ].map((stat, index) => (
                            <Grid item xs={6} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.05 }}
                                >
                                    <Paper
                                        sx={{
                                            p: 2.5,
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                {stat.label}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color }}>
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {stat.sub}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            startIcon={<Payment />}
                            onClick={() => setSpendDialog(true)}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                px: 4, py: 1.5, borderRadius: 2
                            }}
                        >
                            Simulate Spending
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AccountBalance />}
                            onClick={() => setPaybackDialog(true)}
                            disabled={!creditScore?.totalDue || creditScore.totalDue <= 0}
                            sx={{
                                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                px: 4, py: 1.5, borderRadius: 2
                            }}
                        >
                            Pay Back Bill
                        </Button>
                    </Box>
                </Grid>

                {/* Score History Chart */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Score History
                            </Typography>
                            {historyData.length > 1 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={getScoreColor(score)} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={getScoreColor(score)} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                        <YAxis domain={[300, 900]} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'rgba(26,26,46,0.95)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke={getScoreColor(score)}
                                            fill="url(#scoreGradient)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.4)' }}>
                                    Score history will appear here after transactions
                                </Box>
                            )}
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Recent Score Changes */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Recent Score Changes
                            </Typography>
                            <List>
                                {(creditScore?.history || []).slice(-10).reverse().map((entry, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 1,
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <ListItemIcon>
                                            {entry.change >= 0 ? (
                                                <TrendingUp sx={{ color: '#4caf50' }} />
                                            ) : (
                                                <TrendingDown sx={{ color: '#f44336' }} />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={entry.reason}
                                            secondary={new Date(entry.date).toLocaleString()}
                                            sx={{
                                                '& .MuiListItemText-primary': { fontWeight: 500 },
                                                '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.4)' }
                                            }}
                                        />
                                        <Chip
                                            label={`${entry.change >= 0 ? '+' : ''}${entry.change}`}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                color: entry.change >= 0 ? '#4caf50' : '#f44336',
                                                background: entry.change >= 0
                                                    ? 'rgba(76,175,80,0.1)'
                                                    : 'rgba(244,67,54,0.1)',
                                                border: `1px solid ${entry.change >= 0 ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`
                                            }}
                                        />
                                    </ListItem>
                                ))}
                                {(!creditScore?.history || creditScore.history.length === 0) && (
                                    <Box sx={{ textAlign: 'center', py: 3, color: 'rgba(255,255,255,0.4)' }}>
                                        No score changes yet
                                    </Box>
                                )}
                            </List>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>

            {/* Spend Dialog */}
            <Dialog
                open={spendDialog}
                onClose={() => setSpendDialog(false)}
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3, minWidth: 400
                    }
                }}
            >
                <DialogTitle>💳 Simulate Credit Card Spending</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                        This simulates using your credit card. The amount will be added to your outstanding dues.
                        Pay it back before the due date to maintain your credit score!
                    </Typography>
                    <TextField
                        fullWidth
                        label="Amount (₹)"
                        type="number"
                        value={spendAmount}
                        onChange={(e) => setSpendAmount(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="Merchant Name"
                        value={spendMerchant}
                        onChange={(e) => setSpendMerchant(e.target.value)}
                        placeholder="e.g., Amazon, Flipkart"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSpendDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSpend}
                        disabled={actionLoading}
                        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Spend'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payback Dialog */}
            <Dialog
                open={paybackDialog}
                onClose={() => setPaybackDialog(false)}
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3, minWidth: 400
                    }
                }}
            >
                <DialogTitle>💰 Pay Credit Card Bill</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                        Outstanding: <strong style={{ color: '#ff9800' }}>₹{(creditScore?.totalDue || 0).toLocaleString()}</strong>
                        {creditScore?.nextDueDate && (
                            <> | Due by: <strong>{new Date(creditScore.nextDueDate).toLocaleDateString()}</strong></>
                        )}
                    </Typography>
                    <TextField
                        fullWidth
                        label="Payment Amount (₹)"
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPayAmount(String(Math.ceil((creditScore?.totalDue || 0) * 0.1)))}
                        >
                            Min (10%)
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPayAmount(String(Math.ceil((creditScore?.totalDue || 0) * 0.5)))}
                        >
                            Half
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPayAmount(String(creditScore?.totalDue || 0))}
                        >
                            Full
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaybackDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handlePayback}
                        disabled={actionLoading}
                        sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Pay Now'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreditScoreAnalyzer;
