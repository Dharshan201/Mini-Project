import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    IconButton,
    CircularProgress,
    Paper,
    Alert,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    CameraAlt,
    Close,
    FlipCameraAndroid,
    PhotoCamera,
    Check,
    Replay
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';

const CardScanner = ({ onScanComplete, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [capturedImage, setCapturedImage] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState('');
    const [isFrontSide, setIsFrontSide] = useState(true);
    const [detectedFields, setDetectedFields] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
    });

    // Start camera on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            setError('');

            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('Camera not supported. Please use a modern browser with HTTPS.');
                return;
            }

            // Try different camera constraints
            const constraints = [
                // First try: simple video
                { video: true },
                // Second try: with resolution
                { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
                // Third try: rear camera for mobile
                { video: { facingMode: 'environment' } },
                // Fourth try: front camera
                { video: { facingMode: 'user' } }
            ];

            let stream = null;
            let lastError = null;

            for (const constraint of constraints) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraint);
                    break;
                } catch (err) {
                    lastError = err;
                    console.log('Constraint failed:', constraint, err.message);
                }
            }

            if (!stream) {
                throw lastError || new Error('Could not access camera');
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = resolve;
                });
            }
        } catch (err) {
            console.error('Camera error:', err);

            let errorMessage = 'Unable to access camera. ';

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Permission was denied. Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera device found. Please connect a webcam.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Camera is in use by another application. Please close other apps using the camera.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Camera does not meet requirements. Trying with basic settings.';
            } else if (err.name === 'SecurityError') {
                errorMessage += 'Camera access is blocked. Please use HTTPS or localhost.';
            } else {
                errorMessage += err.message || 'Unknown error occurred.';
            }

            setError(errorMessage);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply image processing for better OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            // Increase contrast
            const contrast = 1.5;
            const adjusted = ((avg - 128) * contrast) + 128;
            const value = Math.max(0, Math.min(255, adjusted));

            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
        }

        ctx.putImageData(imageData, 0, 0);

        return canvas.toDataURL('image/png');
    }, []);

    const extractCardDetails = (text) => {
        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        const result = { ...detectedFields };

        // Pattern for card number (13-19 digits, possibly with spaces)
        const cardNumberPattern = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4})\b/g;
        const amexPattern = /\b(\d{4}[\s-]?\d{6}[\s-]?\d{5})\b/g;

        // Pattern for expiry date (MM/YY or MM/YYYY)
        const expiryPattern = /\b(0[1-9]|1[0-2])\s*[\/\-]\s*(\d{2}|\d{4})\b/g;

        // Pattern for CVV (3-4 digits on back)
        const cvvPattern = /\b(\d{3,4})\b/g;

        // Pattern for names (uppercase words)
        const namePattern = /^[A-Z][A-Z\s]{2,30}$/;

        const fullText = text.toUpperCase();

        // Extract card number
        let cardMatch = fullText.match(cardNumberPattern) || fullText.match(amexPattern);
        if (cardMatch) {
            const cardNum = cardMatch[0].replace(/[\s-]/g, '');
            if (cardNum.length >= 13 && cardNum.length <= 19) {
                result.cardNumber = cardNum;
            }
        }

        // Extract expiry date
        const expiryMatch = fullText.match(expiryPattern);
        if (expiryMatch) {
            let expiry = expiryMatch[0].replace(/\s/g, '');
            // Normalize to MM/YY format
            if (expiry.length > 5) {
                expiry = expiry.slice(0, 3) + expiry.slice(-2);
            }
            if (!expiry.includes('/')) {
                expiry = expiry.slice(0, 2) + '/' + expiry.slice(2);
            }
            result.expiryDate = expiry;
        }

        // Extract CVV (only if scanning back side)
        if (!isFrontSide) {
            // Look for 3-4 digit numbers that could be CVV
            const allNumbers = fullText.match(/\b\d{3,4}\b/g) || [];
            // CVV is usually standalone and near "CVV", "CVC", or "Security"
            if (fullText.includes('CVV') || fullText.includes('CVC') || fullText.includes('SECURITY')) {
                const cvvCandidates = allNumbers.filter(n => n.length === 3 || n.length === 4);
                if (cvvCandidates.length > 0) {
                    result.cvv = cvvCandidates[0];
                }
            } else if (allNumbers.length > 0) {
                // Just take the first 3-4 digit number as CVV
                const cvvCandidates = allNumbers.filter(n => n.length === 3 || n.length === 4);
                if (cvvCandidates.length > 0) {
                    result.cvv = cvvCandidates[0];
                }
            }
        }

        // Extract card holder name
        lines.forEach(line => {
            const cleanLine = line.replace(/[^A-Z\s]/g, '').trim();
            if (namePattern.test(cleanLine) && cleanLine.length > 3) {
                // Avoid common card text
                const skipWords = ['VISA', 'MASTERCARD', 'AMEX', 'VALID', 'THRU', 'MEMBER', 'SINCE', 'PLATINUM', 'GOLD', 'CREDIT', 'DEBIT'];
                if (!skipWords.some(word => cleanLine.includes(word))) {
                    if (!result.cardHolder || cleanLine.length > result.cardHolder.length) {
                        result.cardHolder = cleanLine;
                    }
                }
            }
        });

        return result;
    };

    const handleCapture = async () => {
        const imageData = captureFrame();
        if (!imageData) {
            setError('Failed to capture image');
            return;
        }

        setCapturedImage(imageData);
        setIsScanning(true);
        setScanProgress(0);

        try {
            const result = await Tesseract.recognize(imageData, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setScanProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const extractedData = extractCardDetails(result.data.text);

            // Merge with existing detected fields
            const mergedFields = {
                cardNumber: extractedData.cardNumber || detectedFields.cardNumber,
                cardHolder: extractedData.cardHolder || detectedFields.cardHolder,
                expiryDate: extractedData.expiryDate || detectedFields.expiryDate,
                cvv: extractedData.cvv || detectedFields.cvv
            };

            setDetectedFields(mergedFields);
            setScanResult({
                text: result.data.text,
                confidence: result.data.confidence,
                extracted: extractedData
            });

        } catch (err) {
            console.error('OCR error:', err);
            setError('Failed to scan card. Please try again with better lighting.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setScanResult(null);
        setError('');
    };

    const handleFlipCard = () => {
        setIsFrontSide(!isFrontSide);
        setCapturedImage(null);
        setScanResult(null);
    };

    const handleConfirm = () => {
        onScanComplete(detectedFields);
    };

    const hasAnyField = detectedFields.cardNumber || detectedFields.cardHolder ||
        detectedFields.expiryDate || detectedFields.cvv;

    return (
        <AnimatePresence>
            <motion.div
                className="otp-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                        background: 'rgba(26, 26, 46, 0.98)',
                        borderRadius: 16,
                        padding: 24,
                        width: '90%',
                        maxWidth: 600,
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                📷 Scan Card
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                {isFrontSide ? 'Scanning front side (Number, Name, Expiry)' : 'Scanning back side (CVV)'}
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            <Close />
                        </IconButton>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setError('');
                                        startCamera();
                                    }}
                                >
                                    Retry
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Camera / Captured Image */}
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 3,
                            overflow: 'hidden',
                            background: '#000',
                            mb: 3,
                            aspectRatio: '16/10'
                        }}
                    >
                        {capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured card"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        )}

                        {/* Scanning overlay */}
                        {isScanning && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.7)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <CircularProgress sx={{ color: '#667eea', mb: 2 }} />
                                <Typography sx={{ color: '#fff', mb: 1 }}>
                                    Scanning... {scanProgress}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={scanProgress}
                                    sx={{ width: '60%', borderRadius: 1 }}
                                />
                            </Box>
                        )}

                        {/* Card guide frame */}
                        {!capturedImage && !isScanning && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '10%',
                                    left: '10%',
                                    right: '10%',
                                    bottom: '10%',
                                    border: '2px dashed rgba(102, 126, 234, 0.8)',
                                    borderRadius: 2,
                                    pointerEvents: 'none'
                                }}
                            >
                                <Typography
                                    sx={{
                                        position: 'absolute',
                                        bottom: -30,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: 'rgba(255,255,255,0.7)',
                                        fontSize: 12,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Position card within the frame
                                </Typography>
                            </Box>
                        )}

                        {/* Front/Back indicator */}
                        <Chip
                            label={isFrontSide ? 'FRONT' : 'BACK'}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                background: isFrontSide ? '#667eea' : '#764ba2',
                                color: '#fff',
                                fontWeight: 600
                            }}
                        />
                    </Box>

                    {/* Hidden canvas for image processing */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        {!capturedImage ? (
                            <>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<PhotoCamera />}
                                    onClick={handleCapture}
                                    disabled={isScanning}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 600
                                    }}
                                >
                                    Capture {isFrontSide ? 'Front' : 'Back'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<FlipCameraAndroid />}
                                    onClick={handleFlipCard}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.8)'
                                    }}
                                >
                                    {isFrontSide ? 'Scan Back' : 'Scan Front'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<Replay />}
                                    onClick={handleRetake}
                                    disabled={isScanning}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.8)'
                                    }}
                                >
                                    Retake
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<FlipCameraAndroid />}
                                    onClick={() => { handleRetake(); handleFlipCard(); }}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.8)'
                                    }}
                                >
                                    {isFrontSide ? 'Scan Back' : 'Scan Front'}
                                </Button>
                            </>
                        )}
                    </Box>

                    {/* Detected Fields */}
                    <Paper
                        sx={{
                            p: 3,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.08)',
                            mb: 3
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                            Detected Information
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Card Number
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontFamily: 'monospace',
                                        color: detectedFields.cardNumber ? '#4caf50' : 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    {detectedFields.cardNumber
                                        ? detectedFields.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                                        : 'Not detected'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Expiry Date
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: detectedFields.expiryDate ? '#4caf50' : 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    {detectedFields.expiryDate || 'Not detected'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Card Holder
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: detectedFields.cardHolder ? '#4caf50' : 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    {detectedFields.cardHolder || 'Not detected'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    CVV
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontFamily: 'monospace',
                                        color: detectedFields.cvv ? '#4caf50' : 'rgba(255,255,255,0.3)'
                                    }}
                                >
                                    {detectedFields.cvv || 'Not detected (scan back)'}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* OCR Debug Info */}
                    {scanResult && (
                        <Paper
                            sx={{
                                p: 2,
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 2,
                                mb: 3,
                                maxHeight: 100,
                                overflow: 'auto'
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                OCR Confidence: {scanResult.confidence?.toFixed(1)}%
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    color: 'rgba(255,255,255,0.3)',
                                    fontFamily: 'monospace',
                                    fontSize: 10,
                                    mt: 1
                                }}
                            >
                                {scanResult.text?.slice(0, 200)}...
                            </Typography>
                        </Paper>
                    )}

                    {/* Tips */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            💡 Tips: Use good lighting, hold card steady, and ensure all text is visible in the frame
                        </Typography>
                    </Box>

                    {/* Confirm Button */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={onClose}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.7)'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={<Check />}
                            onClick={handleConfirm}
                            disabled={!hasAnyField}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                background: hasAnyField
                                    ? 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                fontWeight: 600
                            }}
                        >
                            Use Scanned Data
                        </Button>
                    </Box>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CardScanner;
