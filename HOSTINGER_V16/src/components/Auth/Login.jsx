
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getDeviceId } from '../../utils/deviceFingerprint';

import loginCss from './Login.module.css';

import { useAuth } from "../../context/AuthContext";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, requestFCMToken } from "../../firebase";

const Login = () => {
    const { login, closeAuthModal, authMessage } = useAuth();

    // Core states
    const [mobile, setMobile] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('login'); // login | otp | resetOtp

    // Profile & Referral States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [isNewUser, setIsNewUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(false);
    const [referralValidation, setReferralValidation] = useState({
        isValidating: false, isValid: null, message: ''
    });

    // UI & Loading states
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [otpVerified, setOtpVerified] = useState(false);

    useEffect(() => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const ref = urlParams.get('ref') || sessionStorage.getItem('referralCode');
            if (ref) {
                setReferralCode(ref);
                sessionStorage.setItem('referralCode', ref);
            }
        } catch (e) {
            console.warn("Session storage access restricted on this device:", e);
        }
    }, []);

    // Cleanup recaptcha on unmount
    useEffect(() => {
        return () => {
            destroyRecaptcha();
        };
    }, []);

    // ========== FULL RECAPTCHA DESTROY ==========
    const destroyRecaptcha = () => {
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (e) { }
            window.recaptchaVerifier = null;
        }
        // Force cleanup of any lingering internal grecaptcha states
        const containers = document.querySelectorAll('.grecaptcha-badge');
        containers.forEach(el => el.remove());

        if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            try { window.grecaptcha.reset(); } catch (e) { }
        }
    };

    // ========== RECAPTCHA SETUP (Initialize once) ==========
    const setupRecaptcha = async () => {
        try {
            if (!auth) {
                console.error('🔥 Firebase Auth is NOT initialized');
                return false;
            }

            // Ensure container exists in DOM
            let container = document.getElementById('recaptcha-container');
            if (!container) {
                // If not found, look for floating container and fix it
                const floater = document.getElementById('recaptcha-floating-container');
                if (floater) {
                    floater.id = 'recaptcha-container';
                    container = floater;
                }
            }

            if (!container) return false;

            // Re-initialize only if verifier is missing
            if (!window.recaptchaVerifier) {
                console.log('🏗️ Initializing Standard Firebase ReCAPTCHA (Invisible)...');
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {
                        console.log('✅ Recaptcha resolved');
                    },
                    'expired-callback': () => {
                        console.log('⚠️ Recaptcha expired');
                        if (window.recaptchaVerifier) {
                            window.recaptchaVerifier.clear();
                            window.recaptchaVerifier = null;
                        }
                    }
                });
            }

            await window.recaptchaVerifier.render();
            return true;
        } catch (err) {
            console.error('RecaptchaVerifier setup error:', err);
            return false;
        }
    };

    // Auto-setup Recaptcha on mount to prevent 'invalid-app-credential' delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setupRecaptcha();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // ========== CHECK USER EXISTS ==========
    const checkUserExists = async (mobileNumber) => {
        if (mobileNumber.length !== 10) { setIsNewUser(null); return false; }
        setCheckingUser(true);
        try {
            const response = await axios.post('/api/auth/check-user', { mobile: mobileNumber });
            const isNew = response.data.isNewUser === true;
            setIsNewUser(isNew);
            return !isNew;
        } catch (err) {
            console.error('Check user error:', err);
            setIsNewUser(null);
            return false;
        } finally {
            setCheckingUser(false);
        }
    };

    // ========== VALIDATE REFERRAL ==========
    const validateReferralCode = async (code) => {
        if (!code.trim()) {
            setReferralValidation({ isValidating: false, isValid: null, message: '' });
            return;
        }
        setReferralValidation({ isValidating: true, isValid: null, message: '' });
        try {
            const response = await axios.post('/api/auth/validate-referral', {
                referralCode: code.trim(), mobile
            });
            setReferralValidation({
                isValidating: false, isValid: response.data.valid, message: response.data.message
            });
        } catch (err) {
            setReferralValidation({ isValidating: false, isValid: false, message: 'Could not validate code' });
        }
    };

    // ========== SEND OTP (Firebase ONLY - Production Strategy) ==========
    const sendOTP = async (targetMobile) => {
        const phone = targetMobile || mobile;
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError("Enter valid 10-digit Indian mobile number");
            return false;
        }

        if (loading || otpCooldown > 0) return false;
        setLoading(true);
        setError('');

        const startCooldown = (seconds = 30) => {
            setOtpCooldown(seconds);
            const timer = setInterval(() => {
                setOtpCooldown(c => {
                    if (c <= 1) { clearInterval(timer); return 0; }
                    return c - 1;
                });
            }, 1000);
        };

        try {
            const isReady = await setupRecaptcha();
            if (!isReady) throw new Error('RECAPTCHA_FAILED');

            const formattedPhone = `+91${phone}`;
            const appVerifier = window.recaptchaVerifier;

            console.log('🏗️ Requesting Firebase OTP for:', formattedPhone);
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);

            setConfirmationResult(confirmation);
            setStep('otp'); // Always move to OTP step on success
            startCooldown(30);
            return true;
        } catch (err) {
            console.error('Firebase Auth Error:', err.code, err.message);

            // Fallback: If Firebase fails (e.g. localhost not authorized), use server-side OTP
            if (err.code === 'auth/invalid-app-credential' || err.message === 'RECAPTCHA_FAILED') {
                console.log('🔄 Firebase unavailable, trying server-side OTP fallback...');
                try {
                    const res = await axios.post('/api/auth/send-otp-fallback', { mobile: phone });
                    if (res.data.success) {
                        setConfirmationResult({ __serverOtp: true, mobile: phone });
                        setStep('otp');
                        startCooldown(30);
                        return true;
                    } else {
                        setError(res.data.message || 'Failed to send OTP. Please try again.');
                    }
                } catch (fallbackErr) {
                    console.error('Server OTP fallback also failed:', fallbackErr);
                    setError('Unable to send OTP. Please check your connection and try again.');
                }
                return false;
            }

            if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Please wait 60 seconds.");
                startCooldown(60);
            } else {
                setError(getFirebaseErrorMessage(err, 'send'));
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // ========== FIREBASE ERROR MAPPER ==========
    const getFirebaseErrorMessage = (err, context) => {
        const code = err?.code || '';
        const errorMap = {
            'auth/user-disabled': 'This phone number has been disabled. Contact support.',
            'auth/unauthorized-domain': 'Domain not authorized. Add foodriders.in to Firebase Authorized Domains.',
            'auth/invalid-app-credential': 'Firebase config mismatch or Identity Toolkit API disabled in Cloud Console.',
            'auth/operation-not-allowed': 'Phone auth is disabled in Firebase console.',
            'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
            'auth/quota-exceeded': 'SMS quota exceeded for today. Please try later.',
            'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
            'auth/code-expired': 'OTP has expired. Please request a new one.'
        };

        if (errorMap[code]) return errorMap[code];
        return err?.response?.data?.message || `Auth failed: ${code || 'Unknown error'}`;
    };

    // ========== CONTINUE BUTTON ==========
    const handleContinue = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (mobile.length !== 10) { setError('Enter 10-digit mobile number'); return; }
        if (pin.length !== 4) { setError('PIN must be 4 digits'); return; }

        setLoading(true);
        const userExists = await checkUserExists(mobile);
        setLoading(false);

        if (userExists) {
            completeAuth();
        } else {
            await sendOTP(mobile);
        }
    };

    // ========== FORGOT PIN ==========
    const handleForgotPin = async () => {
        if (!mobile || mobile.length !== 10) { setError('Enter mobile number first'); return; }
        const sent = await sendOTP(mobile);
        if (sent) setStep("resetOtp");
    };

    // ========== VERIFY OTP (Firebase + Server Sync) ==========
    const verifyOtp = async () => {
        if (otp.length !== 6) { setError("Enter 6-digit OTP"); return; }
        if (loading || !confirmationResult) return;

        setLoading(true);
        setError('');
        try {
            // Server-side OTP fallback path
            if (confirmationResult.__serverOtp) {
                const res = await axios.post('/api/auth/verify-otp-fallback', {
                    mobile: confirmationResult.mobile,
                    otp
                });
                if (res.data.success) {
                    console.log('✅ Server OTP Verified');
                    setOtpVerified(true);
                    if (step === "otp") {
                        completeAuth();
                    }
                } else {
                    setError(res.data.message || 'Invalid OTP');
                }
                return;
            }

            // 1. Client-side Firebase Verification
            const result = await confirmationResult.confirm(otp);
            const idToken = await result.user.getIdToken();

            // 2. Server-side ID Token Verification (Production Ready)
            await axios.post('/api/auth/firebase-login', {
                mobile,
                token: idToken
            });

            console.log('✅ OTP Verified & Session Synced with Server');
            setOtpVerified(true);

            if (step === "otp") {
                completeAuth();
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError(err.response?.data?.message || getFirebaseErrorMessage(err, 'verify'));
            if (err.code === 'auth/invalid-verification-code') setOtp('');
        } finally {
            setLoading(false);
        }
    };

    // ========== RESET PIN ==========
    const handleResetPin = async (e) => {
        if (e) e.preventDefault();
        if (pin.length !== 4) { setError('New PIN must be 4 digits'); return; }

        setLoading(true);
        setError('');
        try {
            await axios.post('/api/auth/reset-pin', { mobile, newPin: pin });
            setStep("login");
            setOtpVerified(false);
            setPin('');
            setOtp('');
            alert('PIN reset successful! Login with your new PIN.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset PIN');
        } finally {
            setLoading(false);
        }
    };

    // ========== COMPLETE AUTH ==========
    const completeAuth = async () => {
        setLoading(true);
        try {
            const fullName = (firstName && lastName) ? `${firstName} ${lastName}` : undefined;
            const deviceId = await getDeviceId();

            const res = await axios.post('/api/auth/login-or-signup', {
                mobile, pin,
                referralCode: referralCode.trim() || undefined,
                fullName, deviceId
            });

            if (res.data.user.role === 'admin') {
                localStorage.setItem('auth', 'true');
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('adminToken', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                window.location.href = '/admin/dashboard';
                return;
            }

            if (res.data.user.role === 'delivery_partner' || res.data.user.role === 'delivery') {
                localStorage.setItem('auth', 'true');
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('deliveryToken', res.data.token);
                localStorage.setItem('deliveryUser', JSON.stringify(res.data.user));
                localStorage.setItem('user', JSON.stringify(res.data.user));
                window.location.href = '/delivery-dashboard';
                return;
            }

            login(res.data.user, res.data.token);
            // Request FCM token after login
            setTimeout(() => {
                requestFCMToken().catch(err => console.warn('FCM token request failed:', err));
            }, 1000);
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.response?.data?.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const backToLogin = () => {
        setStep("login");
        setOtpVerified(false);
        setOtp('');
        setError('');
    };

    // ========== RENDER ==========
    const loginDiv = (
        <div className={loginCss.outerDiv}>
            <div className={loginCss.modal}>
                <div className={loginCss.header}>
                    <span className={loginCss.ttl}>Login / Signup</span>
                    <span className={loginCss.closeBtn} onClick={closeAuthModal}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                </div>
                {authMessage && <div className={loginCss.authNotice}>{authMessage}</div>}

                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {step === "otp"
                        ? `Enter the 6-digit OTP sent to +91${mobile}`
                        : step === "resetOtp" && !otpVerified
                            ? `Enter the 6-digit OTP sent to +91${mobile} to reset PIN`
                            : step === "resetOtp" && otpVerified
                                ? "Set your new 4-digit security PIN"
                                : "Enter mobile & PIN. New users will verify via OTP."}
                </p>

                {/* ===== OTP SCREEN ===== */}
                {(step === "otp" || (step === "resetOtp" && !otpVerified)) ? (
                    <div className={loginCss.lgBox}>
                        <div className={loginCss.inputGroup}>
                            <label className={loginCss.label}>Enter 6-Digit OTP</label>
                            <input
                                className={loginCss.inpBox}
                                type="tel"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem' }}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            className={loginCss.btn}
                            onClick={verifyOtp}
                            disabled={loading || otp.length !== 6}
                            style={{ background: '#059669' }}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <button
                                type="button"
                                onClick={() => sendOTP()}
                                disabled={otpCooldown > 0 || loading}
                                style={{ border: 'none', background: 'none', color: otpCooldown > 0 ? '#999' : '#ff4757', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                            </button>
                            <br />
                            <button
                                type="button"
                                onClick={backToLogin}
                                style={{ border: 'none', background: 'none', color: '#666', marginTop: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                ← Back to Login
                            </button>
                            <br />
                            <br />
                            <small
                                style={{ color: '#666', marginTop: '15px', display: 'inline-block', fontSize: '0.8rem' }}
                            >
                                Having trouble? Contact support at +91 9380801462
                            </small>

                        </div>
                    </div>

                ) : step === "resetOtp" && otpVerified ? (
                    /* ===== RESET PIN SCREEN ===== */
                    <form className={loginCss.lgBox} onSubmit={handleResetPin}>
                        <div className={loginCss.inputGroup}>
                            <label className={loginCss.label}>New 4-Digit Security PIN</label>
                            <input
                                className={loginCss.inpBox}
                                type={showPin ? "tel" : "password"}
                                inputMode="numeric"
                                placeholder='Type 4 digits'
                                required
                                value={pin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) setPin(val);
                                }}
                                style={{ letterSpacing: '5px', fontSize: '1.2rem' }}
                                autoComplete="off"
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                                {error}
                            </div>
                        )}

                        <button className={loginCss.btn} disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Resetting...' : 'Reset PIN'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <span onClick={backToLogin} style={{ cursor: 'pointer', color: '#666', fontSize: '0.85rem' }}>
                                ← Back to Login
                            </span>
                        </div>
                    </form>

                ) : (
                    /* ===== DEFAULT LOGIN FORM ===== */
                    <form className={loginCss.lgBox} onSubmit={handleContinue}>
                        <div className={loginCss.inputGroup}>
                            <label className={loginCss.label}>Mobile Number</label>
                            <input
                                className={loginCss.inpBox}
                                type="tel"
                                placeholder='e.g. 9876543210'
                                required
                                value={mobile}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) {
                                        setMobile(val);
                                        if (val.length === 10) checkUserExists(val);
                                        else setIsNewUser(null);
                                    }
                                }}
                            />
                            {checkingUser && <small style={{ color: '#3b82f6', fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>Checking...</small>}
                        </div>

                        {isNewUser && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className={loginCss.inputGroup}>
                                    <label className={loginCss.label}>First Name</label>
                                    <input className={loginCss.inpBox} type="text" placeholder='John' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div className={loginCss.inputGroup}>
                                    <label className={loginCss.label}>Last Name</label>
                                    <input className={loginCss.inpBox} type="text" placeholder='Doe' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {isNewUser && (
                            <div className={loginCss.inputGroup} style={{ marginTop: '10px' }}>
                                <label className={loginCss.label}>Referral Code (Optional)</label>
                                <input
                                    className={loginCss.inpBox}
                                    type="text"
                                    placeholder='Enter referral code'
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                    onBlur={() => validateReferralCode(referralCode)}
                                    maxLength={20}
                                    style={{ textTransform: 'uppercase' }}
                                />
                                {referralValidation.isValid === true && (
                                    <small style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>✓ {referralValidation.message}</small>
                                )}
                                {referralValidation.isValid === false && (
                                    <small style={{ color: '#f59e0b', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>⚠ {referralValidation.message}</small>
                                )}
                            </div>
                        )}

                        <div className={loginCss.inputGroup}>
                            <label className={loginCss.label}>4-Digit Security PIN</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className={loginCss.inpBox}
                                    type={showPin ? "tel" : "password"}
                                    inputMode="numeric"
                                    placeholder='Type 4 digits'
                                    required
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setPin(val);
                                    }}
                                    style={{ letterSpacing: '5px', fontSize: '1.2rem' }}
                                    autoComplete="off"
                                />
                                <span onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666' }}>
                                    {showPin ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem', background: '#fee2e2', padding: '10px', borderRadius: '6px' }}>
                                {error}
                            </div>
                        )}

                        <button className={loginCss.btn} disabled={loading} style={{ marginTop: '10px' }}>
                            {loading ? 'Processing...' : 'Continue'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <span onClick={handleForgotPin} style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', textDecoration: 'underline' }}>
                                Forgot PIN?
                            </span>
                        </div>
                    </form>
                )}
                {/* ===== RECAPTCHA CONTAINER ===== */}
                <div id="recaptcha-container" style={{
                    display: (step === 'login' || step === 'otp' || step === 'resetOtp') ? 'flex' : 'none',
                    justifyContent: 'center',
                    margin: '5px 0',
                    minHeight: '2px' // Invisible but reserved
                }}></div>

            </div>
        </div>
    );


    const modalRoot = document.getElementById('modal');
    if (!modalRoot) {
        console.error("CRITICAL: Modal root #modal not found in DOM");
        return loginDiv; // Fallback to normal rendering if portal target is missing
    }

    return createPortal(loginDiv, modalRoot);
}

export default Login;
