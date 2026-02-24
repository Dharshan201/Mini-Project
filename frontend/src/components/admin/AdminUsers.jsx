import { useState } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Pagination, CircularProgress, IconButton, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, List, ListItem, ListItemText, ListItemIcon,
    Tooltip, Divider
} from '@mui/material';
import { Visibility, CreditCard, CardMembership, Block, DeleteForever, LockOpen } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const getRiskColor = (risk) => {
    switch (risk) {
        case 'excellent': return '#4caf50'; case 'good': return '#8bc34a';
        case 'fair': return '#ff9800'; case 'poor': return '#ff5722'; case 'very_poor': return '#f44336';
        default: return '#8bc34a';
    }
};
const getStatusColor = (s) => {
    switch (s) { case 'completed': case 'approved': case 'active': return 'success'; case 'pending': return 'warning'; case 'failed': case 'rejected': return 'error'; default: return 'default'; }
};
const getTierColor = (t) => {
    switch (t) { case 'silver': return '#C0C0C0'; case 'gold': return '#FFD700'; case 'platinum': return '#E5E4E2'; case 'black': return '#333'; default: return '#667eea'; }
};

const AdminUsers = ({ users, loading, userSearch, setUserSearch, userPage, setUserPage, totalUserPages, fetchUserDetails, userDetailDialog, setUserDetailDialog, onCardAction }) => {
    const { api } = useAuth();
    const [cardActionDialog, setCardActionDialog] = useState({ open: false, card: null, action: '', userName: '' });
    const [cardActionLoading, setCardActionLoading] = useState(false);

    const handleCardAction = async () => {
        setCardActionLoading(true);
        try {
            const { card, action } = cardActionDialog;
            if (action === 'delete') {
                await api.delete(`/admin/card/${card._id}`, { data: { reason: 'Removed by administrator' } });
                toast.success('Card deleted successfully — Email sent to client');
            } else if (action === 'block') {
                await api.put(`/admin/card/${card._id}/block`, { reason: 'Blocked by administrator' });
                toast.success(`Card ${card.isActive ? 'blocked' : 'unblocked'} successfully${card.isActive ? ' — Email sent to client' : ''}`);
            }
            // Refresh user details
            if (userDetailDialog.user?.user?._id) {
                fetchUserDetails(userDetailDialog.user.user._id);
            }
            if (onCardAction) onCardAction();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setCardActionLoading(false);
            setCardActionDialog({ open: false, card: null, action: '', userName: '' });
        }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>User Management</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
                View and manage all registered users, their cards, credit scores, and transaction history.
            </Typography>

            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ mb: 2 }}>
                    <TextField size="small" placeholder="Search users by name or email..." value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                        sx={{ minWidth: 300 }} />
                </Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 700, color: 'rgba(255,255,255,0.8)' } }}>
                                    <TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
                                    <TableCell>Cards</TableCell><TableCell>Credit Score</TableCell>
                                    <TableCell>Total Due</TableCell><TableCell>Total Spent</TableCell><TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '0.85rem' }}>
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                {user.name}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>{user.email}</TableCell>
                                        <TableCell><Chip label={user.role} size="small" color={user.role === 'admin' ? 'warning' : 'default'} /></TableCell>
                                        <TableCell>{user.cardCount || 0}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ fontWeight: 600, color: getRiskColor(user.riskLevel) }}>{user.creditScore}</Typography>
                                                <Chip label={user.riskLevel?.replace('_', ' ')} size="small"
                                                    sx={{ fontSize: '0.65rem', height: 20, background: `${getRiskColor(user.riskLevel)}20`, color: getRiskColor(user.riskLevel), border: `1px solid ${getRiskColor(user.riskLevel)}40` }} />
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: user.totalDue > 0 ? '#ff9800' : '#4caf50', fontWeight: 600 }}>₹{(user.totalDue || 0).toLocaleString()}</TableCell>
                                        <TableCell>₹{(user.totalSpent || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => fetchUserDetails(user._id)} sx={{ color: '#667eea' }}><Visibility /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {totalUserPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={totalUserPages} page={userPage} onChange={(_, v) => setUserPage(v)} color="primary" />
                    </Box>
                )}
            </Paper>

            {/* User Detail Dialog */}
            <Dialog open={userDetailDialog.open} onClose={() => setUserDetailDialog({ open: false, user: null })} maxWidth="md" fullWidth
                PaperProps={{ sx: { background: 'rgba(26, 26, 46, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                {userDetailDialog.user && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>{userDetailDialog.user.user?.name?.charAt(0).toUpperCase()}</Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{userDetailDialog.user.user?.name}</Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{userDetailDialog.user.user?.email}</Typography>
                                </Box>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={3}>
                                {userDetailDialog.user.creditScore && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>📊 Credit Score Details</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={3}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Score</Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 800, color: getRiskColor(userDetailDialog.user.creditScore.riskLevel) }}>{userDetailDialog.user.creditScore.score}</Typography></Grid>
                                                <Grid item xs={3}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Credit Limit</Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>₹{(userDetailDialog.user.creditScore.totalCreditLimit || 0).toLocaleString()}</Typography></Grid>
                                                <Grid item xs={3}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Outstanding</Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>₹{(userDetailDialog.user.creditScore.totalDue || 0).toLocaleString()}</Typography></Grid>
                                                <Grid item xs={3}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Risk Level</Typography>
                                                    <Chip label={userDetailDialog.user.creditScore.riskLevel?.replace('_', ' ').toUpperCase()} sx={{ mt: 0.5, fontWeight: 600, background: `${getRiskColor(userDetailDialog.user.creditScore.riskLevel)}20`, color: getRiskColor(userDetailDialog.user.creditScore.riskLevel) }} /></Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Cards with Block/Delete Actions */}
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                            💳 Cards ({userDetailDialog.user.cards?.length || 0})
                                        </Typography>
                                        {userDetailDialog.user.cards?.length > 0 ? (
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ '& th': { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem' } }}>
                                                        <TableCell>Card</TableCell>
                                                        <TableCell>Holder</TableCell>
                                                        <TableCell>Expiry</TableCell>
                                                        <TableCell>Type</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell align="right">Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {userDetailDialog.user.cards.map((card) => (
                                                        <TableRow key={card._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <CreditCard sx={{ fontSize: 18, color: '#667eea' }} />
                                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                                        •••• {card.lastFourDigits || card.lastFour}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">{card.cardHolder}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{card.expiryDate}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label={card.cardType?.toUpperCase()} size="small"
                                                                    sx={{ fontSize: '0.65rem', height: 22 }} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={card.isActive ? 'Active' : 'Blocked'}
                                                                    size="small"
                                                                    color={card.isActive ? 'success' : 'error'}
                                                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                    <Tooltip title={card.isActive ? 'Block Card' : 'Unblock Card'}>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => setCardActionDialog({
                                                                                open: true, card, action: 'block',
                                                                                userName: userDetailDialog.user.user?.name
                                                                            })}
                                                                            sx={{
                                                                                color: card.isActive ? '#ff9800' : '#4caf50',
                                                                                '&:hover': { background: card.isActive ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)' }
                                                                            }}
                                                                        >
                                                                            {card.isActive ? <Block fontSize="small" /> : <LockOpen fontSize="small" />}
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Delete Card Permanently">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => setCardActionDialog({
                                                                                open: true, card, action: 'delete',
                                                                                userName: userDetailDialog.user.user?.name
                                                                            })}
                                                                            sx={{
                                                                                color: '#f44336',
                                                                                '&:hover': { background: 'rgba(244,67,54,0.1)' }
                                                                            }}
                                                                        >
                                                                            <DeleteForever fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', p: 1 }}>No cards</Typography>
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>📋 Recent Transactions</Typography>
                                        <List dense>
                                            {userDetailDialog.user.recentTransactions?.slice(0, 5).map((tx, i) => (
                                                <ListItem key={i}>
                                                    <ListItemText primary={`₹${tx.amount?.toFixed(2)} - ${tx.merchant}`} secondary={new Date(tx.createdAt).toLocaleString()}
                                                        sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.4)' } }} />
                                                    <Chip label={tx.status} size="small" color={getStatusColor(tx.status)} />
                                                </ListItem>
                                            )) || <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', p: 1 }}>No transactions</Typography>}
                                        </List>
                                    </Paper>
                                </Grid>

                                {userDetailDialog.user.applications?.length > 0 && (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>📝 Card Applications</Typography>
                                            <List dense>
                                                {userDetailDialog.user.applications.map((app, i) => (
                                                    <ListItem key={i}><ListItemIcon sx={{ minWidth: 32 }}><CardMembership sx={{ fontSize: 18, color: getTierColor(app.cardTier) }} /></ListItemIcon>
                                                        <ListItemText primary={`${app.cardTier?.charAt(0).toUpperCase() + app.cardTier?.slice(1)} Card`} secondary={`Applied: ${new Date(app.createdAt).toLocaleDateString()} | Score: ${app.creditScoreAtApplication}`}
                                                            sx={{ '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.4)' } }} />
                                                        <Chip label={app.status} size="small" color={getStatusColor(app.status)} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions><Button onClick={() => setUserDetailDialog({ open: false, user: null })}>Close</Button></DialogActions>
                    </>
                )}
            </Dialog>

            {/* Card Action Confirmation Dialog */}
            <Dialog open={cardActionDialog.open} onClose={() => setCardActionDialog({ open: false, card: null, action: '', userName: '' })}
                PaperProps={{ sx: { background: 'rgba(26, 26, 46, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, minWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {cardActionDialog.action === 'delete' ? '🗑️ Delete Card' : (cardActionDialog.card?.isActive ? '🚫 Block Card' : '🔓 Unblock Card')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Are you sure you want to <strong style={{ color: cardActionDialog.action === 'delete' ? '#f44336' : '#ff9800' }}>
                            {cardActionDialog.action === 'delete' ? 'permanently delete' : (cardActionDialog.card?.isActive ? 'block' : 'unblock')}
                        </strong> this card?
                    </Typography>
                    <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                            •••• {cardActionDialog.card?.lastFourDigits || cardActionDialog.card?.lastFour}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {cardActionDialog.card?.cardType?.toUpperCase()} | {cardActionDialog.card?.cardHolder} | Owner: {cardActionDialog.userName}
                        </Typography>
                    </Paper>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
                    <Typography variant="body2" sx={{ color: cardActionDialog.action === 'delete' ? '#f44336' : '#ff9800' }}>
                        {cardActionDialog.action === 'delete'
                            ? '⚠️ This action is permanent and cannot be undone. An email will be sent to the client.'
                            : (cardActionDialog.card?.isActive
                                ? '⚠️ The card will be deactivated and the client will be notified via email.'
                                : 'The card will be reactivated and available for transactions again.')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setCardActionDialog({ open: false, card: null, action: '', userName: '' })}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCardAction}
                        disabled={cardActionLoading}
                        sx={{
                            background: cardActionDialog.action === 'delete' ? '#f44336' : '#ff9800',
                            '&:hover': { background: cardActionDialog.action === 'delete' ? '#d32f2f' : '#f57c00' }
                        }}
                    >
                        {cardActionLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> :
                            (cardActionDialog.action === 'delete' ? 'Delete Card' : (cardActionDialog.card?.isActive ? 'Block Card' : 'Unblock Card'))}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminUsers;
