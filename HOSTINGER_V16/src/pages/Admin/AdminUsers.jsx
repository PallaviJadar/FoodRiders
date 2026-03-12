import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminUsers.module.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    const [resetModal, setResetModal] = useState({ isOpen: false, userId: null, mobile: null, newPassword: '' });
    const [revealModal, setRevealModal] = useState({ isOpen: false, userId: null, password: null });

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(fetchUsers, 10000); // 10s is plenty
        return () => clearInterval(interval);
    }, []);

    const fetchUsers = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setUsers(data);
            } else {
                setError(data.msg || 'Data format error');
                setUsers([]);
            }
            setLoading(false);
        } catch (err) {
            setError('Connection error');
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });
            if (res.ok) {
                await fetchUsers();
            } else {
                alert('Approval failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleBlock = async (userId, currentlyBlocked) => {
        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/toggle-block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, isBlocked: !currentlyBlocked })
            });
            if (res.ok) {
                await fetchUsers();
            } else {
                alert('Action failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetModal.newPassword) return alert('Enter a new password');
        if (!window.confirm(`Are you sure you want to reset password for this user?`)) return;

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: resetModal.userId, newPassword: resetModal.newPassword })
            });
            if (res.ok) {
                alert('Password reset successfully');
                setResetModal({ isOpen: false, userId: null, mobile: null, newPassword: '' });
                await fetchUsers();
            } else {
                alert('Reset failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPin = async () => {
        if (!resetModal.newPassword) return alert('Enter a new PIN');
        if (!/^\d{4}$/.test(resetModal.newPassword)) return alert('PIN must be exactly 4 digits');

        if (!window.confirm(`Are you sure you want to reset PIN for this user?`)) return;

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            // Using updated endpoint
            const res = await fetch('/api/admin/reset-user-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // API expects { mobile, newPin } but here we have userId. 
                // Wait, my backend implementation of reset-user-pin expects MOBILE.
                // The table has mobile? Yes. 
                // But I only have userId in resetModal state.
                // I need to find the user's mobile or update the API to accept userId.
                // It's safer to update API to accept userId OR pass mobile to modal.
                // Let's pass mobile to modal state.
                body: JSON.stringify({ mobile: resetModal.mobile, newPin: resetModal.newPassword })
            });
            if (res.ok) {
                alert('PIN reset successfully');
                setResetModal({ isOpen: false, userId: null, mobile: null, newPassword: '' });
                await fetchUsers();
            } else {
                const d = await res.json();
                alert(d.msg || 'Reset failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevealPassword = async (userId) => {
        if (!window.confirm("⚠️ Security Alert: This will reveal and log the user's password. Continue?")) return;

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/reveal-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (res.ok) {
                setRevealModal({ isOpen: true, userId, password: data.password });
                // Auto-close after 10s
                setTimeout(() => {
                    setRevealModal(prev => prev.userId === userId ? { ...prev, isOpen: false, password: null } : prev);
                }, 10000);
            } else {
                alert(data.msg || 'Unable to retrieve password. Encryption might be missing for this user.');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetStats = async (userId) => {
        if (!window.confirm("⚠️ This will RESET user's Wallet to 0 and unlock their account. Continue?")) return;

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/reset-user-stats', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.msg);
                await fetchUsers();
            } else {
                alert(data.msg || 'Reset failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatus = (user) => {
        if (user.isBlocked) return { label: 'Blocked', class: css.blockedStatus };
        if (user.isApproved) return { label: 'Active', class: css.activeStatus };
        return { label: 'Pending', class: css.pendingStatus };
    };

    if (loading) return <AdminLayout><div className={css.loader}>Loading users...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className={css.usersWrapper}>
                <div className={css.headerArea}>
                    <h2>Customer Database</h2>
                    <div className={css.liveIndicator}>
                        <span className={css.dot}></span>
                        Monitoring New Registrations
                    </div>
                </div>

                {error && <div className={css.errorBanner}>{error}</div>}

                <div className={css.tableContainer}>
                    <table className={css.userTable}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Mobile Number</th>
                                <th>Signup Date</th>
                                <th>Wallet (₹)</th>
                                <th>Referred By</th>
                                <th>Current Status</th>
                                <th>Management Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan="7" className={css.noData}>No customers registered yet.</td></tr>
                            ) : (
                                users.map(user => {
                                    const status = getStatus(user);
                                    return (
                                        <tr key={user._id}>
                                            <td className={css.userName} data-label="Name">{user.fullName}</td>
                                            <td className={css.userMobile} data-label="Mobile Number">{user.mobile}</td>
                                            <td className={css.userDate} data-label="Signup Date">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className={css.userWallet} data-label="Wallet (₹)">₹{user.walletBalance || 0}</td>
                                            <td className={css.userReferral} data-label="Referred By">{user.referredBy || '-'}</td>
                                            <td data-label="Status">
                                                <span className={`${css.statusBadge} ${status.class}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className={css.actionCell} data-label="Actions">
                                                {!user.isApproved && !user.isBlocked && (
                                                    <button
                                                        className={css.approveBtn}
                                                        onClick={() => handleApprove(user._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        Approve
                                                    </button>
                                                )}

                                                <button
                                                    className={css.resetBtn}
                                                    onClick={() => handleRevealPassword(user._id)}
                                                    disabled={actionLoading}
                                                    title="View Password"
                                                >
                                                    👁️
                                                </button>

                                                <button
                                                    className={css.resetBtn}
                                                    onClick={() => setResetModal({ isOpen: true, userId: user._id, mobile: user.mobile, newPassword: '' })}
                                                    disabled={actionLoading}
                                                >
                                                    Reset PIN
                                                </button>
                                                <button
                                                    className={css.resetBtn}
                                                    style={{ border: '2px solid #FF9800', color: '#FF9800' }}
                                                    onClick={() => handleResetStats(user._id)}
                                                    disabled={actionLoading}
                                                    title="Reset Wallet & Login Attempts"
                                                >
                                                    Reset Stats
                                                </button>
                                                <button
                                                    className={user.isBlocked ? css.unblockBtn : css.blockBtn}
                                                    onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                                                    disabled={actionLoading}
                                                >
                                                    {user.isBlocked ? 'Unlock' : 'Block'}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {revealModal.isOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent} style={{ textAlign: 'center' }}>
                        <h3>User Password</h3>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            background: '#f0f0f0',
                            padding: '1rem',
                            borderRadius: '8px',
                            margin: '1rem 0',
                            userSelect: 'none',
                            letterSpacing: '2px'
                        }}>
                            {revealModal.password}
                        </div>
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>⚠️ This window will verify closes in 10 seconds.</p>
                        <button className={css.confirmBtn} onClick={() => setRevealModal({ isOpen: false, userId: null, password: null })}>
                            Close Securely
                        </button>
                    </div>
                </div>
            )}

            {resetModal.isOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent}>
                        <h3>Reset User PIN</h3>
                        <p>Set a new 4-digit PIN for the user.</p>
                        <input
                            type="text"
                            placeholder="Enter 4-digit PIN"
                            className={css.modalInput}
                            value={resetModal.newPassword}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 4) setResetModal({ ...resetModal, newPassword: val });
                            }}
                            maxLength="4"
                        />
                        <div className={css.modalActions}>
                            <button className={css.cancelBtn} onClick={() => setResetModal({ isOpen: false, userId: null, mobile: null, newPassword: '' })}>Cancel</button>
                            <button className={css.confirmBtn} onClick={handleResetPin}>Set PIN</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};
export default AdminUsers;
