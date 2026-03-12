const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { encrypt } = require('../utils/encryption');
const Otp = require('../models/Otp');
const rateLimit = require('express-rate-limit');
const { initFirebase } = require('../utils/firebase');
const admin = initFirebase();

// Simplified Rate Limiter for compatibility
const otpRateLimiter = (req, res, next) => next();

// AUTH MIDDLEWARE
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/me', auth, async (req, res) => {
    res.json(req.user);
});

// @route   POST api/auth/send-otp
// @desc    RETIRED - Firebase now handles all client-side OTP sending
router.post('/send-otp', (req, res) => {
    res.status(410).json({ success: false, message: 'Endpoint retired. Please use Firebase SDK.' });
});

// @route   POST api/auth/send-otp-fallback
// @desc    Server-side OTP via Twilio SMS (fallback when Firebase client-side fails)
router.post('/send-otp-fallback', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
    }

    try {
        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB
        await Otp.findOneAndUpdate(
            { mobile },
            {
                otp: otpCode,
                verified: false,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min expiry
            },
            { upsert: true, new: true }
        );

        // Send via Twilio SMS
        const { sendSMS } = require('../utils/sms');
        const smsResult = await sendSMS(`+91${mobile}`, `Your FoodRiders verification code is: ${otpCode}. Valid for 5 minutes.`);

        if (smsResult.success) {
            console.log(`[OTP] ✅ Server OTP sent to ${mobile}`);
            res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error(`[OTP] ❌ SMS send failed for ${mobile}:`, smsResult.reason);
            res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
        }
    } catch (err) {
        console.error('[OTP] Server OTP error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST api/auth/verify-otp-fallback
// @desc    Verify server-side OTP
router.post('/verify-otp-fallback', async (req, res) => {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
        return res.status(400).json({ success: false, message: 'Mobile and OTP required' });
    }

    try {
        const otpRecord = await Otp.findOne({ mobile });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
        }

        if (new Date() > otpRecord.expiresAt) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
        }

        // Mark as verified
        otpRecord.verified = true;
        await otpRecord.save();

        console.log(`[OTP] ✅ Server OTP verified for ${mobile}`);
        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('[OTP] Verify error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/firebase-login', async (req, res) => {
    const { token, mobile } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Firebase token required' });

    try {
        if (!admin) {
            console.error('❌ [FIREBASE LOGIN] Admin SDK NOT initialized!');
            return res.status(500).json({ success: false, message: 'Server configuration error (Firebase)' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const phone = decodedToken.phone_number;

        if (!phone) {
            console.error('❌ [FIREBASE LOGIN] No phone number returned from token.');
            return res.status(401).json({ success: false, message: 'Invalid token: No phone number associated.' });
        }

        // 2. Clean phone number (digits only for local DB lookup)
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);

        // 3. Mark in DB as verified so login-or-signup / reset-pin can proceed
        await Otp.findOneAndUpdate(
            { mobile: cleanPhone },
            {
                otp: 'FIREBASE',
                verified: true,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min session
            },
            { upsert: true, new: true }
        );

        // Return verified status so frontend can proceed to profile/login-or-signup
        res.json({ success: true, mobile: cleanPhone });
    } catch (err) {
        console.error('🔥 [FIREBASE AUTH ERROR]:', err.message);
        const expired = err.code === 'auth/id-token-expired';
        res.status(401).json({
            success: false,
            message: expired ? 'Verification session expired. Please resend OTP.' : 'Identity verification failed. Please try again.'
        });
    }
});

// @route   POST api/auth/login-or-signup
router.post('/login-or-signup', async (req, res) => {
    const { mobile, pin, referralCode, fullName, deviceId } = req.body;
    try {
        if (!mobile || !pin) return res.status(400).json({ message: 'Mobile and PIN required' });
        let user = await User.findOne({ mobile });

        if (user) {
            if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });
            const hashToVerify = user.pin || user.password;
            const isMatch = await bcrypt.compare(pin, hashToVerify);
            if (!isMatch) return res.status(400).json({ message: 'Invalid PIN' });

            if (fullName && (!user.fullName || user.fullName.startsWith('User'))) user.fullName = fullName;
            if (deviceId) user.deviceId = deviceId;
            await user.save();
        } else {
            const otpRecord = await Otp.findOne({ mobile, verified: true });
            if (!otpRecord) return res.status(400).json({ message: 'Verification required' });

            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(pin, salt);
            user = new User({
                mobile,
                pin: hashedPin,
                fullName: fullName || ('User ' + mobile.slice(-4)),
                deviceId
            });
            await user.save();
            await Otp.deleteOne({ _id: otpRecord._id });

            if (referralCode) {
                try {
                    const Referral = require('../models/Referral');
                    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
                    if (referrer) {
                        const referral = new Referral({
                            referrerId: referrer._id,
                            newUserId: user._id,
                            status: 'PENDING',
                            newUserReward: 20
                        });
                        await referral.save();
                    }
                } catch (refErr) { console.error('Referral error ignored:', refErr); }
            }
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        // CRITICAL FIX: Return _id to match frontend expectations
        res.json({
            token,
            user: {
                _id: user._id,
                id: user._id,
                fullName: user.fullName,
                mobile: user.mobile,
                role: user.role,
                walletBalance: user.walletBalance || 0
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.post('/reset-pin', async (req, res) => {
    const { mobile, newPin } = req.body;
    try {
        const otpRecord = await Otp.findOne({ mobile, verified: true });
        if (!otpRecord) return res.status(400).json({ message: 'Verification required' });

        const user = await User.findOne({ mobile });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.pin = await bcrypt.hash(newPin, salt);
        await user.save();
        await Otp.deleteOne({ _id: otpRecord._id });
        res.json({ success: true, message: 'PIN reset successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/check-user', async (req, res) => {
    try {
        const user = await User.findOne({ mobile: req.body.mobile });
        res.json({ exists: !!user, isNewUser: !user });
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/validate-referral', async (req, res) => {
    try {
        const referrer = await User.findOne({ referralCode: req.body.referralCode?.toUpperCase() });
        if (!referrer) return res.json({ valid: false, message: 'Invalid code' });
        res.json({ valid: true, message: `Valid code from ${referrer.fullName}`, referrerName: referrer.fullName });
    } catch (err) {
        res.json({ valid: false, message: 'Error' });
    }
});

module.exports = router;
