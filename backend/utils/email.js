const nodemailer = require('nodemailer');

/**
 * Create email transporter
 * Uses Ethereal for testing (fake SMTP service)
 */
let transporter = null;

const initializeTransporter = async () => {
    // Create Ethereal test account if no custom SMTP is configured
    if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('📧 Using Ethereal test email account:', testAccount.user);
    }

    return transporter;
};

/**
 * Send payment confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {number} options.amount - Transaction amount
 * @param {string} options.currency - Currency code
 * @param {string} options.maskedCard - Masked card number
 * @param {string} options.merchant - Merchant name
 * @param {string} options.transactionId - Transaction ID
 * @param {string} options.status - Transaction status
 */
const sendPaymentConfirmation = async (options) => {
    if (!transporter) {
        await initializeTransporter();
    }

    const { to, userName, amount, currency, maskedCard, merchant, transactionId, status } = options;

    const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const symbol = currencySymbols[currency] || currency;

    const statusColor = status === 'completed' ? '#4CAF50' : '#f44336';
    const statusText = status === 'completed' ? 'Successful' : 'Failed';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💳 SecurePay Gateway</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Payment Receipt</p>
          </td>
        </tr>
        
        <!-- Status Banner -->
        <tr>
          <td style="background-color: ${statusColor}; padding: 15px; text-align: center;">
            <span style="color: #ffffff; font-size: 18px; font-weight: bold;">
              ${status === 'completed' ? '✓' : '✗'} Payment ${statusText}
            </span>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              Hello <strong>${userName}</strong>,
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0;">
              ${status === 'completed'
            ? 'Your payment has been processed successfully. Here are the transaction details:'
            : 'Unfortunately, your payment could not be processed. Please try again or contact support.'}
            </p>
            
            <!-- Transaction Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="color: #666; font-size: 14px;">Transaction ID</span><br>
                        <span style="color: #333; font-size: 16px; font-weight: bold;">${transactionId}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="color: #666; font-size: 14px;">Amount</span><br>
                        <span style="color: #333; font-size: 24px; font-weight: bold;">${symbol}${amount.toFixed(2)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="color: #666; font-size: 14px;">Merchant</span><br>
                        <span style="color: #333; font-size: 16px;">${merchant}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <span style="color: #666; font-size: 14px;">Card Used</span><br>
                        <span style="color: #333; font-size: 16px; font-family: monospace;">${maskedCard}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <p style="color: #999; font-size: 12px; margin: 25px 0 0 0; text-align: center;">
              This is a simulated payment receipt. No actual transaction was processed.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} SecurePay Gateway - Payment Simulation System
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    const mailOptions = {
        from: '"SecurePay Gateway" <noreply@securepay.com>',
        to,
        subject: `Payment ${statusText} - ${symbol}${amount.toFixed(2)} at ${merchant}`,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);

        // For Ethereal, log the preview URL
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send OTP email (simulated)
 */
const sendOTPEmail = async (to, userName, otp = '123456') => {
    if (!transporter) {
        await initializeTransporter();
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; text-align: center;">
        <h2 style="color: #667eea;">🔐 Your OTP Code</h2>
        <p style="color: #666;">Hello ${userName},</p>
        <p style="color: #666;">Your one-time password for payment verification is:</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">
          <span style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px;">This OTP is valid for 5 minutes. Do not share this with anyone.</p>
        <p style="color: #999; font-size: 11px; margin-top: 30px;">This is a simulation. Use OTP: 123456</p>
      </div>
    </body>
    </html>
  `;

    try {
        const info = await transporter.sendMail({
            from: '"SecurePay Gateway" <noreply@securepay.com>',
            to,
            subject: 'Your Payment OTP - SecurePay Gateway',
            html
        });

        if (!process.env.SMTP_HOST) {
            console.log('📧 OTP Email Preview:', nodemailer.getTestMessageUrl(info));
        }

        return { success: true };
    } catch (error) {
        console.error('OTP Email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initializeTransporter,
    sendPaymentConfirmation,
    sendOTPEmail
};
