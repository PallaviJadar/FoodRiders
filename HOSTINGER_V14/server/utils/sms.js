let twilio;
try {
    twilio = require('twilio');
} catch (e) {
    console.warn('⚠️ [CRITICAL] twilio module missing on server. SMS will be simulated.');
}

const axios = require('axios');

const accountSid1 = process.env.TWILIO_ACCOUNT_SID;
const authToken1 = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber1 = process.env.TWILIO_PHONE_NUMBER;

const fast2smsKey = process.env.FAST2SMS_API_KEY;

// Only initialize if we have credentials AND module
let client1;

if (twilio && accountSid1 && authToken1 && accountSid1 !== 'AC_YOUR_SID' && !accountSid1.includes('account_sid')) {
    try {
        client1 = twilio(accountSid1, authToken1);
    } catch (e) {
        console.error('Twilio Initialization Failed:', e.message);
    }
}

const sendSMS = async (to, message) => {
    // Sanitize number: remove hyphens, spaces, etc.
    let cleanNumber = to.replace(/[^0-9+]/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+91${cleanNumber.slice(-10)}`;
    const rawNumber10 = cleanNumber.slice(-10);

    const results = [];
    let lastError = null;

    // 1. Try Twilio
    if (client1 && twilioNumber1) {
        try {
            console.log(`[SMS] Attempting Twilio for ${formattedNumber}...`);
            const response1 = await client1.messages.create({
                body: message,
                from: twilioNumber1,
                to: formattedNumber
            });
            console.log(`✅ SMS (Twilio) sent. SID: ${response1.sid}`);
            return { success: true, provider: 'twilio', sid: response1.sid };
        } catch (err) {
            console.error('❌ Twilio Error:', err.message);
            lastError = err.message;
        }
    }

    // 2. Try Fast2SMS (Fallback)
    if (fast2smsKey && fast2smsKey !== 'your_fast2sms_api_key_here' && fast2smsKey.length > 10) {
        try {
            console.log(`[SMS] Attempting Fast2SMS for ${rawNumber10}...`);
            // Extract OTP from message (look for 6 digits)
            const otpMatch = message.match(/\d{6}/);
            const otpCode = otpMatch ? otpMatch[0] : null;

            let response;
            if (otpCode) {
                // Use Fast2SMS OTP route
                response = await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${otpCode}&numbers=${rawNumber10}`);
            } else {
                // Use Fast2SMS Default route
                response = await axios.get(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=v3&sender_id=TXTIND&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${rawNumber10}`);
            }

            if (response.data && response.data.return) {
                console.log(`✅ SMS (Fast2SMS) sent to ${rawNumber10}`);
                return { success: true, provider: 'fast2sms' };
            } else {
                console.error('❌ Fast2SMS API Error:', response.data);
                lastError = response.data.message || 'Fast2SMS failed';
            }
        } catch (err) {
            console.error('❌ Fast2SMS Error:', err.message);
            lastError = err.message;
        }
    }

    // 3. Last Resort: Logging
    console.warn(`\n⚠️ [SMS FAILURE] Could not send real SMS to ${to}.`);
    console.warn(`MESSAGE: ${message}`);
    console.warn(`REASON: ${lastError || 'No providers available'}\n`);

    const isProd = process.env.NODE_ENV === 'production';

    return {
        success: !isProd, // In prod, this is a failure
        simulated: true,
        reason: lastError || 'No credentials'
    };

};

module.exports = { sendSMS };

