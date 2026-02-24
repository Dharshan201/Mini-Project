import { Box, Paper, Typography, Grid, List, ListItem, ListItemText, Chip } from '@mui/material';
import { People, CreditCard, Receipt, TrendingUp, Speed, CardMembership } from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#4caf50', '#f44336', '#ff9800', '#00bcd4'];

const AdminOverview = ({ stats }) => {
    const monthlyData = stats?.monthly?.map(item => ({
        name: `${item._id.month}/${item._id.year}`, amount: item.totalAmount, count: item.count
    })) || [];

    const cardTypeData = stats?.byCardType?.map(item => ({
        name: item._id?.toUpperCase() || 'Unknown', value: item.count
    })) || [];

    const creditDistData = stats?.creditScoreDistribution?.map(item => ({
        name: item._id === 300 ? '300-499' : item._id === 500 ? '500-599' : item._id === 600 ? '600-699' : item._id === 700 ? '700-799' : '800-900',
        count: item.count, avg: Math.round(item.avgScore)
    })) || [];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'failed': case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Dashboard Overview</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
                Welcome back, Admin. Here's what's happening with SecurePay.
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                    { icon: <People />, value: stats?.users || 0, label: 'Total Users', color: '#667eea' },
                    { icon: <CreditCard />, value: stats?.cards || 0, label: 'Active Cards', color: '#764ba2' },
                    { icon: <Receipt />, value: stats?.transactions || 0, label: 'Transactions', color: '#4caf50' },
                    { icon: <TrendingUp />, value: `₹${(stats?.revenue?.total || 0).toLocaleString()}`, label: 'Revenue', color: '#ff9800' },
                    { icon: <Speed />, value: Math.round(stats?.avgCreditScore?.avgScore || 750), label: 'Avg Credit Score', color: '#00bcd4' },
                    { icon: <CardMembership />, value: stats?.applications || 0, label: 'Applications', color: '#e91e63' }
                ].map((stat, index) => (
                    <Grid item xs={6} md={4} lg={2} key={index}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                            <Paper sx={{ p: 2.5, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${stat.color}20` } }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.color }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, borderRadius: 1.5, background: `${stat.color}20`, color: stat.color }}>{stat.icon}</Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{stat.value}</Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Monthly Revenue</Typography>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={monthlyData}>
                                    <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#667eea" stopOpacity={0.8} /><stop offset="95%" stopColor="#667eea" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="amount" stroke="#667eea" fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>No data</Box>}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Card Types</Typography>
                        {cardTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart><Pie data={cardTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {cardTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie><Tooltip /></PieChart>
                            </ResponsiveContainer>
                        ) : <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>No data</Box>}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Credit Score Distribution</Typography>
                        {creditDistData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={creditDistData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                                    <Tooltip /><Bar dataKey="count" fill="#00bcd4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>No data</Box>}
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Transactions */}
            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Transactions</Typography>
                <List>
                    {(stats?.recentTransactions || []).slice(0, 5).map((tx, i) => (
                        <ListItem key={i} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <ListItemText
                                primary={`₹${tx.amount?.toFixed(2)} — ${tx.merchant || 'N/A'}`}
                                secondary={`${tx.userId?.name || 'Unknown'} • ${new Date(tx.createdAt).toLocaleString()}`}
                                sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.4)' } }}
                            />
                            <Chip label={tx.status?.replace('_', ' ')} size="small" color={getStatusColor(tx.status)} />
                        </ListItem>
                    ))}
                    {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
                        <Box sx={{ textAlign: 'center', py: 3, color: 'rgba(255,255,255,0.4)' }}>No recent transactions</Box>
                    )}
                </List>
            </Paper>
        </Box>
    );
};

export default AdminOverview;
