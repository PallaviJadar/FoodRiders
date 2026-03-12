import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import css from './AdminLogin.module.css';

import PasswordInput from '../../utils/FormUtils/PasswordInput.jsx';
import { requestFCMToken } from '../../firebase';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

const AdminLogin = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isMobile = /^\d{10}$/.test(loginId);
    const payload = isMobile
      ? { mobile: loginId, pin: password }
      : { username: loginId, password: password };

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const userRole = data.role || data.user?.role || 'admin';
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminRole', userRole);
        // Synchronize with main AuthContext
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user', JSON.stringify({
          id: data.user?.id || 'admin',
          fullName: data.user?.fullName || 'Admin',
          role: userRole
        }));

        if (userRole === 'super_admin') {
          navigate('/super/dashboard');
        } else {
          navigate('/admin/dashboard');
        }

        // Request FCM token after login
        setTimeout(() => {
          requestFCMToken().catch(err => console.warn('FCM token request failed:', err));
        }, 1500);
      } else {
        setError(data.msg || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={css.loginWrapper}>
      <div className={css.loginCard}>
        <h2>Welcome Back</h2>
        <p className={css.subtitle}>Admin Command Center</p>

        <form onSubmit={handleSubmit}>
          <div className={css.inputGroup}>
            <label className={css.inputLabel}>Username or Mobile</label>
            <input
              className={css.inputField}
              type="text"
              placeholder="admin or 9876543210"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              required
            />
          </div>

          <div className={css.inputGroup}>
            <label className={css.inputLabel}>Password / PIN</label>
            <PasswordInput
              className={css.inputField}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={css.loginBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {error && <div className={css.error}>✕ {error}</div>}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
