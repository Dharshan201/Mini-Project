import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    TextField,
    MenuItem,
    Pagination,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import {
    ArrowBack,
    People,
    CreditCard,
    Receipt,
    Download,
    CheckCircle,
    Cancel,
    Refresh,
    TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#667eea', '#764ba2', '#4caf50', '#f44336', '#ff9800'];

const AdminPanel = () => {
    const navigate = useNavigate();
    const { api } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [userPage, setUserPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);
    const [totalUserPages, setTotalUserPages] = useState(1);
    const [totalTransactionPages, setTotalTransactionPages] = useState(1);
    const [filters, setFilters] = useState({ status: '' });
    const [actionDialog, setActionDialog] = useState({ open: false, transaction: null, action: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchTransactions();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [userPage]);

    useEffect(() => {
        fetchTransactions();
    }, [transactionPage, filters]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/users?page=${userPage}&limit=10`);
            if (response.data.success) {
                setUsers(response.data.users);
                setTotalUserPages(response.data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: transactionPage,
                limit: 10,
                ...(filters.status && { status: filters.status })
            });
            const response = await api.get(`/admin/transactions?${params}`);
            if (response.data.success) {
                setTransactions(response.data.transactions);
                setTotalTransactionPages(response.data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionAction = async () => {
        setActionLoading(true);
        try {
            const { transaction, action } = actionDialog;
            const response = await api.put(`/admin/transaction/${transaction._id}`, {
                action,
                reason: action === 'reject' ? 'Rejected by admin' : undefined
            });

            if (response.data.success) {
                toast.success(`Transaction ${action}d successfully`);
                fetchTransactions();
                fetchStats();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
            setActionDialog({ open: false, transaction: null, action: '' });
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Export downloaded successfully');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending':
            case 'otp_sent':
            case 'otp_verified': return 'warning';
            case 'failed':
            case 'rejected': return 'error';
            case 'approved': return 'info';
            default: return 'default';
        }
    };

    // Format data for charts
    const monthlyData = stats?.monthly?.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        amount: item.totalAmount,
        count: item.count
    })) || [];

    const cardTypeData = stats?.byCardType?.map(item => ({
        name: item._id?.toUpperCase() || 'Unknown',
        value: item.count
    })) || [];

    return (
        <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton
                    onClick={() => navigate('/dashboard')}
                    sx={{
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': { background: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Admin Panel
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Manage users, transactions, and system overview
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<Refresh />}
                        onClick={() => { fetchStats(); fetchUsers(); fetchTransactions(); }}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleExport}
                        sx={{
                            borderColor: 'rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.8)'
                        }}
                    >
                        Export All
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { icon: <People />, value: stats?.users || 0, label: 'Total Users', color: '#667eea' },
                    { icon: <CreditCard />, value: stats?.cards || 0, label: 'Active Cards', color: '#764ba2' },
                    { icon: <Receipt />, value: stats?.transactions || 0, label: 'Transactions', color: '#4caf50' },
                    { icon: <TrendingUp />, value: `₹${(stats?.revenue?.total || 0).toLocaleString()}`, label: 'Total Revenue', color: '#ff9800' }
                ].map((stat, index) => (
                    <Grid item xs={6} md={3} key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
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
                                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.color }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        background: `${stat.color}20`,
                                        color: stat.color
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                            {stat.value}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            {stat.label}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Monthly Revenue
                        </Typography>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                    <YAxis stroke="rgba(255,255,255,0.5)" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="amount" stroke="#667eea" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>No data</Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 3,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                            Cards by Type
                        </Typography>
                        {cardTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={cardTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {cardTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.5)' }}>No data</Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper
                sx={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden'
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
                        '& .Mui-selected': { color: '#667eea' }
                    }}
                >
                    <Tab label="Users" icon={<People />} iconPosition="start" />
                    <Tab label="Transactions" icon={<Receipt />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Users Tab */}
                    {activeTab === 0 && (
                        <>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>User</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Role</TableCell>
                                                <TableCell>Cards</TableCell>
                                                <TableCell>Transactions</TableCell>
                                                <TableCell>Joined</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user._id} hover>
                                                    <TableCell>{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={user.role}
                                                            size="small"
                                                            color={user.role === 'admin' ? 'warning' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{user.cardCount || 0}</TableCell>
                                                    <TableCell>{user.transactionCount || 0}</TableCell>
                                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {totalUserPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalUserPages}
                                        page={userPage}
                                        onChange={(_, value) => setUserPage(value)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 1 && (
                        <>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <TextField
                                    select
                                    size="small"
                                    label="Status"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    sx={{ minWidth: 150 }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="otp_verified">OTP Verified</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="failed">Failed</MenuItem>
                                    <MenuItem value="rejected">Rejected</MenuItem>
                                </TextField>
                            </Box>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>User</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Card</TableCell>
                                                <TableCell>Merchant</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx._id} hover>
                                                    <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell>{tx.userId?.name || 'N/A'}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>₹{tx.amount.toFixed(2)}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>{tx.maskedCard}</TableCell>
                                                    <TableCell>{tx.merchant}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={tx.status.replace('_', ' ')}
                                                            size="small"
                                                            color={getStatusColor(tx.status)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {['pending', 'otp_verified'].includes(tx.status) && (
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setActionDialog({ open: true, transaction: tx, action: 'approve' })}
                                                                    sx={{ color: '#4caf50' }}
                                                                >
                                                                    <CheckCircle />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setActionDialog({ open: true, transaction: tx, action: 'reject' })}
                                                                    sx={{ color: '#f44336' }}
                                                                >
                                                                    <Cancel />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {totalTransactionPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination
                                        count={totalTransactionPages}
                                        page={transactionPage}
                                        onChange={(_, value) => setTransactionPage(value)}
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Paper>

            {/* Action Confirmation Dialog */}
            <Dialog
                open={actionDialog.open}
                onClose={() => setActionDialog({ open: false, transaction: null, action: '' })}
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle>
                    {actionDialog.action === 'approve' ? 'Approve Transaction?' : 'Reject Transaction?'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to {actionDialog.action} transaction for{' '}
                        <strong>₹{actionDialog.transaction?.amount?.toFixed(2)}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({ open: false, transaction: null, action: '' })}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleTransactionAction}
                        disabled={actionLoading}
                        sx={{
                            background: actionDialog.action === 'approve'
                                ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                                : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)'
                        }}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : actionDialog.action}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel;
