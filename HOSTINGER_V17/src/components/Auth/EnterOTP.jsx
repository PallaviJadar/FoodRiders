import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

import css from './EnterOTP.module.css';

const EnterOTP = ({ setModal, mobile, setLoggedIn = () => { }, setAuth = () => { } }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [count, setCount] = useState(60);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onOtpChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        // Auto focus next
        if (val && e.target.nextSibling) {
            e.target.nextSibling.focus();
        }
    };

    const loginHandler = async () => {
        setError('');
        const otpCode = otp.join('');
        if (otpCode.length < 4) return setError('Enter 4-digit OTP');

        setLoading(true);
        try {
            const res = await axios.post('/api/auth/verify-otp', {
                mobile,
                otp: otpCode
            });

            // Save auth state
            localStorage.setItem("auth", "true");
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            setLoggedIn(true);
            setAuth({ closed: true, login: false, signup: false });
            if (setModal) setModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!count) return;
        let interval = setInterval(() => {
            setCount(val => val - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [count]);

    const resendOTP = async () => {
        setCount(60);
        setError('');
        try {
            // Re-use signup or a dedicated resend endpoint
            await axios.post('/api/auth/forgot-password', { mobile });
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

    const domObj = (
        <div className={css.outerDiv}>
            <div className={css.innerDiv}>
                <div className={css.header}>
                    <div className={css.title}>Verify Mobile</div>
                    <span className={css.closeBtn} onClick={() => setModal(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                </div>
                <div className={css.body}>
                    <div className={css.txt1}>OTP has been sent to <b>+91 {mobile}</b></div>
                    <div className={css.OTPBox}>
                        {otp.map((data, index) => (
                            <div className={css.otpNumBox} key={index}>
                                <input
                                    className={css.inpBox}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={e => onOtpChange(e, index)}
                                    autoFocus={index === 0}
                                />
                            </div>
                        ))}
                    </div>

                    {error && <div className={css.errorMsg}>{error}</div>}

                    <div onClick={!loading ? loginHandler : null} className={loading ? [css.okBtn, css.disabled].join(' ') : css.okBtn}>
                        {loading ? 'Verifying...' : 'Verify & Proceed'}
                    </div>

                    <div className={css.footerBox}>
                        <div className={css.time}>Resend OTP in <b>0:{count < 10 ? `0${count}` : count}</b></div>
                        {count === 0 && (
                            <div className={css.footerTxt}>
                                Didn't receive OTP? <span className={css.resendTxt} onClick={resendOTP}>Resend Now</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(domObj, document.getElementById('modal'));
};

export default EnterOTP;
