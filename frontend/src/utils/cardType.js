/**
 * Detect card type from card number
 */
export const detectCardType = (number) => {
    const cleanNumber = number.replace(/\D/g, '');

    // Visa: Starts with 4
    if (/^4/.test(cleanNumber)) {
        return 'visa';
    }

    // MasterCard: Starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
        return 'mastercard';
    }

    // American Express: Starts with 34 or 37
    if (/^3[47]/.test(cleanNumber)) {
        return 'amex';
    }

    // RuPay: Starts with 60, 65, 81, 82, 508
    if (/^(60|65|81|82|508)/.test(cleanNumber)) {
        return 'rupay';
    }

    return 'unknown';
};

/**
 * Get card type display name
 */
export const getCardTypeName = (type) => {
    const names = {
        visa: 'Visa',
        mastercard: 'MasterCard',
        amex: 'American Express',
        rupay: 'RuPay',
        unknown: 'Card'
    };
    return names[type] || 'Card';
};

/**
 * Get card gradient colors
 */
export const getCardGradient = (type) => {
    const gradients = {
        visa: 'linear-gradient(135deg, #1a1f71 0%, #f7b600 100%)',
        mastercard: 'linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)',
        amex: 'linear-gradient(135deg, #007bc1 0%, #002663 100%)',
        rupay: 'linear-gradient(135deg, #097969 0%, #ff6600 100%)',
        unknown: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    return gradients[type] || gradients.unknown;
};

/**
 * Format card number with spaces
 */
export const formatCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    const cardType = detectCardType(cleanNumber);

    // Amex: 4-6-5 format
    if (cardType === 'amex') {
        const parts = cleanNumber.match(/(\d{0,4})(\d{0,6})(\d{0,5})/);
        if (parts) {
            return [parts[1], parts[2], parts[3]].filter(Boolean).join(' ');
        }
    }

    // Others: 4-4-4-4 format
    const parts = cleanNumber.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
    if (parts) {
        return [parts[1], parts[2], parts[3], parts[4]].filter(Boolean).join(' ');
    }

    return cleanNumber;
};

/**
 * Format expiry date
 */
export const formatExpiry = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
        return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
};

/**
 * Validate card number using Luhn's algorithm
 */
export const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Validate expiry date
 */
export const validateExpiry = (expiry) => {
    const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv, cardType) => {
    const cleanCVV = cvv.replace(/\D/g, '');

    if (cardType === 'amex') {
        return cleanCVV.length === 4;
    }

    return cleanCVV.length === 3;
};

/**
 * Get CVV length for card type
 */
export const getCVVLength = (cardType) => {
    return cardType === 'amex' ? 4 : 3;
};

/**
 * Mask card number
 */
export const maskCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    const lastFour = cleanNumber.slice(-4);
    return `****-****-****-${lastFour}`;
};
