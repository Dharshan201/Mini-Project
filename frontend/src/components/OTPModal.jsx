import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const OTPModal = ({ transactionId, onSuccess, onFailure, onClose }) => {
    const { api } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();

        // Countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onFailure('OTP expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onFailure]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }

        setOtp(newOtp);

        // Focus appropriate input
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async () => {
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/card/verify-otp', {
                transactionId,
                otp: otpString
            });

            if (response.data.success) {
                onSuccess(response.data);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'OTP verification failed';
            setError(message);

            // Clear OTP on failure
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();

            // If max attempts exceeded
            if (message.includes('exceeded') || message.includes('expired')) {
                setTimeout(() => onFailure(message), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                className="otp-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="otp-modal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        🔐 Enter OTP
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                        A 6-digit OTP has been sent to your registered email.
                    </Typography>

                    <Typography
                        variant="caption"
                        sx={{
                            color: '#667eea',
                            display: 'block',
                            mb: 2
                        }}
                    >
                        Demo: Enter 123456 to proceed
                    </Typography>

                    {/* OTP Inputs */}
                    <div className="otp-input-container" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <motion.input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="otp-input"
                                style={{
                                    borderColor: error ? '#f44336' : undefined
                                }}
                                whileFocus={{ scale: 1.1 }}
                            />
                        ))}
                    </div>

                    {error && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#f44336',
                                textAlign: 'center',
                                mb: 2
                            }}
                        >
                            {error}
                        </Typography>
                    )}

                    {/* Timer */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: timeLeft < 60 ? '#f44336' : 'rgba(255,255,255,0.6)'
                            }}
                        >
                            Time remaining: {formatTime(timeLeft)}
                        </Typography>
                    </Box>

                    {/* Buttons */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            disabled={loading}
                            sx={{
                                flex: 1,
                                py: 1.5,
                                borderRadius: 2,
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': {
                                    borderColor: 'rgba(255,255,255,0.4)',
                                    backgroundColor: 'rgba(255,255,255,0.05)'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleVerify}
                            disabled={loading || otp.join('').length !== 6}
                            sx={{
                                flex: 1,
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 600,
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5c6bc0 0%, #6a1b9a 100%)',
                                },
                                '&:disabled': {
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.3)'
                                }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: '#fff' }} />
                            ) : (
                                'Verify OTP'
                            )}
                        </Button>
                    </Box>

                    {/* Resend Option */}
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Button
                            variant="text"
                            size="small"
                            disabled={timeLeft > 240} // Enable after 1 minute
                            sx={{
                                color: timeLeft > 240 ? 'rgba(255,255,255,0.3)' : '#667eea',
                                textTransform: 'none'
                            }}
                        >
                            Resend OTP {timeLeft > 240 && `(${formatTime(timeLeft - 240)})`}
                        </Button>
                    </Box>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OTPModal;
