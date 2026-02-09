import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#667eea', '#764ba2', '#4caf50', '#f44336', '#ff9800'];

const Charts = () => {
    const { api } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/card/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) {
        return (
            <Box sx={{ textAlign: 'center', p: 5 }}>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    No data available
                </Typography>
            </Box>
        );
    }

    // Format monthly data for chart
    const monthlyData = stats.monthly?.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        amount: item.total,
        count: item.count
    })) || [];

    // Format card type data for pie chart
    const cardTypeData = stats.byCardType?.map(item => ({
        name: item._id?.toUpperCase() || 'Unknown',
        value: item.total
    })) || [];

    // Format status data for bar chart
    const statusData = stats.byStatus?.map(item => ({
        name: item._id?.replace('_', ' ').toUpperCase() || 'Unknown',
        count: item.count
    })) || [];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box
                    sx={{
                        background: 'rgba(26, 26, 46, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        p: 2
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {label}
                    </Typography>
                    {payload.map((item, index) => (
                        <Typography key={index} variant="caption" sx={{ display: 'block', color: item.color }}>
                            {item.name}: {item.value.toLocaleString()}
                        </Typography>
                    ))}
                </Box>
            );
        }
        return null;
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Analytics Dashboard
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                }}
                            />
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#667eea' }}>
                                ₹{(stats.totals?.totalAmount || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                                Total Spending
                            </Typography>
                        </Paper>
                    </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                                }}
                            />
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50' }}>
                                {stats.totals?.totalTransactions || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                                Total Transactions
                            </Typography>
                        </Paper>
                    </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
                                }}
                            />
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800' }}>
                                ₹{(stats.totals?.avgAmount || 0).toFixed(0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                                Average Transaction
                            </Typography>
                        </Paper>
                    </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)'
                                }}
                            />
                            <Typography variant="h3" sx={{ fontWeight: 700, color: '#e91e63' }}>
                                {cardTypeData.length}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                                Card Types Used
                            </Typography>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                {/* Monthly Spending Trend */}
                <Grid item xs={12} lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Monthly Spending Trend
                            </Typography>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                        <YAxis stroke="rgba(255,255,255,0.5)" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#667eea"
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                            name="Amount (₹)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>
                                    No data available
                                </Box>
                            )}
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Card Type Distribution */}
                <Grid item xs={12} lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Spending by Card Type
                            </Typography>
                            {cardTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={cardTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {cardTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>
                                    No data available
                                </Box>
                            )}
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Transaction Status */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Paper
                            sx={{
                                p: 3,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                Transaction Status Breakdown
                            </Typography>
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={statusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                        <YAxis stroke="rgba(255,255,255,0.5)" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Transactions" radius={[8, 8, 0, 0]}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>
                                    No data available
                                </Box>
                            )}
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Charts;
