/**
 * Luhn's Algorithm Implementation
 * Used for validating credit card numbers
 */

/**
 * Validate a card number using Luhn's Algorithm
 * @param {string} cardNumber - The card number to validate (can include spaces/dashes)
 * @returns {boolean} - True if valid, false otherwise
 */
const validateCardNumber = (cardNumber) => {
    // Remove all non-digit characters
    const cleanNumber = cardNumber.replace(/\D/g, '');

    // Card number should be between 13 and 19 digits
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    // Loop through digits from right to left
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
 * Detect card type from card number
 * @param {string} cardNumber - The card number
 * @returns {string} - Card type: 'visa', 'mastercard', 'amex', 'rupay', or 'unknown'
 */
const detectCardType = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');

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
 * Validate expiry date
 * @param {string} expiry - Expiry date in MM/YY format
 * @returns {boolean} - True if valid and not expired
 */
const validateExpiry = (expiry) => {
    const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Check if card is expired
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    // Card shouldn't be valid for more than 10 years
    if (year > currentYear + 10) return false;

    return true;
};

/**
 * Validate CVV
 * @param {string} cvv - The CVV code
 * @param {string} cardType - The card type
 * @returns {boolean} - True if valid
 */
const validateCVV = (cvv, cardType) => {
    const cleanCVV = cvv.replace(/\D/g, '');

    // Amex has 4-digit CVV, others have 3
    if (cardType === 'amex') {
        return cleanCVV.length === 4;
    }

    return cleanCVV.length === 3;
};

/**
 * Mask a card number for display/storage
 * @param {string} cardNumber - The full card number
 * @returns {string} - Masked number like ****-****-****-1234
 */
const maskCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const lastFour = cleanNumber.slice(-4);
    return `****-****-****-${lastFour}`;
};

/**
 * Get last four digits
 * @param {string} cardNumber - The full card number
 * @returns {string} - Last 4 digits
 */
const getLastFourDigits = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.slice(-4);
};

/**
 * Format card number with spaces
 * @param {string} cardNumber - The card number
 * @returns {string} - Formatted number (XXXX XXXX XXXX XXXX)
 */
const formatCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
};

module.exports = {
    validateCardNumber,
    detectCardType,
    validateExpiry,
    validateCVV,
    maskCardNumber,
    getLastFourDigits,
    formatCardNumber
};
