import { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

import css from './ForgotPass.module.css';
import PasswordInput from '../../utils/FormUtils/PasswordInput.jsx';

const ForgotPass = ({ setAuth }) => {
    const [step, setStep] = useState(1); // 1: Mobile, 2: OTP + New Pass
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { mobile });
            setStep(2);
            setMessage('OTP sent to your mobile');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const onResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) return setError('Passwords do not match');
        if (otp.length < 4) return setError('Enter 4-digit OTP');

        setLoading(true);
        try {
            await axios.post('/api/auth/reset-password', {
                mobile,
                otp,
                newPassword
            });
            setMessage('Password reset successful! You can now log in.');
            setTimeout(() => setAuth({ closed: false, login: true, signup: false }), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const domContent = (
        <div className={css.outerDiv}>
            <div className={css.modal}>
                <div className={css.header}>
                    <span className={css.ttl}>Reset Password</span>
                    <span className={css.closeBtn} onClick={() => setAuth({ closed: true, login: false, signup: false })}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                </div>

                {message && <div className={css.successMsg}>{message}</div>}
                {error && <div className={css.errorMsg}>{error}</div>}

                {step === 1 ? (
                    <form className={css.form} onSubmit={onSendOTP}>
                        <div className={css.inputGroup}>
                            <label className={css.label}>Enter Mobile Number</label>
                            <input
                                className={css.inpBox}
                                type="tel"
                                placeholder="9876543210"
                                required
                                value={mobile}
                                onChange={e => setMobile(e.target.value)}
                                maxLength="10"
                            />
                        </div>
                        <button className={css.btn} disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                        </button>
                    </form>
                ) : (
                    <form className={css.form} onSubmit={onResetPassword}>
                        <div className={css.inputGroup}>
                            <label className={css.label}>Enter OTP</label>
                            <input
                                className={css.inpBox}
                                type="text"
                                placeholder="4-digit code"
                                required
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                maxLength="4"
                            />
                        </div>
                        <div className={css.inputGroup}>
                            <label className={css.label}>New Password</label>
                            <PasswordInput
                                placeholder="Min 6 characters"
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className={css.inpBox}
                            />
                        </div>
                        <div className={css.inputGroup}>
                            <label className={css.label}>Confirm New Password</label>
                            <PasswordInput
                                placeholder="Repeat password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={css.inpBox}
                            />
                        </div>
                        <button className={css.btn} disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className={css.backToLogin} onClick={() => setAuth({ closed: false, login: true, signup: false })}>
                    Back to Login
                </div>
            </div>
        </div>
    );

    return createPortal(domContent, document.getElementById('modal'));
};

export default ForgotPass;
