import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Tabs,
    Tab,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    CheckCircle,
    Flight,
    Hotel,
    Restaurant,
    LocalGasStation,
    Movie,
    Spa,
    GolfCourse,
    SupportAgent,
    Shield,
    CreditCard,
    Star,
    WorkspacePremium,
    Diamond,
    Percent,
    LocalAtm,
    AirplanemodeActive,
    CardGiftcard
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const CARD_DATA = [
    {
        key: 'silver',
        name: 'Silver Card',
        icon: <CreditCard sx={{ fontSize: 32 }} />,
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
        textColor: '#333',
        tagline: 'Your gateway to smart spending',
        creditLimit: '₹25,000',
        annualFee: '₹499',
        joiningFee: '₹299 (Waived first year)',
        interestRate: '3.5% per month',
        cashback: '0.5% on all transactions',
        rewardRate: '1 point per ₹100 spent',
        categories: [
            { icon: <LocalAtm />, title: 'Cashback', desc: '0.5% cashback on all purchases', color: '#4caf50' },
            { icon: <Shield />, title: 'Security', desc: 'Zero liability on fraudulent transactions', color: '#2196f3' },
            { icon: <SupportAgent />, title: 'Support', desc: '24/7 customer helpline', color: '#ff9800' }
        ],
        benefits: [
            'Basic reward points on all purchases',
            '0.5% cashback on all transactions',
            'Free ATM withdrawals (5 per month)',
            'SMS & Email transaction alerts',
            'Zero liability fraud protection',
            'Contactless payment (NFC) enabled',
            'Free add-on card for family member',
            'EMI conversion for purchases above ₹5,000',
            'Online dispute resolution',
            'Auto-debit for bill payments'
        ],
        feeWaiver: 'Annual fee waived on spending ₹50,000+ in a year',
        eligibility: 'Minimum credit score: 500 | Minimum income: ₹2,00,000 per annum'
    },
    {
        key: 'gold',
        name: 'Gold Card',
        icon: <Star sx={{ fontSize: 32 }} />,
        gradient: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
        textColor: '#333',
        tagline: 'Elevate your lifestyle with premium rewards',
        creditLimit: '₹1,00,000',
        annualFee: '₹1,499',
        joiningFee: '₹999 (Waived first year)',
        interestRate: '2.9% per month',
        cashback: '1% on all transactions',
        rewardRate: '2 points per ₹100 spent | 4X on dining',
        categories: [
            { icon: <Restaurant />, title: 'Dining', desc: '2X rewards at restaurants', color: '#ff5722' },
            { icon: <Movie />, title: 'Entertainment', desc: '2 free movie tickets/month', color: '#e91e63' },
            { icon: <AirplanemodeActive />, title: 'Lounge', desc: '4 airport lounge visits/year', color: '#3f51b5' },
            { icon: <LocalGasStation />, title: 'Fuel', desc: '1% fuel surcharge waiver', color: '#ff9800' }
        ],
        benefits: [
            '2X reward points on dining & entertainment',
            '1% cashback on all transactions',
            'Airport lounge access (4 visits/year)',
            'Fuel surcharge waiver (up to ₹100/month)',
            'Complimentary movie tickets (2/month)',
            'Travel insurance up to ₹5 Lakhs',
            'Priority customer support',
            'EMI conversion on purchases above ₹2,500',
            'Welcome gift worth ₹500',
            'Milestone bonus: Spend ₹1L, get ₹1,000 voucher',
            'Free add-on cards (up to 3)',
            'International usage with competitive forex rates'
        ],
        feeWaiver: 'Annual fee waived on spending ₹1,50,000+ in a year',
        eligibility: 'Minimum credit score: 650 | Minimum income: ₹4,00,000 per annum'
    },
    {
        key: 'platinum',
        name: 'Platinum Card',
        icon: <WorkspacePremium sx={{ fontSize: 32 }} />,
        gradient: 'linear-gradient(135deg, #E5E4E2 0%, #8B8B8B 50%, #E5E4E2 100%)',
        textColor: '#1a1a2e',
        tagline: 'Premium travel & luxury lifestyle',
        creditLimit: '₹5,00,000',
        annualFee: '₹4,999',
        joiningFee: '₹2,999 (Welcome benefits worth ₹5,000)',
        interestRate: '2.2% per month',
        cashback: '2% on all transactions',
        rewardRate: '5 points per ₹100 on travel | 3X on dining',
        categories: [
            { icon: <Flight />, title: 'Flights', desc: '2 free flights/year (up to ₹10,000)', color: '#00bcd4' },
            { icon: <Hotel />, title: 'Hotels', desc: '₹5,000 stay vouchers quarterly', color: '#9c27b0' },
            { icon: <GolfCourse />, title: 'Golf', desc: 'Premium golf course privileges', color: '#4caf50' },
            { icon: <SupportAgent />, title: 'Concierge', desc: '24/7 concierge services', color: '#ff9800' },
            { icon: <AirplanemodeActive />, title: 'Lounge', desc: 'Unlimited domestic lounge access', color: '#3f51b5' },
            { icon: <Shield />, title: 'Insurance', desc: 'Travel insurance up to ₹25 Lakhs', color: '#f44336' }
        ],
        benefits: [
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
            'Milestone bonus: Spend ₹2L, get ₹5,000 voucher',
            'Buy 1 Get 1 on premium dining',
            'Complimentary health check-up annually',
            'Emergency cash advance worldwide'
        ],
        feeWaiver: 'Annual fee waived on spending ₹4,00,000+ in a year',
        eligibility: 'Minimum credit score: 750 | Minimum income: ₹8,00,000 per annum'
    },
    {
        key: 'black',
        name: 'Black Card',
        icon: <Diamond sx={{ fontSize: 32 }} />,
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #0a0a15 100%)',
        textColor: '#fff',
        tagline: 'The ultimate luxury — by invitation or exceptional merit',
        creditLimit: '₹15,00,000',
        annualFee: '₹14,999',
        joiningFee: '₹9,999 (Welcome benefits worth ₹25,000)',
        interestRate: '1.5% per month',
        cashback: '3% on all transactions',
        rewardRate: '10X on international | 5X on all travel',
        categories: [
            { icon: <Flight />, title: 'Business Class', desc: '2 business class upgrades/year', color: '#00bcd4' },
            { icon: <Hotel />, title: 'Luxury Hotels', desc: '50% off at luxury hotels worldwide', color: '#9c27b0' },
            { icon: <Spa />, title: 'Wellness', desc: 'Spa & wellness memberships', color: '#e91e63' },
            { icon: <GolfCourse />, title: 'Golf', desc: 'Global golf memberships', color: '#4caf50' },
            { icon: <CardGiftcard />, title: 'Annual Gift', desc: 'Annual luxury gift worth ₹10,000', color: '#ff9800' },
            { icon: <SupportAgent />, title: 'Relationship Mgr', desc: 'Personal relationship manager', color: '#2196f3' },
            { icon: <AirplanemodeActive />, title: 'Global Lounge', desc: 'Unlimited global lounge access', color: '#3f51b5' },
            { icon: <Shield />, title: 'Insurance', desc: 'Travel insurance up to ₹1 Crore', color: '#f44336' }
        ],
        benefits: [
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
            'Annual gift worth ₹10,000',
            'Helicopter transfer services (select cities)',
            'Private jet booking assistance',
            'Luxury car rental discounts worldwide'
        ],
        feeWaiver: 'Fee waiver on annual spend of ₹10,00,000+',
        eligibility: 'Minimum credit score: 800 | Minimum income: ₹20,00,000 per annum'
    }
];

const CardInfo = () => {
    const [selectedCard, setSelectedCard] = useState(0);

    const card = CARD_DATA[selectedCard];

    return (
        <Box>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Credit Card Information
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
                    Explore our premium card offerings and their exclusive benefits
                </Typography>
            </motion.div>

            {/* Card Selection Tabs */}
            <Tabs
                value={selectedCard}
                onChange={(_, v) => setSelectedCard(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    mb: 4,
                    '& .MuiTab-root': {
                        borderRadius: 2,
                        mx: 0.5,
                        minHeight: 48,
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                    '& .Mui-selected': {
                        background: 'rgba(102,126,234,0.1)',
                    }
                }}
            >
                {CARD_DATA.map((c, i) => (
                    <Tab
                        key={c.key}
                        label={c.name}
                        icon={c.icon}
                        iconPosition="start"
                    />
                ))}
            </Tabs>

            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedCard}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Card Hero */}
                    <Paper
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            mb: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.03)',
                        }}
                    >
                        <Box
                            sx={{
                                background: card.gradient,
                                p: 5,
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: '-50%',
                                    right: '-20%',
                                    width: 300,
                                    height: 300,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    bottom: '-30%',
                                    left: '-10%',
                                    width: 200,
                                    height: 200,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                }
                            }}
                        >
                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{ color: card.textColor }}>{card.icon}</Box>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: card.textColor }}>
                                        {card.name}
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ color: card.textColor, opacity: 0.8, fontWeight: 400 }}>
                                    {card.tagline}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ p: 4 }}>
                            <Grid container spacing={3}>
                                {[
                                    { label: 'Credit Limit', value: card.creditLimit, icon: <LocalAtm /> },
                                    { label: 'Annual Fee', value: card.annualFee, icon: <Percent /> },
                                    { label: 'Interest Rate', value: card.interestRate, icon: <CreditCard /> },
                                    { label: 'Cashback', value: card.cashback, icon: <CardGiftcard /> }
                                ].map((item, i) => (
                                    <Grid item xs={6} md={3} key={i}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 2,
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                                <Box sx={{ color: '#667eea', mb: 1 }}>{item.icon}</Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {item.value}
                                                </Typography>
                                            </Box>
                                        </motion.div>
                                    </Grid>
                                ))}
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <strong>Joining Fee:</strong> {card.joiningFee}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    <strong>Reward Rate:</strong> {card.rewardRate}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#4caf50', mt: 1 }}>
                                    💡 {card.feeWaiver}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Key Categories */}
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                        🎯 Key Benefit Categories
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {card.categories.map((cat, i) => (
                            <Grid item xs={6} sm={4} md={3} key={i}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Paper
                                        sx={{
                                            p: 2.5,
                                            textAlign: 'center',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                border: `1px solid ${cat.color}40`,
                                                background: `${cat.color}08`
                                            }
                                        }}
                                    >
                                        <Box sx={{ color: cat.color, mb: 1 }}>{cat.icon}</Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {cat.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            {cat.desc}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>

                    {/* All Benefits */}
                    <Paper
                        sx={{
                            p: 3,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            mb: 3
                        }}
                    >
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            ✨ Complete Benefits
                        </Typography>
                        <Grid container spacing={1}>
                            {card.benefits.map((benefit, i) => (
                                <Grid item xs={12} sm={6} key={i}>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 1,
                                            p: 1.5,
                                            borderRadius: 1,
                                            '&:hover': { background: 'rgba(255,255,255,0.02)' }
                                        }}>
                                            <CheckCircle sx={{ fontSize: 18, color: '#4caf50', mt: 0.3, flexShrink: 0 }} />
                                            <Typography variant="body2">{benefit}</Typography>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Eligibility */}
                    <Paper
                        sx={{
                            p: 3,
                            background: 'rgba(102,126,234,0.05)',
                            borderRadius: 3,
                            border: '1px solid rgba(102,126,234,0.2)',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            📋 Eligibility Criteria
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {card.eligibility}
                        </Typography>
                    </Paper>

                    {/* Comparison Table */}
                    <Paper sx={{
                        mt: 4,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.08)',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ p: 3, pb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                📊 Card Comparison
                            </Typography>
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 700, borderColor: 'rgba(255,255,255,0.08)' } }}>
                                        <TableCell>Feature</TableCell>
                                        <TableCell>Silver</TableCell>
                                        <TableCell>Gold</TableCell>
                                        <TableCell>Platinum</TableCell>
                                        <TableCell>Black</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[
                                        { feature: 'Credit Limit', values: ['₹25K', '₹1L', '₹5L', '₹15L'] },
                                        { feature: 'Annual Fee', values: ['₹499', '₹1,499', '₹4,999', '₹14,999'] },
                                        { feature: 'Cashback', values: ['0.5%', '1%', '2%', '3%'] },
                                        { feature: 'Interest Rate', values: ['3.5%', '2.9%', '2.2%', '1.5%'] },
                                        { feature: 'Airport Lounge', values: ['❌', '4/year', 'Unlimited (Domestic)', 'Unlimited (Global)'] },
                                        { feature: 'Travel Insurance', values: ['❌', '₹5L', '₹25L', '₹1Cr'] },
                                        { feature: 'Concierge', values: ['❌', '❌', '24/7', 'Luxury 24/7'] },
                                        { feature: 'Min. Score', values: ['500', '650', '750', '800'] }
                                    ].map((row, i) => (
                                        <TableRow
                                            key={i}
                                            sx={{
                                                '& td': { borderColor: 'rgba(255,255,255,0.05)' },
                                                '&:hover': { background: 'rgba(255,255,255,0.02)' }
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 600 }}>{row.feature}</TableCell>
                                            {row.values.map((v, j) => (
                                                <TableCell key={j} sx={{
                                                    color: j === selectedCard ? '#667eea' : 'inherit',
                                                    fontWeight: j === selectedCard ? 700 : 400,
                                                    background: j === selectedCard ? 'rgba(102,126,234,0.05)' : 'transparent'
                                                }}>
                                                    {v}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
};

export default CardInfo;
