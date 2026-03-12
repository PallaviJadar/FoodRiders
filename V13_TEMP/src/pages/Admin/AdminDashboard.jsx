import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import css from './AdminDashboard.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
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
  // Fetch initial data
  useEffect(() => {
    fetchStore();
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDashboardStats(data);
    } catch (err) { }
  };

  const fetchStore = async () => {
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setIsStoreOpen(data.isOpen);
    } catch (e) { }
  };

  const handleResetStats = async () => {
    if (!window.confirm('Are you sure? This will reset the visible dashboard statistics to start from today. Historic data remains in database but will be hidden from these counters.')) return;

    setResetLoading(true);
    const token = localStorage.getItem('adminToken');
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
    { title: 'Total Revenue', value: dashboardStats.totalRevenue, trend: 'Net Profit', icon: '💰', color: '#ff4757' },
    { title: 'Active Orders', value: dashboardStats.activeOrders, trend: 'In Progress', icon: '⚡', color: '#2ed573' },
    { title: 'Completed', value: dashboardStats.completedOrders, trend: 'Successful', icon: '✅', color: '#1e90ff' },
    { title: 'Avg. Rating', value: dashboardStats.avgRating, trend: 'Stable', icon: '⭐', color: '#ffa502' },
  ];

  const communityCards = [
    { label: 'USERS TODAY', value: dashboardStats.community?.usersToday || 0, icon: '👥' },
    { label: 'LAST 7 DAYS', value: dashboardStats.community?.last7Days || 0, icon: '🗓️' },
    { label: 'THIS MONTH', value: dashboardStats.community?.thisMonth || 0, icon: '📅' },
    { label: 'THIS YEAR', value: dashboardStats.community?.thisYear || 0, icon: '📈' },
    { label: 'TOTAL USERS', value: dashboardStats.community?.totalUsers || 0, icon: '🌟' }
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
              <div className={css.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
              <div className={css.statContent}>
                <div className={css.statTitle}>{stat.title}</div>
                <div className={css.statValue}>{stat.value}</div>
                <div className={css.statTrend}>{stat.trend}</div>
              </div>
            </motion.div>
          ))}
        </div>

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
