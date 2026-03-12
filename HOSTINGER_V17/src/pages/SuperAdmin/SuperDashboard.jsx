import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag,
    Calendar, Download, ArrowUpRight, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import AdminLayout from '../Admin/AdminLayout';
import css from './SuperDashboard.module.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SuperDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('month');

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Warning, 2: Type RESET, 3: Password
    const [confirmText, setConfirmText] = useState('');
    const [password, setPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/super/dashboard-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error('Stats fetch error:', err);
            setLoading(false);
        }
    };

    const handleExport = () => {
        const token = localStorage.getItem('adminToken');
        window.open(`/api/super/export-report?token=${token}`, '_blank');
    };

    const handleReset = async () => {
        if (confirmText !== 'RESET') return alert('Please type RESET exactly');
        if (!password) return alert('Password is required');

        setResetLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/super/reset-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    confirmationText: confirmText,
                    superAdminPassword: password
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.msg);
                setShowResetModal(false);
                setResetStep(1);
                setConfirmText('');
                setPassword('');
                fetchStats();
            } else {
                alert(data.msg || 'Reset failed');
            }
        } catch (err) {
            alert('Reset operation failed due to network error');
        } finally {
            setResetLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className={css.loaderContainer}>
                    <div className={css.skeletonTitle}></div>
                    <div className={css.skeletonGrid}>
                        {[1, 2, 3, 4].map(i => <div key={i} className={css.skeletonCard}></div>)}
                    </div>
                    <div className={css.skeletonChart}></div>
                </div>
            </AdminLayout>
        );
    }

    const summary = stats?.summary || {};

    return (
        <AdminLayout>
            <div className={css.pageContainer}>
                {/* Header Section */}
                <div className={css.header}>
                    <div className={css.titleArea}>
                        <h1>Super Admin Analytics</h1>
                        <p>Platform ownership & revenue tracking control center.</p>
                    </div>
                    <div className={css.actions}>
                        <button onClick={() => setShowResetModal(true)} className={css.resetBtn}>
                            ⚠️ Reset Orders & Revenue
                        </button>
                        <button onClick={handleExport} className={css.exportBtn}>
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Reset Confirmation Modal */}
                {showResetModal && (
                    <div className={css.modalOverlay}>
                        <div className={css.modal}>
                            <h3>⚠️ Platform Data Reset</h3>
                            <div className={css.warningBox}>
                                This will permanently delete all order data and revenue history.
                                Users, Restaurants, and Settings will not be affected.
                                <strong> THIS ACTION CANNOT BE UNDONE.</strong>
                            </div>

                            {resetStep === 1 && (
                                <>
                                    <p>Are you sure you want to proceed with a platform reset?</p>
                                    <div className={css.modalActions}>
                                        <button className={css.cancelBtn} onClick={() => setShowResetModal(false)}>Cancel</button>
                                        <button className={css.confirmBtn} onClick={() => setResetStep(2)}>Next Step</button>
                                    </div>
                                </>
                            )}

                            {resetStep === 2 && (
                                <>
                                    <div className={css.inputGroup}>
                                        <label>Type <strong>RESET</strong> to confirm intent:</label>
                                        <input
                                            type="text"
                                            placeholder="RESET"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                        />
                                    </div>
                                    <div className={css.modalActions}>
                                        <button className={css.cancelBtn} onClick={() => setResetStep(1)}>Back</button>
                                        <button
                                            className={css.confirmBtn}
                                            disabled={confirmText !== 'RESET'}
                                            onClick={() => setResetStep(3)}
                                        >
                                            Verify Identity
                                        </button>
                                    </div>
                                </>
                            )}

                            {resetStep === 3 && (
                                <>
                                    <div className={css.inputGroup}>
                                        <label>Enter Super Admin Password:</label>
                                        <input
                                            type="password"
                                            placeholder="Admin Password / PIN"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className={css.modalActions}>
                                        <button className={css.cancelBtn} onClick={() => setResetStep(2)} disabled={resetLoading}>Back</button>
                                        <button
                                            className={css.confirmBtn}
                                            disabled={!password || resetLoading}
                                            onClick={handleReset}
                                        >
                                            {resetLoading ? 'Processing Reset...' : 'CONFIRM TOTAL RESET'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}


                {/* Main Stats Grid */}
                <div className={css.statsGrid}>
                    <div className={css.statCard}>
                        <div className={css.cardIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <DollarSign size={24} />
                        </div>
                        <div className={css.cardInfo}>
                            <span className={css.label}>Today Revenue</span>
                            <div className={css.valueRow}>
                                <h2>₹{summary.todayRevenue?.toLocaleString()}</h2>
                                <span className={summary.growth >= 0 ? css.growthUp : css.growthDown}>
                                    {summary.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {Math.abs(summary.growth)}%
                                </span>
                            </div>
                        </div>
                        <div className={css.cardGlow}></div>
                    </div>

                    <div className={css.statCard}>
                        <div className={css.cardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Calendar size={24} />
                        </div>
                        <div className={css.cardInfo}>
                            <span className={css.label}>This Month</span>
                            <h2>₹{summary.monthlyRevenue?.toLocaleString()}</h2>
                        </div>
                        <div className={css.cardGlow}></div>
                    </div>

                    <div className={css.statCard}>
                        <div className={css.cardIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <BarChart3 size={24} />
                        </div>
                        <div className={css.cardInfo}>
                            <span className={css.label}>Lifetime Revenue</span>
                            <h2>₹{summary.totalRevenue?.toLocaleString()}</h2>
                        </div>
                        <div className={css.cardGlow}></div>
                    </div>

                    <div className={css.statCard}>
                        <div className={css.cardIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            <ShoppingBag size={24} />
                        </div>
                        <div className={css.cardInfo}>
                            <span className={css.label}>Total Orders</span>
                            <h2>{summary.totalOrders?.toLocaleString()}</h2>
                        </div>
                        <div className={css.cardGlow}></div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className={css.chartsContainer}>
                    <div className={css.chartBox}>
                        <div className={css.chartHeader}>
                            <h3><ArrowUpRight size={18} /> Weekly Platform Revenue</h3>
                        </div>
                        <div className={css.chartWrapper}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats?.weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={css.chartBox}>
                        <div className={css.chartHeader}>
                            <h3><BarChart3 size={18} /> Monthly Revenue Growth</h3>
                        </div>
                        <div className={css.chartWrapper}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats?.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={css.chartBox}>
                        <div className={css.chartHeader}>
                            <h3><PieIcon size={18} /> Payment Methods Distribution</h3>
                        </div>
                        <div className={css.chartWrapper}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={stats?.paymentStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats?.paymentStats?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={css.insightsBox}>
                        <h3>Insights & Metrics</h3>
                        <div className={css.insightItems}>
                            <div className={css.insightItem}>
                                <span>Platform Fee / Order</span>
                                <strong>₹{summary.platformFee}</strong>
                            </div>
                            <div className={css.insightItem}>
                                <span>Avg Orders / Day</span>
                                <strong>{Math.round(summary.totalOrders / 30)}</strong>
                            </div>
                            <div className={css.insightItem}>
                                <span>Projected Next Month</span>
                                <strong style={{ color: '#10b981' }}>₹{(summary.monthlyRevenue * 1.1).toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SuperDashboard;
