import { Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Cancel } from '@mui/icons-material';

const PaymentResult = ({ success, transaction, message, onClose }) => {
    return (
        <AnimatePresence>
            <motion.div
                className="otp-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="otp-modal"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="result-popup">
                        {/* Icon */}
                        <motion.div
                            className={`result-icon ${success ? 'success' : 'failure'}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        >
                            {success ? (
                                <CheckCircle sx={{ fontSize: 60 }} />
                            ) : (
                                <Cancel sx={{ fontSize: 60 }} />
                            )}
                        </motion.div>

                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                {success ? 'Payment Successful!' : 'Payment Failed'}
                            </Typography>
                        </motion.div>

                        {/* Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {success && transaction ? (
                                <Box sx={{ textAlign: 'left', mb: 4 }}>
                                    <Box
                                        sx={{
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 2,
                                            p: 3,
                                            mb: 2
                                        }}
                                    >
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                mb: 2
                                            }}
                                        >
                                            ₹{transaction.amount?.toFixed(2)}
                                        </Typography>

                                        <Box sx={{ display: 'grid', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    Transaction ID
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        color: 'rgba(255,255,255,0.8)'
                                                    }}
                                                >
                                                    {transaction.id?.slice(-12).toUpperCase()}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    Merchant
                                                </Typography>
                                                <Typography variant="body2">
                                                    {transaction.merchant}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    Card
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: 'monospace' }}
                                                >
                                                    {transaction.maskedCard}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    Status
                                                </Typography>
                                                <span className="status-badge completed">
                                                    {transaction.status}
                                                </span>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'rgba(255,255,255,0.4)',
                                            display: 'block',
                                            textAlign: 'center'
                                        }}
                                    >
                                        A confirmation email has been sent to your registered address.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mb: 4 }}>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'rgba(255,255,255,0.7)',
                                            mb: 2
                                        }}
                                    >
                                        {message || 'Your payment could not be processed. Please try again.'}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'rgba(255,255,255,0.4)',
                                            display: 'block'
                                        }}
                                    >
                                        If the problem persists, please contact support.
                                    </Typography>
                                </Box>
                            )}
                        </motion.div>

                        {/* Close Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button
                                variant="contained"
                                onClick={onClose}
                                sx={{
                                    px: 6,
                                    py: 1.5,
                                    borderRadius: 2,
                                    background: success
                                        ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    fontWeight: 600,
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: success
                                            ? '0 8px 30px rgba(76, 175, 80, 0.4)'
                                            : '0 8px 30px rgba(102, 126, 234, 0.4)',
                                    }
                                }}
                            >
                                {success ? 'Done' : 'Try Again'}
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PaymentResult;
