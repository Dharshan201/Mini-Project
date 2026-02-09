import { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    InputAdornment,
    CircularProgress,
    Grid,
    Paper,
    Alert,
    FormControlLabel,
    Checkbox,
    Divider,
    Collapse
} from '@mui/material';
import {
    CreditCard,
    Person,
    CalendarMonth,
    Lock,
    AttachMoney,
    ExpandMore,
    ExpandLess,
    CameraAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Card3D from './Card3D';
import OTPModal from './OTPModal';
import PaymentResult from './PaymentResult';
import SavedCards from './SavedCards';
import CardScanner from './CardScanner';
import { useAuth } from '../context/AuthContext';
import {
    detectCardType,
    formatCardNumber,
    formatExpiry,
    validateCardNumber,
    validateExpiry,
    validateCVV,
    getCVVLength
} from '../utils/cardType';

const PaymentForm = () => {
    const { api } = useAuth();
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
        amount: '',
        merchant: ''
    });
    const [errors, setErrors] = useState({});
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOTP, setShowOTP] = useState(false);
    const [transactionId, setTransactionId] = useState(null);
    const [paymentResult, setPaymentResult] = useState(null);
    const [serverError, setServerError] = useState('');
    const [saveCard, setSaveCard] = useState(false);
    const [showSavedCards, setShowSavedCards] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [savedCardsCount, setSavedCardsCount] = useState(0);
    const [showScanner, setShowScanner] = useState(false);

    const cvvRef = useRef(null);

    // Fetch saved cards count on mount
    useEffect(() => {
        const fetchCardsCount = async () => {
            try {
                const response = await api.get('/card/saved');
                if (response.data.success) {
                    setSavedCardsCount(response.data.count);
                }
            } catch (error) {
                console.error('Error fetching saved cards:', error);
            }
        };
        fetchCardsCount();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Format card number
        if (name === 'cardNumber') {
            const digitsOnly = value.replace(/\D/g, '');
            const cardType = detectCardType(digitsOnly);
            const maxLength = cardType === 'amex' ? 15 : 16;
            processedValue = digitsOnly.slice(0, maxLength);
        }

        // Format expiry date
        if (name === 'expiryDate') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
            processedValue = formatExpiry(digitsOnly);
        }

        // Limit CVV length
        if (name === 'cvv') {
            const cardType = detectCardType(formData.cardNumber);
            const maxLength = getCVVLength(cardType);
            processedValue = value.replace(/\D/g, '').slice(0, maxLength);
        }

        // Limit amount
        if (name === 'amount') {
            processedValue = value.replace(/[^\d.]/g, '');
        }

        setFormData({ ...formData, [name]: processedValue });

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }

        // Clear selected card when user types card details
        if (['cardNumber', 'cardHolder', 'expiryDate'].includes(name)) {
            setSelectedCard(null);
        }
    };

    const handleCVVFocus = () => {
        setIsFlipped(true);
    };

    const handleCVVBlur = () => {
        setIsFlipped(false);
    };

    // Handler for card scanner result
    const handleScanComplete = (scannedData) => {
        setShowScanner(false);
        setSelectedCard(null);

        // Update form with scanned data
        setFormData({
            ...formData,
            cardNumber: scannedData.cardNumber || formData.cardNumber,
            cardHolder: scannedData.cardHolder || formData.cardHolder,
            expiryDate: scannedData.expiryDate || formData.expiryDate,
            cvv: scannedData.cvv || formData.cvv
        });

        // Show feedback
        const fieldsDetected = [
            scannedData.cardNumber && 'Card Number',
            scannedData.cardHolder && 'Card Holder',
            scannedData.expiryDate && 'Expiry Date',
            scannedData.cvv && 'CVV'
        ].filter(Boolean);

        if (fieldsDetected.length > 0) {
            toast.success(`Detected: ${fieldsDetected.join(', ')}`);
        }
    };

    const handleSelectSavedCard = (card) => {
        setSelectedCard(card);
        // Pre-fill form with saved card details (except CVV)
        setFormData({
            ...formData,
            cardNumber: '', // Can't retrieve full card number
            cardHolder: card.cardHolder,
            expiryDate: card.expiryDate,
            cvv: '' // User must re-enter CVV
        });
        setShowSavedCards(false);
        toast.info('Enter CVV to continue with saved card');
    };

    const validateForm = () => {
        const newErrors = {};
        const cardType = selectedCard ? selectedCard.cardType : detectCardType(formData.cardNumber);

        // If using saved card, only CVV and amount are needed
        if (selectedCard) {
            if (!formData.cvv) {
                newErrors.cvv = 'CVV is required';
            } else if (!validateCVV(formData.cvv, cardType)) {
                newErrors.cvv = `Enter ${getCVVLength(cardType)} digits`;
            }
        } else {
            if (!formData.cardNumber) {
                newErrors.cardNumber = 'Card number is required';
            } else if (!validateCardNumber(formData.cardNumber)) {
                newErrors.cardNumber = 'Invalid card number';
            }

            if (!formData.cardHolder) {
                newErrors.cardHolder = 'Card holder name is required';
            }

            if (!formData.expiryDate) {
                newErrors.expiryDate = 'Expiry date is required';
            } else if (!validateExpiry(formData.expiryDate)) {
                newErrors.expiryDate = 'Invalid or expired';
            }

            if (!formData.cvv) {
                newErrors.cvv = 'CVV is required';
            } else if (!validateCVV(formData.cvv, cardType)) {
                newErrors.cvv = `Enter ${getCVVLength(cardType)} digits`;
            }
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Enter valid amount';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            // If using saved card, we need to send cardId instead
            const payload = selectedCard
                ? {
                    savedCardId: selectedCard._id,
                    cvv: formData.cvv,
                    amount: formData.amount,
                    merchant: formData.merchant || 'Online Store'
                }
                : {
                    cardNumber: formData.cardNumber,
                    cardHolder: formData.cardHolder,
                    expiryDate: formData.expiryDate,
                    cvv: formData.cvv,
                    amount: formData.amount,
                    merchant: formData.merchant || 'Online Store',
                    saveCard
                };

            const response = await api.post('/card/process', payload);

            if (response.data.success) {
                setTransactionId(response.data.transactionId);
                setShowOTP(true);
            }
        } catch (error) {
            setServerError(error.response?.data?.message || 'Payment processing failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSuccess = (result) => {
        setShowOTP(false);
        setPaymentResult({
            success: true,
            transaction: result.transaction
        });
        // Reset form
        setFormData({
            cardNumber: '',
            cardHolder: '',
            expiryDate: '',
            cvv: '',
            amount: '',
            merchant: ''
        });
        setSelectedCard(null);
        setSaveCard(false);
        // Refresh saved cards count
        setSavedCardsCount(prev => saveCard ? prev + 1 : prev);
    };

    const handleOTPFailure = (message) => {
        setShowOTP(false);
        setPaymentResult({
            success: false,
            message
        });
    };

    const handleCloseResult = () => {
        setPaymentResult(null);
    };

    const cardType = selectedCard ? selectedCard.cardType : detectCardType(formData.cardNumber);

    // For 3D card display with saved card
    const displayCardNumber = selectedCard
        ? `****${selectedCard.lastFour}`
        : formData.cardNumber;

    return (
        <Box>
            <div className="payment-section">
                {/* 3D Card Preview */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3
                    }}
                >
                    <Card3D
                        cardNumber={displayCardNumber}
                        cardHolder={formData.cardHolder}
                        expiryDate={formData.expiryDate}
                        cvv={formData.cvv}
                        isFlipped={isFlipped}
                        cardType={selectedCard?.cardType}
                    />

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.5)',
                            textAlign: 'center',
                            fontSize: '12px'
                        }}
                    >
                        {selectedCard
                            ? `Using saved card ending in ${selectedCard.lastFour}`
                            : 'Your card details are displayed in real-time on the card above.'}
                    </Typography>
                </Box>

                {/* Payment Form */}
                <Paper
                    component={motion.form}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    sx={{
                        p: 4,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        Payment Details
                    </Typography>

                    {serverError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {serverError}
                        </Alert>
                    )}

                    {/* Card Input Options */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        {/* Scan Card Button */}
                        <Button
                            variant="outlined"
                            onClick={() => setShowScanner(true)}
                            startIcon={<CameraAlt />}
                            sx={{
                                flex: 1,
                                py: 1.5,
                                borderColor: 'rgba(102, 126, 234, 0.5)',
                                color: '#667eea',
                                borderRadius: 2,
                                '&:hover': {
                                    borderColor: '#667eea',
                                    background: 'rgba(102, 126, 234, 0.1)'
                                }
                            }}
                        >
                            Scan Card
                        </Button>

                        {/* Saved Cards Button */}
                        {savedCardsCount > 0 && (
                            <Button
                                variant="outlined"
                                onClick={() => setShowSavedCards(!showSavedCards)}
                                endIcon={showSavedCards ? <ExpandLess /> : <ExpandMore />}
                                sx={{
                                    flex: 1,
                                    py: 1.5,
                                    borderColor: 'rgba(255,255,255,0.15)',
                                    color: 'rgba(255,255,255,0.8)',
                                    borderRadius: 2,
                                    '&:hover': {
                                        borderColor: '#667eea',
                                        background: 'rgba(102, 126, 234, 0.1)'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CreditCard fontSize="small" />
                                    Saved ({savedCardsCount})
                                </Box>
                            </Button>
                        )}
                    </Box>

                    {/* Saved Cards Collapse */}
                    <Collapse in={showSavedCards}>
                        <Box sx={{ mb: 3 }}>
                            <SavedCards
                                onSelectCard={handleSelectSavedCard}
                                selectedCardId={selectedCard?._id}
                            />
                        </Box>
                    </Collapse>

                    {selectedCard && (
                        <Alert
                            severity="info"
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setSelectedCard(null);
                                        setFormData({
                                            ...formData,
                                            cardHolder: '',
                                            expiryDate: '',
                                            cvv: ''
                                        });
                                    }}
                                >
                                    Use New Card
                                </Button>
                            }
                        >
                            Using saved card •••• {selectedCard.lastFour}
                        </Alert>
                    )}

                    {!selectedCard && (
                        <>
                            <TextField
                                fullWidth
                                label="Card Number"
                                name="cardNumber"
                                value={formatCardNumber(formData.cardNumber)}
                                onChange={handleChange}
                                error={!!errors.cardNumber}
                                helperText={errors.cardNumber}
                                margin="normal"
                                placeholder="4242 4242 4242 4242"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CreditCard sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ maxLength: 19 }}
                            />

                            <TextField
                                fullWidth
                                label="Card Holder Name"
                                name="cardHolder"
                                value={formData.cardHolder}
                                onChange={handleChange}
                                error={!!errors.cardHolder}
                                helperText={errors.cardHolder}
                                margin="normal"
                                placeholder="JOHN DOE"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Expiry Date"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        error={!!errors.expiryDate}
                                        helperText={errors.expiryDate}
                                        margin="normal"
                                        placeholder="MM/YY"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarMonth sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        inputProps={{ maxLength: 5 }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="CVV"
                                        name="cvv"
                                        type="password"
                                        value={formData.cvv}
                                        onChange={handleChange}
                                        onFocus={handleCVVFocus}
                                        onBlur={handleCVVBlur}
                                        error={!!errors.cvv}
                                        helperText={errors.cvv}
                                        margin="normal"
                                        placeholder={cardType === 'amex' ? '••••' : '•••'}
                                        inputRef={cvvRef}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        inputProps={{ maxLength: cardType === 'amex' ? 4 : 3 }}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}

                    {selectedCard && (
                        <TextField
                            fullWidth
                            label="CVV"
                            name="cvv"
                            type="password"
                            value={formData.cvv}
                            onChange={handleChange}
                            onFocus={handleCVVFocus}
                            onBlur={handleCVVBlur}
                            error={!!errors.cvv}
                            helperText={errors.cvv || 'Enter CVV to continue'}
                            margin="normal"
                            placeholder={cardType === 'amex' ? '••••' : '•••'}
                            inputRef={cvvRef}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{ maxLength: cardType === 'amex' ? 4 : 3 }}
                        />
                    )}

                    <TextField
                        fullWidth
                        label="Amount (₹)"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        margin="normal"
                        placeholder="1000.00"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AttachMoney sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Merchant (Optional)"
                        name="merchant"
                        value={formData.merchant}
                        onChange={handleChange}
                        margin="normal"
                        placeholder="Online Store"
                    />

                    {/* Save Card Checkbox - only show for new cards */}
                    {!selectedCard && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={saveCard}
                                    onChange={(e) => setSaveCard(e.target.checked)}
                                    sx={{
                                        color: 'rgba(255,255,255,0.5)',
                                        '&.Mui-checked': {
                                            color: '#667eea'
                                        }
                                    }}
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Save this card for future payments
                                </Typography>
                            }
                            sx={{ mt: 2 }}
                        />
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 3,
                            py: 1.5,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5c6bc0 0%, #6a1b9a 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 30px rgba(102, 126, 234, 0.5)',
                            },
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} sx={{ color: '#fff' }} />
                        ) : (
                            `Pay ₹${formData.amount || '0.00'}`
                        )}
                    </Button>

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            textAlign: 'center',
                            mt: 2,
                            color: 'rgba(255,255,255,0.4)'
                        }}
                    >
                        🔒 Secured by SecurePay Gateway (Simulation)
                    </Typography>
                </Paper>
            </div>

            {/* OTP Modal */}
            {showOTP && (
                <OTPModal
                    transactionId={transactionId}
                    onSuccess={handleOTPSuccess}
                    onFailure={handleOTPFailure}
                    onClose={() => setShowOTP(false)}
                />
            )}

            {/* Payment Result */}
            {paymentResult && (
                <PaymentResult
                    success={paymentResult.success}
                    transaction={paymentResult.transaction}
                    message={paymentResult.message}
                    onClose={handleCloseResult}
                />
            )}

            {/* Card Scanner Modal */}
            {showScanner && (
                <CardScanner
                    onScanComplete={handleScanComplete}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </Box>
    );
};

export default PaymentForm;
