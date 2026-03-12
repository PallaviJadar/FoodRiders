import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import css from './AdminDashboard.module.css';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';

// Try adminToken first (set by AdminLogin), then fallback to generic token
const getAdminToken = () =>
    localStorage.getItem('adminToken') ||
    localStorage.getItem('token') ||
    null;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [showUserStats, setShowUserStats] = useState(false);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: '₹0',
    activeOrders: '0',
    completedOrders: '0',
    avgRating: '4.8',
    community: {
      usersToday: 0,
      last7Days: 0,
      thisMonth: 0,
      thisYear: 0,
      totalUsers: 0
    }
  });
  const [resetLoading, setResetLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    const token = getAdminToken();
    if (!token) { navigate('/admin/login'); return; }
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        // Token expired or wrong server — redirect to login
        console.warn('[Dashboard] Token invalid, redirecting to login');
        navigate('/admin/login');
        return;
      }
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('[Dashboard] Fetch stats error:', err);
    }
  }, [navigate]);

  const fetchSiteSettings = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/site-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShowUserStats(data.showUserStats ?? false);
      }
    } catch (err) {
      console.error('[Dashboard] Fetch site settings error:', err);
    }
  }, []);

  const handleToggleUserStats = async () => {
    const token = getAdminToken();
    const newVal = !showUserStats;
    setUserStatsLoading(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ showUserStats: newVal })
      });
      if (res.ok) {
        setShowUserStats(newVal);
      } else {
        alert('Failed to update setting');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setUserStatsLoading(false);
    }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setIsStoreOpen(data.isOpen);
    } catch (e) {
      console.error('[Dashboard] Fetch store status error:', e);
    }
  };

  useEffect(() => {
    fetchStore();
    fetchStats();
    fetchSiteSettings();

    // Fallback polling every 30s
    const interval = setInterval(fetchStats, 30000);

    if (socket) {
      // Join admin room to receive targeted events
      socket.emit('joinAdmin');
      socket.emit('join-admin-room');

      socket.on('connect', () => {
        socket.emit('joinAdmin');
        socket.emit('join-admin-room');
        fetchStats();
      });

      // ✅ All these events trigger an instant stats refresh
      const onDashboardUpdate = () => fetchStats();
      socket.on('dashboard_update', onDashboardUpdate);   // From order creation
      socket.on('new_order', onDashboardUpdate);           // User spec event name
      socket.on('newOrder', onDashboardUpdate);            // Existing emitter
      socket.on('new-order', onDashboardUpdate);           // Alias
      socket.on('adminOrderUpdate', onDashboardUpdate);
      socket.on('orderUpdated', onDashboardUpdate);

      // Store status live update
      socket.on('storeStatusUpdate', (status) => setIsStoreOpen(status.isOpen));

      // Another admin session changed site settings
      socket.on('site_settings_updated', (data) => {
        if (typeof data.showUserStats !== 'undefined') setShowUserStats(data.showUserStats);
      });

      return () => {
        clearInterval(interval);
        socket.off('dashboard_update', onDashboardUpdate);
        socket.off('new_order', onDashboardUpdate);
        socket.off('newOrder', onDashboardUpdate);
        socket.off('new-order', onDashboardUpdate);
        socket.off('adminOrderUpdate', onDashboardUpdate);
        socket.off('orderUpdated', onDashboardUpdate);
        socket.off('storeStatusUpdate');
        socket.off('site_settings_updated');
      };
    }

    return () => clearInterval(interval);
  }, [socket, fetchStats, fetchSiteSettings]);

  const handleResetStats = async () => {
    if (!window.confirm('Are you sure? This will reset the visible dashboard statistics to start from today. Historic data remains in database but will be hidden from these counters.')) return;
    setResetLoading(true);
    const token = getAdminToken();
    try {
      const res = await fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Stats reset successfully!');
        fetchStats();
      } else {
        alert('Failed to reset stats');
      }
    } catch (err) {
      alert('Connection error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleStore = async () => {
    const newState = !isStoreOpen;
    setIsStoreOpen(newState);
    try {
      await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newState })
      });
    } catch (err) {
      alert('Failed to update store status');
      setIsStoreOpen(!newState);
    }
  };

  const coreStats = [
    { title: 'Total Revenue', value: stats.totalRevenue, trend: 'Net Profit', icon: '💰', color: '#ff4757' },
    { title: 'Active Orders', value: stats.activeOrders, trend: 'In Progress', icon: '⚡', color: '#2ed573' },
    { title: 'Completed', value: stats.completedOrders, trend: 'Successful', icon: '✅', color: '#1e90ff' },
    { title: 'Avg. Rating', value: stats.avgRating, trend: 'Stable', icon: '⭐', color: '#ffa502' },
  ];

  const communityCards = [
    { label: 'USERS TODAY', value: stats.community?.usersToday || 0, icon: '👥' },
    { label: 'LAST 7 DAYS', value: stats.community?.last7Days || 0, icon: '🗓️' },
    { label: 'THIS MONTH', value: stats.community?.thisMonth || 0, icon: '📅' },
    { label: 'THIS YEAR', value: stats.community?.thisYear || 0, icon: '📈' },
    { label: 'TOTAL USERS', value: stats.community?.totalUsers || 0, icon: '🌟' }
  ];

  return (
    <AdminLayout>
      <div className={css.dashboardWrapper}>
        <motion.div
          className={css.headerRow}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <section className={css.welcomeSection}>
            <div className={css.greetingWrapper}>
              <h2>Good morning, Admin</h2>
              <span className={css.liveTag}>LIVE MONITOR</span>
            </div>
            <p>Real-time analytics & platform performance for FoodRiders.</p>
            <div className={css.headerActions}>
              <button
                className={css.resetBtn}
                onClick={handleResetStats}
                disabled={resetLoading}
              >
                {resetLoading ? 'Resetting...' : '🔄 Reset Dashboard Stats'}
              </button>
            </div>
          </section>

          <div className={css.controlPanel}>
            <div className={css.storeInfo}>
              <span className={css.statusLabel}>Store Status</span>
              <span className={isStoreOpen ? css.openLabel : css.closedLabel}>
                {isStoreOpen ? 'OPENING FOR BUSINESS' : 'CLOSED FOR ORDERS'}
              </span>
            </div>
            <label className={css.switch}>
              <input type="checkbox" checked={isStoreOpen} onChange={handleToggleStore} />
              <span className={css.slider}></span>
            </label>
          </div>
        </motion.div>

        <div className={css.statsGrid}>
          {coreStats.map((stat, index) => (
            <motion.div
              key={index}
              className={css.statCard}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={css.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
              <div className={css.statContent}>
                <div className={css.statTitle}>{stat.title}</div>
                <div className={css.statValue}>{stat.value}</div>
                <div className={css.statTrend}>{stat.trend}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Admin ALWAYS sees community stats */}
        <section className={css.communitySection}>
          <div className={css.communityHeader}>
            <h2>Our Community</h2>
            <p>Live activity on FoodRiders platform</p>
          </div>
          <div className={css.communityGrid}>
            {communityCards.map((card, idx) => (
              <motion.div
                key={idx}
                className={css.communityCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
              >
                <div className={css.commIcon}>{card.icon}</div>
                <div className={css.commValue}>{card.value}</div>
                <div className={css.commLabel}>{card.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ✅ User Stats Visibility Toggle Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            background: 'var(--card-bg, #111827)',
            border: '1.5px solid var(--border-subtle, #1f2937)',
            borderRadius: '16px',
            padding: '1.4rem 2rem',
            margin: '0.5rem 0 1.5rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              📊 User Stats on Customer Page
            </h3>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.84rem' }}>
              {showUserStats
                ? '✅ Customers can currently see community stats & user growth charts'
                : '🔒 Community stats are hidden from customers (admin-only view)'}
            </p>
          </div>
          <label className={css.switch} title="Toggle User Stats Visibility for Customers">
            <input
              type="checkbox"
              checked={showUserStats}
              onChange={handleToggleUserStats}
              disabled={userStatsLoading}
            />
            <span className={css.slider}></span>
          </label>
        </motion.div>

        <section className={css.actionSection}>
          <div className={css.managementHeader}>
            <h3>Platform Management</h3>
            <p>Quick access to operational tools</p>
          </div>
          <div className={css.btnGroup}>
            <button className={css.btnPrimary} onClick={() => navigate('/admin/orders')}>
              <span className={css.btnIcon}>⚡</span> Live Order Monitor
            </button>
            <button className={css.btnSecondary} onClick={() => navigate('/admin/billing-settings')}>
              <span className={css.btnIcon}>💸</span> Billing & Fees
            </button>
            <button className={css.btnSecondary} onClick={() => navigate('/admin/orders/history')}>
              <span className={css.btnIcon}>📜</span> Order History
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
