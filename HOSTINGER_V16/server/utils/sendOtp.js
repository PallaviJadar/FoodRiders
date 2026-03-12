const { sendSMS } = require('./sms');

/**
 * Send OTP via Twilio/Fast2SMS
 * @param {string} mobile - 10-digit Indian mobile number
 * @param {string} otp - 6-digit OTP
 */
const sendOtp = async (mobile, otp) => {
    const message = `[FoodRiders] Your verification code is: ${otp}. Do not share it with anyone.`;

    try {
        const result = await sendSMS(mobile, message);
        return {
            success: true,
            message: result.simulated ? 'OTP request processed' : 'OTP sent via SMS',
            simulated: result.simulated
        };
    } catch (err) {
        console.error(' [OTP] SMS Delivery System Error:', err.message);
        return { success: false, message: 'SMS delivery failed' };
    }
};


module.exports = sendOtp;
