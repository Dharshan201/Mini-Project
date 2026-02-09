import { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Button,
    Chip,
    Pagination,
    CircularProgress,
    InputAdornment,
    Grid
} from '@mui/material';
import { Search, FilterList, Download } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const TransactionHistory = () => {
    const { api } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: '',
        cardType: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchTransactions();
    }, [page, filters]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 10,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v)
                )
            });

            const response = await api.get(`/card/transactions?${params}`);

            if (response.data.success) {
                setTransactions(response.data.transactions);
                setTotalPages(response.data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
        setPage(1);
    };

    const handleExport = () => {
        // Create CSV content
        const headers = ['Date', 'Transaction ID', 'Amount', 'Merchant', 'Card', 'Type', 'Status'];
        const rows = transactions.map(t => [
            new Date(t.createdAt).toLocaleString(),
            t._id,
            `${t.currency} ${t.amount}`,
            t.merchant,
            t.maskedCard,
            t.cardType.toUpperCase(),
            t.status
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
            case 'otp_sent':
            case 'otp_verified':
                return 'warning';
            case 'failed':
            case 'rejected':
                return 'error';
            case 'approved':
                return 'info';
            default:
                return 'default';
        }
    };

    const getCardTypeColor = (type) => {
        switch (type) {
            case 'visa':
                return '#1a1f71';
            case 'mastercard':
                return '#eb001b';
            case 'amex':
                return '#007bc1';
            case 'rupay':
                return '#097969';
            default:
                return '#667eea';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Transaction History
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExport}
                    disabled={transactions.length === 0}
                    sx={{
                        borderColor: 'rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)'
                        }
                    }}
                >
                    Export CSV
                </Button>
            </Box>

            {/* Filters */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FilterList sx={{ color: 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Filters
                    </Typography>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Status"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Card Type"
                            value={filters.cardType}
                            onChange={(e) => handleFilterChange('cardType', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="visa">Visa</MenuItem>
                            <MenuItem value="mastercard">MasterCard</MenuItem>
                            <MenuItem value="amex">American Express</MenuItem>
                            <MenuItem value="rupay">RuPay</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="From Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="To Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Transactions Table */}
            <TableContainer
                component={Paper}
                sx={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 5 }}>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            No transactions found
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mt: 1 }}>
                            Make a payment to see your transaction history
                        </Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Transaction ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Merchant</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Card</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction, index) => (
                                <motion.tr
                                    key={transaction._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    component={TableRow}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.02)'
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(transaction.createdAt).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            {new Date(transaction.createdAt).toLocaleTimeString()}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
                                        >
                                            {transaction._id.slice(-10).toUpperCase()}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>{transaction.merchant}</TableCell>

                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: getCardTypeColor(transaction.cardType)
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {transaction.maskedCard}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            ₹{transaction.amount.toFixed(2)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={transaction.status.replace('_', ' ').toUpperCase()}
                                            size="small"
                                            color={getStatusColor(transaction.status)}
                                            sx={{
                                                fontWeight: 600,
                                                fontSize: '10px',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                    </TableCell>
                                </motion.tr>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: 'rgba(255,255,255,0.7)'
                            }
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default TransactionHistory;
