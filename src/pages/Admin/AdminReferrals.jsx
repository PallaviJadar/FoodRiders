
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminReferrals.css';

const AdminReferrals = ({ isHub }) => {
    const [stats, setStats] = useState({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalWalletCredited: 0,
        recentReferrals: []
    });
    const [settings, setSettings] = useState({
        referrerReward: 20,
        newUserReward: 20,
        maxReferralsPerUser: 10,
        isEnabled: true,
        walletExpiryDays: 30
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const [statsRes, settingsRes] = await Promise.all([
                axios.get('/api/referrals/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/referrals/settings')
            ]);

            setStats(statsRes.data.data || {
                totalReferrals: 0,
                completedReferrals: 0,
                pendingReferrals: 0,
                totalWalletCredited: 0,
                recentReferrals: []
            });
            setSettings(settingsRes.data.data || {
                referrerReward: 20,
                newUserReward: 20,
                maxReferralsPerUser: 10,
                isEnabled: true,
                walletExpiryDays: 30
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put('/api/referrals/admin/settings', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return isHub ? (
            <div className="loading">Loading...</div>
        ) : (
            <AdminLayout>
                <div className="loading">Loading...</div>
            </AdminLayout>
        );
    }

    const PageContent = (
        <div className="admin-referrals-page">
            {!isHub && <h1>Referral System Management</h1>}

            <div className="stats-overview">
                <div className="stat-box">
                    <div className="stat-number">{stats.totalReferrals}</div>
                    <div className="stat-label">Total Referrals</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">{stats.completedReferrals}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">{stats.pendingReferrals}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-box">
                    <div className="stat-number">₹{stats.totalWalletCredited}</div>
                    <div className="stat-label">Total Credited</div>
                </div>
            </div>

            <div className="settings-card">
                <h2>Referral Settings</h2>

                <div className="settings-form">
                    <div className="form-group">
                        <label>Referrer Reward (₹)</label>
                        <input
                            type="number"
                            value={settings.referrerReward}
                            onChange={(e) => setSettings({ ...settings, referrerReward: Number(e.target.value) })}
                            min="0"
                        />
                        <small>Amount credited to the person who shares the code</small>
                    </div>

                    <div className="form-group">
                        <label>New User Reward (₹)</label>
                        <input
                            type="number"
                            value={settings.newUserReward}
                            onChange={(e) => setSettings({ ...settings, newUserReward: Number(e.target.value) })}
                            min="0"
                        />
                        <small>Amount credited to the new user</small>
                    </div>

                    <div className="form-group">
                        <label>Max Referrals Per User</label>
                        <input
                            type="number"
                            value={settings.maxReferralsPerUser}
                            onChange={(e) => setSettings({ ...settings, maxReferralsPerUser: Number(e.target.value) })}
                            min="1"
                        />
                        <small>Maximum number of successful referrals per user</small>
                    </div>

                    <div className="form-group">
                        <label>Wallet Reward Expiry (Days)</label>
                        <select
                            value={settings.walletExpiryDays || 30}
                            onChange={(e) => setSettings({ ...settings, walletExpiryDays: Number(e.target.value) })}
                            style={{
                                padding: '0.8rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                marginTop: '0.5rem',
                                display: 'block',
                                width: '100%',
                                background: '#fff'
                            }}
                        >
                            <option value={15}>15 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                        </select>
                        <small>Number of days before referral wallet credit expires</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.isEnabled}
                                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                            />
                            <span>Enable Referral System</span>
                        </label>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="save-btn"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            <div className="recent-referrals">
                <h2>Recent Referrals</h2>
                {stats.recentReferrals.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No referrals yet. Users will appear here when they sign up with a referral code.
                    </p>
                ) : (
                    <div className="referrals-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Referrer</th>
                                    <th>New User</th>
                                    <th>Status</th>
                                    <th>Rewards</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentReferrals.map((ref, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div>{ref.referrer}</div>
                                            <small>{ref.referrerMobile}</small>
                                        </td>
                                        <td>
                                            <div>{ref.newUser}</div>
                                            <small>{ref.newUserMobile}</small>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${ref.status.toLowerCase()}`}>
                                                {ref.status}
                                            </span>
                                        </td>
                                        <td>
                                            {ref.status === 'COMPLETED' && (
                                                <span>₹{ref.referrerReward} + ₹{ref.newUserReward}</span>
                                            )}
                                        </td>
                                        <td>{new Date(ref.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    return isHub ? PageContent : <AdminLayout>{PageContent}</AdminLayout>;
};

export default AdminReferrals;
