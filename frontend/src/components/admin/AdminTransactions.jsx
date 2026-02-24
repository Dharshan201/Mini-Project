import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Pagination, CircularProgress, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { CheckCircle, Cancel, Download } from '@mui/icons-material';

const getStatusColor = (s) => {
    switch (s) { case 'completed': case 'approved': return 'success'; case 'pending': case 'otp_sent': case 'otp_verified': return 'warning'; case 'failed': case 'rejected': return 'error'; default: return 'default'; }
};

const AdminTransactions = ({
    transactions, loading, filters, setFilters, transactionPage, setTransactionPage,
    totalTransactionPages, actionDialog, setActionDialog, handleTransactionAction, actionLoading, handleExport
}) => {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Transaction Management</Typography>
                <Button variant="outlined" startIcon={<Download />} onClick={handleExport}
                    sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>Export CSV</Button>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
                Monitor, approve, or reject payment transactions across all users.
            </Typography>

            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField select size="small" label="Filter by Status" value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })} sx={{ minWidth: 180 }}>
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="otp_verified">OTP Verified</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 700, color: 'rgba(255,255,255,0.8)' } }}>
                                    <TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Amount</TableCell>
                                    <TableCell>Card</TableCell><TableCell>Merchant</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx._id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                        <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{tx.userId?.name || 'N/A'}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>₹{tx.amount?.toFixed(2)}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{tx.maskedCard}</TableCell>
                                        <TableCell>{tx.merchant}</TableCell>
                                        <TableCell><Chip label={tx.status?.replace('_', ' ')} size="small" color={getStatusColor(tx.status)} /></TableCell>
                                        <TableCell>
                                            {['pending', 'otp_verified'].includes(tx.status) && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" onClick={() => setActionDialog({ open: true, transaction: tx, action: 'approve' })} sx={{ color: '#4caf50' }}><CheckCircle /></IconButton>
                                                    <IconButton size="small" onClick={() => setActionDialog({ open: true, transaction: tx, action: 'reject' })} sx={{ color: '#f44336' }}><Cancel /></IconButton>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {transactions.length === 0 && (
                                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.4)' }}>No transactions found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {totalTransactionPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={totalTransactionPages} page={transactionPage} onChange={(_, v) => setTransactionPage(v)} color="primary" />
                    </Box>
                )}
            </Paper>

            {/* Transaction Action Dialog */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, transaction: null, action: '' })}
                PaperProps={{ sx: { background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                <DialogTitle>{actionDialog.action === 'approve' ? '✅ Approve Transaction?' : '❌ Reject Transaction?'}</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to {actionDialog.action} transaction for <strong>₹{actionDialog.transaction?.amount?.toFixed(2)}</strong>?</Typography>
                    <Box sx={{ mt: 2, p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>User: {actionDialog.transaction?.userId?.name || 'N/A'}</Typography><br />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Merchant: {actionDialog.transaction?.merchant || 'N/A'}</Typography><br />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Card: {actionDialog.transaction?.maskedCard}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setActionDialog({ open: false, transaction: null, action: '' })}>Cancel</Button>
                    <Button variant="contained" onClick={handleTransactionAction} disabled={actionLoading}
                        sx={{ background: actionDialog.action === 'approve' ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }}>
                        {actionLoading ? <CircularProgress size={20} /> : actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminTransactions;
