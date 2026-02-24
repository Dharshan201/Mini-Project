import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Pagination, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';

const getStatusColor = (s) => {
    switch (s) { case 'approved': case 'active': return 'success'; case 'pending': return 'warning'; case 'rejected': return 'error'; default: return 'default'; }
};
const getTierColor = (t) => {
    switch (t) { case 'silver': return '#C0C0C0'; case 'gold': return '#FFD700'; case 'platinum': return '#E5E4E2'; case 'black': return '#333'; default: return '#667eea'; }
};

const AdminApplications = ({
    applications, filters, setFilters, appPage, setAppPage, totalAppPages,
    appActionDialog, setAppActionDialog, handleApplicationAction, actionLoading
}) => {
    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Card Applications</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
                Review and approve or reject credit card applications. Only approved cards are stored in the database and activated for payments.
            </Typography>
            <Box sx={{ mb: 3, p: 2, background: 'rgba(255,152,0,0.08)', borderRadius: 2, border: '1px solid rgba(255,152,0,0.2)' }}>
                <Typography variant="body2" sx={{ color: '#ffc107', fontWeight: 600 }}>
                    ⚡ Important: When you approve an application, a real card is generated and stored in the database. The user can then use it for payments. Rejected applications are discarded.
                </Typography>
            </Box>

            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField select size="small" label="Filter by Status" value={filters.appStatus}
                        onChange={(e) => setFilters({ ...filters, appStatus: e.target.value })} sx={{ minWidth: 180 }}>
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Filter by Tier" value={filters.appTier}
                        onChange={(e) => setFilters({ ...filters, appTier: e.target.value })} sx={{ minWidth: 180 }}>
                        <MenuItem value="">All Tiers</MenuItem>
                        <MenuItem value="silver">Silver</MenuItem>
                        <MenuItem value="gold">Gold</MenuItem>
                        <MenuItem value="platinum">Platinum</MenuItem>
                        <MenuItem value="black">Black</MenuItem>
                    </TextField>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, color: 'rgba(255,255,255,0.8)' } }}>
                                <TableCell>Date</TableCell><TableCell>Applicant</TableCell>
                                <TableCell>Card Tier</TableCell><TableCell>Income</TableCell>
                                <TableCell>Credit Score</TableCell><TableCell>Credit Limit</TableCell>
                                <TableCell>Status</TableCell><TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app._id} hover sx={{
                                    '&:hover': { background: 'rgba(255,255,255,0.02)' },
                                    ...(app.status === 'pending' ? { borderLeft: '3px solid #ffc107' } : {})
                                }}>
                                    <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{app.applicantDetails?.fullName || app.userId?.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{app.userId?.email}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={app.cardTier?.charAt(0).toUpperCase() + app.cardTier?.slice(1)} size="small"
                                            sx={{ fontWeight: 600, background: `${getTierColor(app.cardTier)}30`, color: getTierColor(app.cardTier) === '#333' ? '#fff' : getTierColor(app.cardTier), border: `1px solid ${getTierColor(app.cardTier)}50` }} />
                                    </TableCell>
                                    <TableCell>₹{(app.applicantDetails?.income || 0).toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{app.creditScoreAtApplication}</TableCell>
                                    <TableCell>₹{(app.assignedCreditLimit || 0).toLocaleString()}</TableCell>
                                    <TableCell><Chip label={app.status} size="small" color={getStatusColor(app.status)} /></TableCell>
                                    <TableCell>
                                        {app.status === 'pending' ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                                    <IconButton size="small" onClick={() => setAppActionDialog({ open: true, application: app, action: 'approve' })}
                                                        sx={{ color: '#4caf50', background: 'rgba(76,175,80,0.1)', '&:hover': { background: 'rgba(76,175,80,0.2)' } }}>
                                                        <CheckCircle />
                                                    </IconButton>
                                                </motion.div>
                                                <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                                    <IconButton size="small" onClick={() => setAppActionDialog({ open: true, application: app, action: 'reject' })}
                                                        sx={{ color: '#f44336', background: 'rgba(244,67,54,0.1)', '&:hover': { background: 'rgba(244,67,54,0.2)' } }}>
                                                        <Cancel />
                                                    </IconButton>
                                                </motion.div>
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                                                {app.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {applications.length === 0 && (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.4)' }}>No applications found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalAppPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={totalAppPages} page={appPage} onChange={(_, v) => setAppPage(v)} color="primary" />
                    </Box>
                )}
            </Paper>

            {/* Application Action Dialog */}
            <Dialog open={appActionDialog.open} onClose={() => setAppActionDialog({ open: false, application: null, action: '' })}
                PaperProps={{ sx: { background: 'rgba(26, 26, 46, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 } }}>
                <DialogTitle>{appActionDialog.action === 'approve' ? '✅ Approve Application?' : '❌ Reject Application?'}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {appActionDialog.action === 'approve'
                            ? `Approve ${appActionDialog.application?.cardTier} card for ${appActionDialog.application?.applicantDetails?.fullName}? A real card will be created and stored.`
                            : `Reject ${appActionDialog.application?.cardTier} card application? The application will be discarded.`}
                    </Typography>
                    {appActionDialog.application && (
                        <Box sx={{ mt: 2, p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Applicant</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{appActionDialog.application.applicantDetails?.fullName}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>Credit Score at Application</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{appActionDialog.application.creditScoreAtApplication}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>Assigned Credit Limit</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{(appActionDialog.application.assignedCreditLimit || 0).toLocaleString()}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>Monthly Income</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{(appActionDialog.application.applicantDetails?.income || 0).toLocaleString()}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAppActionDialog({ open: false, application: null, action: '' })}>Cancel</Button>
                    <Button variant="contained" onClick={handleApplicationAction} disabled={actionLoading}
                        sx={{ background: appActionDialog.action === 'approve' ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }}>
                        {actionLoading ? <CircularProgress size={20} /> : appActionDialog.action === 'approve' ? 'Approve & Create Card' : 'Reject Application'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminApplications;
