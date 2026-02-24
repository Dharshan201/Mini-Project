import {
    Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Avatar, LinearProgress
} from '@mui/material';

const getRiskColor = (risk) => {
    switch (risk) {
        case 'excellent': return '#4caf50'; case 'good': return '#8bc34a';
        case 'fair': return '#ff9800'; case 'poor': return '#ff5722'; case 'very_poor': return '#f44336';
        default: return '#8bc34a';
    }
};

const AdminCreditScores = ({ creditScores }) => {
    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Credit Score Management</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
                Monitor all users' credit scores, risk levels, utilization, and outstanding dues in real-time.
            </Typography>

            <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, color: 'rgba(255,255,255,0.8)' } }}>
                                <TableCell>User</TableCell><TableCell>Credit Score</TableCell>
                                <TableCell>Risk Level</TableCell><TableCell>Credit Limit</TableCell>
                                <TableCell>Utilization</TableCell><TableCell>Outstanding Due</TableCell>
                                <TableCell>On-time / Late</TableCell><TableCell>Last Payment</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {creditScores.map((cs) => {
                                const utilPct = cs.totalCreditLimit > 0 ? (cs.totalUtilized / cs.totalCreditLimit) * 100 : 0;
                                return (
                                    <TableRow key={cs._id} hover sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, background: getRiskColor(cs.riskLevel), fontSize: '0.8rem' }}>
                                                    {cs.userId?.name?.charAt(0).toUpperCase() || '?'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{cs.userId?.name || 'Unknown'}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{cs.userId?.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography variant="h6" sx={{ fontWeight: 700, color: getRiskColor(cs.riskLevel) }}>{cs.score}</Typography></TableCell>
                                        <TableCell>
                                            <Chip label={cs.riskLevel?.replace('_', ' ').toUpperCase()} size="small"
                                                sx={{ fontWeight: 600, background: `${getRiskColor(cs.riskLevel)}20`, color: getRiskColor(cs.riskLevel), border: `1px solid ${getRiskColor(cs.riskLevel)}40` }} />
                                        </TableCell>
                                        <TableCell>₹{(cs.totalCreditLimit || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                                                <LinearProgress variant="determinate" value={Math.min(utilPct, 100)}
                                                    sx={{
                                                        flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)',
                                                        '& .MuiLinearProgress-bar': { borderRadius: 3, background: utilPct > 70 ? '#f44336' : utilPct > 50 ? '#ff9800' : '#4caf50' }
                                                    }} />
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 35 }}>{utilPct.toFixed(0)}%</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: cs.totalDue > 0 ? '#ff9800' : '#4caf50' }}>₹{(cs.totalDue || 0).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Chip label={`${cs.onTimePayments || 0} ✓`} size="small" sx={{ background: 'rgba(76,175,80,0.15)', color: '#4caf50', fontWeight: 600 }} />
                                                <Chip label={`${cs.latePayments || 0} ✗`} size="small" sx={{ background: 'rgba(244,67,54,0.15)', color: '#f44336', fontWeight: 600 }} />
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            {cs.lastPaymentDate ? new Date(cs.lastPaymentDate).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {creditScores.length === 0 && (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 5, color: 'rgba(255,255,255,0.4)' }}>No credit score data available</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AdminCreditScores;
