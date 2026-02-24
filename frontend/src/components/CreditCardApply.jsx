import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    CircularProgress,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stepper,
    Step,
    StepLabel,
    Alert
} from '@mui/material';
import {
    CreditCard,
    Star,
    Flight,
    Hotel,
    LocalAtm,
    ShieldMoon,
    CheckCircle,
    Cancel,
    Pending,
    ArrowForward,
    WorkspacePremium,
    Diamond,
    EmojiEvents
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CARD_TIER_CONFIG = {
    silver: {
        name: 'Silver Card',
        icon: <CreditCard />,
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        textColor: '#333',
        minScore: 500,
        limit: '₹25,000',
        fee: '₹499/year',
        rate: '3.5%',
        cashback: '0.5%',
        tagline: 'Start your credit journey',
        features: [
            'Basic reward points on all purchases',
            '0.5% cashback on all transactions',
            'Free ATM withdrawals (5/month)',
            'SMS & Email transaction alerts',
            'Zero liability fraud protection',
            'Contactless payment enabled'
        ]
    },
    gold: {
        name: 'Gold Card',
        icon: <Star />,
        gradient: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
        textColor: '#333',
        minScore: 650,
        limit: '₹1,00,000',
        fee: '₹1,499/year',
        rate: '2.9%',
        cashback: '1%',
        tagline: 'Elevated rewards & lifestyle',
        features: [
            '2X reward points on dining & entertainment',
            '1% cashback on all transactions',
            'Airport lounge access (4 visits/year)',
            'Fuel surcharge waiver',
            'Complimentary movie tickets (2/month)',
            'Travel insurance up to ₹5 Lakhs',
            'Priority customer support',
            'EMI conversion on purchases above ₹2,500'
        ]
    },
    platinum: {
        name: 'Platinum Card',
        icon: <WorkspacePremium />,
        gradient: 'linear-gradient(135deg, #E5E4E2 0%, #8B8B8B 50%, #E5E4E2 100%)',
        textColor: '#1a1a2e',
        minScore: 750,
        limit: '₹5,00,000',
        fee: '₹4,999/year',
        rate: '2.2%',
        cashback: '2%',
        tagline: 'Premium travel & luxury perks',
        features: [
            '5X reward points on travel & flights',
            '3X reward points on dining & hotels',
            '2% cashback on all transactions',
            'Unlimited domestic airport lounge access',
            'International lounge access (8 visits/year)',
            'Complimentary flight tickets (2/year up to ₹10,000)',
            'Hotel stay vouchers worth ₹5,000/quarter',
            'Travel insurance up to ₹25 Lakhs',
            'Concierge services 24/7',
            'Golf privileges at premium courses',
            'Priority Pass membership',
            'Milestone bonus: Spend ₹2L, get ₹5,000 voucher'
        ]
    },
    black: {
        name: 'Black Card',
        icon: <Diamond />,
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #0a0a15 100%)',
        textColor: '#fff',
        minScore: 800,
        limit: '₹15,00,000',
        fee: '₹14,999/year',
        rate: '1.5%',
        cashback: '3%',
        tagline: 'The ultimate luxury experience',
        features: [
            '10X reward points on international transactions',
            '5X reward points on all travel & hotels',
            '3% cashback on all transactions',
            'Unlimited global airport lounge access',
            'Complimentary business class upgrades (2/year)',
            'Free international flight tickets (2/year up to ₹50,000)',
            'Luxury hotel stays at 50% off worldwide',
            'Travel insurance up to ₹1 Crore',
            'Personal relationship manager',
            'Invitation to exclusive events & premieres',
            'Complimentary spa & wellness memberships',
            'Premium golf memberships worldwide',
            'No foreign transaction fees',
            'Emergency card replacement worldwide',
            'Dedicated 24/7 luxury concierge',
            'Annual gift worth ₹10,000'
        ]
    }
};

const CreditCardApply = () => {
    const { api } = useAuth();
    const [loading, setLoading] = useState(true);
    const [creditScore, setCreditScore] = useState(null);
    const [applications, setApplications] = useState([]);
    const [selectedTier, setSelectedTier] = useState(null);
    const [applyDialog, setApplyDialog] = useState(false);
    const [detailsDialog, setDetailsDialog] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        income: '',
        employment: '',
        address: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [scoreRes, appsRes] = await Promise.all([
                api.get('/credit/score'),
                api.get('/credit/applications')
            ]);
            if (scoreRes.data.success) setCreditScore(scoreRes.data.creditScore);
            if (appsRes.data.success) setApplications(appsRes.data.applications);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!formData.fullName || !formData.phone || !formData.income || !formData.employment || !formData.address) {
            toast.error('Please fill in all fields');
            return;
        }
        setSubmitting(true);
        try {
            const response = await api.post('/credit/apply', {
                cardTier: selectedTier,
                ...formData
            });
            if (response.data.success) {
                toast.success(response.data.message);
                setApplyDialog(false);
                setSelectedTier(null);
                setActiveStep(0);
                setFormData({ fullName: '', phone: '', income: '', employment: '', address: '' });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Application failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': case 'active': return <CheckCircle sx={{ color: '#4caf50' }} />;
            case 'rejected': return <Cancel sx={{ color: '#f44336' }} />;
            default: return <Pending sx={{ color: '#ff9800' }} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': case 'active': return 'success';
            case 'rejected': return 'error';
            default: return 'warning';
        }
    };

    const isEligible = (tier) => {
        return (creditScore?.score || 750) >= CARD_TIER_CONFIG[tier].minScore;
    };

    const hasExisting = (tier) => {
        return applications.some(a => a.cardTier === tier && ['pending', 'approved', 'active'].includes(a.status));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Apply for a Credit Card
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Choose from our premium card tiers based on your credit score
                </Typography>
                <Chip
                    label={`Your Credit Score: ${creditScore?.score || 750}`}
                    sx={{
                        mb: 4,
                        fontWeight: 600,
                        background: 'rgba(102,126,234,0.15)',
                        border: '1px solid rgba(102,126,234,0.3)',
                        color: '#667eea'
                    }}
                />
            </motion.div>

            {/* Card Tiers */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {Object.entries(CARD_TIER_CONFIG).map(([tierKey, tier], index) => (
                    <Grid item xs={12} sm={6} lg={3} key={tierKey}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                        >
                            <Paper
                                sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.03)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                                    }
                                }}
                                onClick={() => setDetailsDialog(tierKey)}
                            >
                                {/* Card Visual */}
                                <Box
                                    sx={{
                                        background: tier.gradient,
                                        p: 3,
                                        position: 'relative',
                                        height: 160,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        overflow: 'hidden',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                                            animation: 'shimmer 3s infinite'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: tier.textColor }}>
                                            {tier.name}
                                        </Typography>
                                        <Box sx={{ color: tier.textColor, opacity: 0.8 }}>
                                            {tier.icon}
                                        </Box>
                                    </Box>
                                    <Box sx={{ zIndex: 1 }}>
                                        <Typography variant="caption" sx={{ color: tier.textColor, opacity: 0.7, display: 'block' }}>
                                            {tier.tagline}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: tier.textColor, opacity: 0.5, mt: 0.5 }}>
                                            •••• •••• •••• ••••
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Card Details */}
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Credit Limit</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700 }}>{tier.limit}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Annual Fee</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 700 }}>{tier.fee}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Chip label={`${tier.cashback} Cashback`} size="small" sx={{ fontSize: '0.7rem' }} />
                                        <Chip label={`${tier.rate} Interest`} size="small" sx={{ fontSize: '0.7rem' }} />
                                    </Box>

                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, display: 'block' }}>
                                        Min. Score: {tier.minScore}
                                    </Typography>

                                    {hasExisting(tierKey) ? (
                                        <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                                            Already Applied
                                        </Button>
                                    ) : isEligible(tierKey) ? (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            endIcon={<ArrowForward />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTier(tierKey);
                                                setApplyDialog(true);
                                            }}
                                            sx={{
                                                background: tier.gradient,
                                                color: tier.textColor,
                                                borderRadius: 2,
                                                fontWeight: 600
                                            }}
                                        >
                                            Apply Now
                                        </Button>
                                    ) : (
                                        <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 2 }}>
                                            Score {tier.minScore}+ Required
                                        </Button>
                                    )}
                                </Box>
                            </Paper>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* My Applications */}
            {applications.length > 0 && (
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
                            My Applications
                        </Typography>
                        <List>
                            {applications.map((app) => (
                                <ListItem
                                    key={app._id}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    <ListItemIcon>
                                        {getStatusIcon(app.status)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={CARD_TIER_CONFIG[app.cardTier]?.name || app.cardTier}
                                        secondary={`Applied on ${new Date(app.createdAt).toLocaleDateString()} • Score at application: ${app.creditScoreAtApplication}`}
                                        sx={{
                                            '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.4)' }
                                        }}
                                    />
                                    <Chip
                                        label={app.status.replace('_', ' ').toUpperCase()}
                                        size="small"
                                        color={getStatusColor(app.status)}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </motion.div>
            )}

            {/* Card Details Dialog */}
            <Dialog
                open={!!detailsDialog}
                onClose={() => setDetailsDialog(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3
                    }
                }}
            >
                {detailsDialog && (
                    <>
                        <Box sx={{ background: CARD_TIER_CONFIG[detailsDialog].gradient, p: 4, textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: CARD_TIER_CONFIG[detailsDialog].textColor }}>
                                {CARD_TIER_CONFIG[detailsDialog].name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: CARD_TIER_CONFIG[detailsDialog].textColor, opacity: 0.8, mt: 1 }}>
                                {CARD_TIER_CONFIG[detailsDialog].tagline}
                            </Typography>
                        </Box>
                        <DialogContent sx={{ p: 3 }}>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                {[
                                    { label: 'Credit Limit', value: CARD_TIER_CONFIG[detailsDialog].limit },
                                    { label: 'Annual Fee', value: CARD_TIER_CONFIG[detailsDialog].fee },
                                    { label: 'Interest Rate', value: CARD_TIER_CONFIG[detailsDialog].rate },
                                    { label: 'Cashback', value: CARD_TIER_CONFIG[detailsDialog].cashback }
                                ].map((item, i) => (
                                    <Grid item xs={6} key={i}>
                                        <Box sx={{ textAlign: 'center', p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>

                            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                ✨ Card Benefits & Perks
                            </Typography>
                            <List dense>
                                {CARD_TIER_CONFIG[detailsDialog].features.map((feature, i) => (
                                    <ListItem key={i} sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <CheckCircle sx={{ fontSize: 18, color: '#4caf50' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature}
                                            sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, pt: 0 }}>
                            <Button onClick={() => setDetailsDialog(null)}>Close</Button>
                            {isEligible(detailsDialog) && !hasExisting(detailsDialog) && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        setSelectedTier(detailsDialog);
                                        setDetailsDialog(null);
                                        setApplyDialog(true);
                                    }}
                                    sx={{ background: CARD_TIER_CONFIG[detailsDialog].gradient, color: CARD_TIER_CONFIG[detailsDialog].textColor }}
                                >
                                    Apply Now
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Apply Dialog */}
            <Dialog
                open={applyDialog}
                onClose={() => { setApplyDialog(false); setActiveStep(0); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.98)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle>
                    Apply for {selectedTier ? CARD_TIER_CONFIG[selectedTier]?.name : 'Card'}
                </DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
                        <Step><StepLabel>Personal Info</StepLabel></Step>
                        <Step><StepLabel>Employment</StepLabel></Step>
                        <Step><StepLabel>Review</StepLabel></Step>
                    </Stepper>

                    {activeStep === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Address"
                                multiline
                                rows={2}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                fullWidth
                                select
                                label="Employment Type"
                                value={formData.employment}
                                onChange={(e) => setFormData({ ...formData, employment: e.target.value })}
                            >
                                <MenuItem value="salaried">Salaried</MenuItem>
                                <MenuItem value="self_employed">Self Employed</MenuItem>
                                <MenuItem value="business">Business Owner</MenuItem>
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </TextField>
                            <TextField
                                fullWidth
                                label="Annual Income (₹)"
                                type="number"
                                value={formData.income}
                                onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                            />
                        </Box>
                    )}

                    {activeStep === 2 && selectedTier && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Please review your application details before submitting
                            </Alert>
                            <Box sx={{ background: 'rgba(255,255,255,0.03)', p: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>Card Type</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{CARD_TIER_CONFIG[selectedTier].name}</Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Name</Typography>
                                        <Typography variant="body2">{formData.fullName}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Phone</Typography>
                                        <Typography variant="body2">{formData.phone}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Employment</Typography>
                                        <Typography variant="body2">{formData.employment}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Income</Typography>
                                        <Typography variant="body2">₹{parseInt(formData.income || 0).toLocaleString()}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Address</Typography>
                                        <Typography variant="body2">{formData.address}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Credit Score</Typography>
                                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 600 }}>{creditScore?.score || 750}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Credit Limit</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{CARD_TIER_CONFIG[selectedTier].limit}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setApplyDialog(false); setActiveStep(0); }}>Cancel</Button>
                    {activeStep > 0 && (
                        <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
                    )}
                    {activeStep < 2 ? (
                        <Button
                            variant="contained"
                            onClick={() => setActiveStep(activeStep + 1)}
                            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleApply}
                            disabled={submitting}
                            sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}
                        >
                            {submitting ? <CircularProgress size={20} /> : 'Submit Application'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CreditCardApply;
