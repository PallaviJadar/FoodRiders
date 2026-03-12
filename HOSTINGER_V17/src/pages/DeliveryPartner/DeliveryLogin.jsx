import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import css from './DeliveryLogin.module.css';
import PasswordInput from '../../utils/FormUtils/PasswordInput.jsx';

const DeliveryLogin = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('deliveryToken');
        if (token) navigate('/delivery-dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/delivery/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('deliveryToken', data.token);
                localStorage.setItem('deliveryUser', JSON.stringify(data.user));

                // Silently register FCM token for push notifications (no UI change)
                const { requestFCMToken } = await import('../../firebase');
                setTimeout(() => {
                    requestFCMToken().catch(err => console.warn('FCM setup skipped:', err.message));
                }, 1500);

                navigate('/delivery-dashboard');
            } else {
                setError(data.msg || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={css.loginContainer}>
            <div className={css.loginBox}>
                <div className={css.logo}>FOODRIDERS</div>
                <h1>Logistics Portal</h1>
                <p>Welcome back, Delivery Partner</p>

                {error && <div className={css.errorBox}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className={css.inputGroup}>
                        <label>Mobile Number</label>
                        <input
                            type="tel"
                            placeholder="Enter registered mobile"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className={css.input}
                            required
                        />
                    </div>
                    <div className={css.inputGroup}>
                        <label>4-Digit PIN</label>
                        <PasswordInput
                            placeholder="Enter 4-digit PIN"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={css.input}
                            required
                        />
                    </div>
                    <button type="submit" className={css.loginBtn} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                    <div className={css.helpText}>
                        Contact Support if you forgot your credentials
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryLogin;
