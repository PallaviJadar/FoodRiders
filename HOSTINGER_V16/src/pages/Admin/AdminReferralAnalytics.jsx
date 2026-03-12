
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminReferralAnalytics.css';

const AdminReferralAnalytics = ({ isHub }) => {
    const [data, setData] = useState({
        metrics: {
            totalCodesGenerated: 0,
            totalAttempts: 0,
            successfulReferrals: 0,
            failedReferrals: 0,
            totalWalletCredit: 0
        },
        topReferrers: [],
        referralRecords: []
    });
    const [filter, setFilter] = useState('month'); // today, week, month, custom
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [filter, dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const params = { filter };
            if (filter === 'custom' && dateRange.startDate && dateRange.endDate) {
                params.startDate = dateRange.startDate;
                params.endDate = dateRange.endDate;
            }

            const response = await axios.get('/api/analytics/referrals', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching referral analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        if (newFilter !== 'custom') {
            setDateRange({ startDate: '', endDate: '' });
        }
    };

    const PageContent = (
        <div className="referral-analytics-page">
            {!isHub && <h1>Referral Analytics</h1>}

            <div className="filters-bar">
                <div className="filter-group">
                    <button
                        className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('week')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('month')}
                    >
                        This Month
                    </button>
                    <button
                        className={`filter-btn ${filter === 'custom' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('custom')}
                    >
                        Custom Range
                    </button>
                </div>

                {filter === 'custom' && (
                    <div className="date-inputs">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                )}
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{data.metrics.totalCodesGenerated}</div>
                    <div className="stat-label">Codes Generated</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{data.metrics.totalAttempts}</div>
                    <div className="stat-label">Total Attempts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{data.metrics.successfulReferrals}</div>
                    <div className="stat-label">Successful</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{data.metrics.failedReferrals}</div>
                    <div className="stat-label">Failed / Invalid</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">₹{data.metrics.totalWalletCredit}</div>
                    <div className="stat-label">Wallet Credit Given</div>
                </div>
            </div>

            <div className="analytics-content">
                <div className="records-section">
                    <h2>Recent Referral Records</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Referrer</th>
                                    <th>Referred User</th>
                                    <th>Order ID</th>
                                    <th>Reward</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.referralRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No records found</td>
                                    </tr>
                                ) : (
                                    data.referralRecords.map((ref, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <strong>{ref.referrerName}</strong>
                                                <div>{ref.referrerMobile}</div>
                                            </td>
                                            <td>
                                                <strong>{ref.referredName}</strong>
                                                <div>{ref.referredMobile}</div>
                                            </td>
                                            <td>{ref.orderNumber || 'N/A'}</td>
                                            <td>₹{ref.rewardAmount}</td>
                                            <td>
                                                <span className={`status-badge ${ref.status.toLowerCase()}`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td>{new Date(ref.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="top-referrers-section">
                    <h2>Top 5 Referrers</h2>
                    <div className="top-referrers-list">
                        {data.topReferrers.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>No data available</p>
                        ) : (
                            data.topReferrers.map((referrer, idx) => (
                                <div key={idx} className="referrer-item">
                                    <div className="referrer-info">
                                        <span className="name">{referrer.fullName}</span>
                                        <span className="mobile">{referrer.mobile}</span>
                                    </div>
                                    <div className="referrer-stats">
                                        <div className="count">{referrer.totalReferrals} referrals</div>
                                        <div className="amount">₹{referrer.totalReward} earned</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return isHub ? PageContent : <AdminLayout>{PageContent}</AdminLayout>;
};

export default AdminReferralAnalytics;
