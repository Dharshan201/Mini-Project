import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    detectCardType,
    formatCardNumber,
    getCardGradient
} from '../utils/cardType';

// Card brand logos as SVG components
const VisaLogo = () => (
    <svg viewBox="0 0 50 16" fill="white" style={{ height: '24px' }}>
        <path d="M19.5 0.5L16.2 15.5H12.7L16 0.5H19.5ZM35.2 10.2L37.3 4.5L38.5 10.2H35.2ZM39.8 15.5H43L40.2 0.5H37.2C36.4 0.5 35.7 1 35.4 1.7L29.5 15.5H33.4L34.2 13.1H39L39.8 15.5ZM30.2 10.6C30.2 6.3 24.3 6 24.3 4.1C24.3 3.4 25 2.7 26.4 2.5C27.1 2.4 29 2.3 31.1 3.3L31.9 0.9C30.8 0.5 29.4 0.2 27.7 0.2C24 0.2 21.4 2.2 21.4 5C21.4 7 23.1 8.1 24.4 8.8C25.8 9.5 26.3 10 26.2 10.6C26.2 11.5 25.2 12 24 12C21.7 12 20.3 11.3 19.3 10.8L18.5 13.3C19.5 13.8 21.4 14.3 23.4 14.3C27.4 14.3 30.2 12.3 30.2 10.6ZM15.3 0.5L9.3 15.5H5.3L2.4 3.2C2.2 2.4 2.1 2.1 1.4 1.7C0.3 1.1 -0.9 0.7 -0.9 0.7L-0.8 0.5H5.1C5.9 0.5 6.7 1.1 6.9 2L8.3 9.6L12.1 0.5H15.3Z" />
    </svg>
);

const MasterCardLogo = () => (
    <svg viewBox="0 0 50 30" style={{ height: '30px' }}>
        <circle cx="18" cy="15" r="14" fill="#eb001b" />
        <circle cx="32" cy="15" r="14" fill="#f79e1b" />
        <path d="M25 4.5c3.5 2.5 5.8 6.5 5.8 11s-2.3 8.5-5.8 11c-3.5-2.5-5.8-6.5-5.8-11s2.3-8.5 5.8-11z" fill="#ff5f00" />
    </svg>
);

const AmexLogo = () => (
    <svg viewBox="0 0 50 16" fill="white" style={{ height: '24px' }}>
        <text x="0" y="12" fontFamily="Arial Black" fontSize="12" fontWeight="bold">AMEX</text>
    </svg>
);

const RuPayLogo = () => (
    <svg viewBox="0 0 60 20" fill="white" style={{ height: '24px' }}>
        <text x="0" y="16" fontFamily="Arial" fontSize="14" fontWeight="bold">RuPay</text>
    </svg>
);

const CardLogo = ({ type }) => {
    switch (type) {
        case 'visa':
            return <VisaLogo />;
        case 'mastercard':
            return <MasterCardLogo />;
        case 'amex':
            return <AmexLogo />;
        case 'rupay':
            return <RuPayLogo />;
        default:
            return null;
    }
};

const Card3D = ({
    cardNumber = '',
    cardHolder = '',
    expiryDate = '',
    cvv = '',
    isFlipped = false,
    isRotating = false
}) => {
    const [displayNumber, setDisplayNumber] = useState('•••• •••• •••• ••••');
    const [displayHolder, setDisplayHolder] = useState('YOUR NAME');
    const [displayExpiry, setDisplayExpiry] = useState('MM/YY');
    const [displayCVV, setDisplayCVV] = useState('•••');
    const [cardType, setCardType] = useState('unknown');

    useEffect(() => {
        // Update card number display with animation effect
        if (cardNumber) {
            const formatted = formatCardNumber(cardNumber);
            const padded = formatted.padEnd(19, '•').replace(/ /g, ' ');
            setDisplayNumber(padded);
            setCardType(detectCardType(cardNumber));
        } else {
            setDisplayNumber('•••• •••• •••• ••••');
            setCardType('unknown');
        }
    }, [cardNumber]);

    useEffect(() => {
        setDisplayHolder(cardHolder || 'YOUR NAME');
    }, [cardHolder]);

    useEffect(() => {
        if (expiryDate) {
            const formatted = expiryDate.replace(/(\d{2})(\d{0,2})/, (_, m, y) =>
                y ? `${m}/${y}` : m
            );
            setDisplayExpiry(formatted || 'MM/YY');
        } else {
            setDisplayExpiry('MM/YY');
        }
    }, [expiryDate]);

    useEffect(() => {
        if (cvv) {
            setDisplayCVV(cvv.replace(/./g, '•'));
        } else {
            setDisplayCVV(cardType === 'amex' ? '••••' : '•••');
        }
    }, [cvv, cardType]);

    return (
        <div className="card-container">
            <motion.div
                className={`credit-card ${isFlipped ? 'flipped' : ''} ${isRotating ? 'rotating' : ''}`}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                whileHover={{ scale: 1.02 }}
                style={{
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Front of Card */}
                <div
                    className={`card-face card-front ${cardType}`}
                    style={{ background: getCardGradient(cardType) }}
                >
                    {/* Shimmer effect overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                            animation: 'shimmer 3s infinite',
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Chip */}
                    <div className="card-chip">
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '6px',
                            width: '15px',
                            height: '10px',
                            border: '1px solid rgba(0,0,0,0.2)',
                            borderRadius: '2px'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '18px',
                            left: '6px',
                            width: '38px',
                            height: '1px',
                            background: 'rgba(0,0,0,0.2)'
                        }} />
                    </div>

                    {/* Contactless Icon */}
                    <div className="contactless-icon">
                        <span></span>
                    </div>

                    {/* Card Number */}
                    <motion.div
                        className="card-number"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={displayNumber}
                    >
                        {displayNumber.split('').map((char, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                style={{
                                    display: 'inline-block',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                    fontWeight: 600
                                }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </motion.div>

                    {/* Card Holder */}
                    <div className="card-holder">
                        <div className="card-label">Card Holder</div>
                        <motion.div
                            className="card-value"
                            key={displayHolder}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {displayHolder.toUpperCase()}
                        </motion.div>
                    </div>

                    {/* Expiry Date */}
                    <div className="card-expiry">
                        <div className="card-label">Expires</div>
                        <motion.div
                            className="card-value"
                            key={displayExpiry}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {displayExpiry}
                        </motion.div>
                    </div>

                    {/* Card Logo */}
                    <div className="card-logo">
                        <CardLogo type={cardType} />
                    </div>
                </div>

                {/* Back of Card */}
                <div className="card-face card-back">
                    {/* Magnetic Stripe */}
                    <div className="magnetic-stripe" />

                    {/* Signature Strip with CVV */}
                    <div style={{
                        position: 'absolute',
                        top: '100px',
                        left: '25px',
                        right: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{
                            flex: 1,
                            height: '40px',
                            background: 'linear-gradient(to right, #f5f5f5, #e0e0e0)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            padding: '0 15px',
                            fontStyle: 'italic',
                            color: '#666',
                            fontSize: '14px'
                        }}>
                            Authorized Signature
                        </div>
                        <div className="cvv-area" style={{ margin: 0 }}>
                            <div className="cvv-label">CVV</div>
                            <motion.div
                                className="cvv-value"
                                key={displayCVV}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {displayCVV}
                            </motion.div>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div style={{
                        position: 'absolute',
                        bottom: '25px',
                        left: '25px',
                        right: '25px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '10px',
                        lineHeight: 1.5
                    }}>
                        <p>This card is property of SecurePay Bank.</p>
                        <p>If found, please return to any SecurePay branch.</p>
                        <p>Customer Service: 1-800-SECUREPAY</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Card3D;
