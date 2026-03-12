import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminUsers.module.css'; // Reusing table styles
import PasswordInput from '../../utils/FormUtils/PasswordInput.jsx';

const AdminDeliveryPartners = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', mobile: '', pin: '' });
    const [saving, setSaving] = useState(false);
    const [revealModal, setRevealModal] = useState({ isOpen: false, userId: null, password: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [manageDropdown, setManageDropdown] = useState(null); // Track which partner's menu is open
    const [editModal, setEditModal] = useState({ isOpen: false, partner: null });
    const [resetPinModal, setResetPinModal] = useState({ isOpen: false, partnerId: null, newPin: '' });

    useEffect(() => {
        fetchPartners();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (manageDropdown && !e.target.closest('[data-dropdown]')) {
                setManageDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [manageDropdown]);

    const fetchPartners = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/admin/delivery-partners', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setPartners(data);
            } else {
                console.error('Expected array of partners, got:', data);
                setPartners([]);
            }
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!/^\d{4}$/.test(formData.pin)) {
            alert('PIN must be exactly 4 digits');
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch('/api/admin/delivery-partner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowAddForm(false);
                setFormData({ fullName: '', mobile: '', pin: '' });
                fetchPartners();
            } else {
                const data = await res.json();
                alert(data.msg || 'Creation failed');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setSaving(false);
        }
    };

    const handleRevealPassword = async (userId) => {
        if (!window.confirm("⚠️ Security Alert: This will reveal and log the partner's password. Continue?")) return;

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
                setTimeout(() => {
                    setRevealModal(prev => prev.userId === userId ? { ...prev, isOpen: false, password: null } : prev);
                }, 10000);
            } else {
                alert(data.msg || 'Unable to retrieve password.');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeletePartner = async (partnerId, partnerName) => {
        if (!window.confirm(`⚠️ Are you sure you want to DELETE ${partnerName}? This action cannot be undone!`)) return;

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/delivery-partner/${partnerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('✅ Partner deleted successfully');
                fetchPartners();
            } else {
                const data = await res.json();
                alert(data.msg || 'Failed to delete partner');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
            setManageDropdown(null);
        }
    };

    const handleToggleStatus = async (partnerId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/delivery-partner/${partnerId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                alert(`✅ Partner status updated to ${newStatus}`);
                fetchPartners();
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
            setManageDropdown(null);
        }
    };

    const handleResetPin = async () => {
        if (!/^\d{4}$/.test(resetPinModal.newPin)) {
            alert('PIN must be exactly 4 digits');
            return;
        }

        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/delivery-partner/${resetPinModal.partnerId}/reset-pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPin: resetPinModal.newPin })
            });
            if (res.ok) {
                alert('✅ PIN reset successfully');
                setResetPinModal({ isOpen: false, partnerId: null, newPin: '' });
                fetchPartners();
            } else {
                const data = await res.json();
                alert(data.msg || 'Failed to reset PIN');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditPartner = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/delivery-partner/${editModal.partner._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: editModal.partner.fullName,
                    mobile: editModal.partner.mobile
                })
            });
            if (res.ok) {
                alert('✅ Partner details updated');
                setEditModal({ isOpen: false, partner: null });
                fetchPartners();
            } else {
                const data = await res.json();
                alert(data.msg || 'Failed to update partner');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className={css.usersWrapper}>
                <div className={css.headerArea}>
                    <h2>Logistics Fleet Management</h2>
                    <button
                        className={css.addBtn}
                        onClick={() => setShowAddForm(true)}
                    >
                        + Register New Partner
                    </button>
                </div>

                {showAddForm && (
                    <div className={css.formCard} style={{ marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Create Delivery Partner Account</h3>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem' }}>
                            <div className={css.inputGroup}>
                                <label className={css.inputLabel}>Full Name</label>
                                <input
                                    type="text"
                                    className={css.inputField}
                                    placeholder="Enter full name"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={css.inputGroup}>
                                <label className={css.inputLabel}>Mobile Number</label>
                                <input
                                    type="tel"
                                    className={css.inputField}
                                    placeholder="Enter mobile number"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={css.inputGroup}>
                                <label className={css.inputLabel}>Access PIN</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="4"
                                    className={css.inputField}
                                    placeholder="Enter 4-digit PIN"
                                    value={formData.pin}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setFormData({ ...formData, pin: val });
                                    }}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <button type="submit" className={css.approveBtn} disabled={saving} style={{ flex: 1, padding: '1rem' }}>
                                    {saving ? 'Creating...' : 'Register Partner'}
                                </button>
                                <button type="button" onClick={() => setShowAddForm(false)} className={css.blockBtn} style={{ flex: 1, padding: '1rem' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className={css.tableContainer}>
                    <table className={css.userTable}>
                        <thead>
                            <tr>
                                <th>Partner Name</th>
                                <th>Mobile</th>
                                <th>Join Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5">Loading partners...</td></tr> : (
                                partners.map(p => (
                                    <tr key={p._id}>
                                        <td><strong>{p.fullName}</strong></td>
                                        <td>{p.mobile}</td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td><span className={css.activeStatusBadge}>Active</span></td>
                                        <td>
                                            <button
                                                className={css.resetBtn}
                                                onClick={() => handleRevealPassword(p._id)}
                                                disabled={actionLoading}
                                                style={{ marginRight: '0.5rem' }}
                                                title="View PIN"
                                            >
                                                👁️
                                            </button>
                                            <div style={{ display: 'inline-block', position: 'relative' }} data-dropdown>
                                                <button
                                                    className={css.approveBtn}
                                                    onClick={() => setManageDropdown(manageDropdown === p._id ? null : p._id)}
                                                    style={{ padding: '0.5rem 1rem' }}
                                                >
                                                    Manage ▼
                                                </button>
                                                {manageDropdown === p._id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        background: 'white',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                        zIndex: 1000,
                                                        minWidth: '180px',
                                                        marginTop: '0.5rem'
                                                    }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditModal({ isOpen: true, partner: { ...p } });
                                                                setManageDropdown(null);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.75rem 1rem',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f0f0f0'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            ✏️ Edit Details
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setResetPinModal({ isOpen: true, partnerId: p._id, newPin: '' });
                                                                setManageDropdown(null);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.75rem 1rem',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f0f0f0'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            🔑 Reset PIN
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(p._id, p.status || 'active')}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.75rem 1rem',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f0f0f0'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            {(p.status || 'active') === 'active' ? '⏸️ Deactivate' : '▶️ Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePartner(p._id, p.fullName)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.75rem 1rem',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                                color: '#dc3545'
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.background = '#fff5f5'}
                                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                        >
                                                            🗑️ Delete Partner
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {partners.length === 0 && !loading && <tr><td colSpan="5">No delivery partners registered yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {revealModal.isOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent} style={{ textAlign: 'center' }}>
                        <h3>Partner PIN/Password</h3>
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

            {/* Edit Partner Modal */}
            {editModal.isOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent}>
                        <h3>Edit Partner Details</h3>
                        <form onSubmit={handleEditPartner}>
                            <div className={css.inputGroup}>
                                <label className={css.inputLabel}>Full Name</label>
                                <input
                                    type="text"
                                    className={css.inputField}
                                    value={editModal.partner.fullName}
                                    onChange={(e) => setEditModal({
                                        ...editModal,
                                        partner: { ...editModal.partner, fullName: e.target.value }
                                    })}
                                    required
                                />
                            </div>
                            <div className={css.inputGroup}>
                                <label className={css.inputLabel}>Mobile Number</label>
                                <input
                                    type="tel"
                                    className={css.inputField}
                                    value={editModal.partner.mobile}
                                    onChange={(e) => setEditModal({
                                        ...editModal,
                                        partner: { ...editModal.partner, mobile: e.target.value }
                                    })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className={css.confirmBtn} disabled={actionLoading}>
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    className={css.blockBtn}
                                    onClick={() => setEditModal({ isOpen: false, partner: null })}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset PIN Modal */}
            {resetPinModal.isOpen && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent}>
                        <h3>Reset Partner PIN</h3>
                        <div className={css.inputGroup}>
                            <label className={css.inputLabel}>New 4-Digit PIN</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength="4"
                                className={css.inputField}
                                placeholder="Enter new 4-digit PIN"
                                value={resetPinModal.newPin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) setResetPinModal({ ...resetPinModal, newPin: val });
                                }}
                                autoComplete="off"
                                style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className={css.confirmBtn}
                                onClick={handleResetPin}
                                disabled={actionLoading || resetPinModal.newPin.length !== 4}
                            >
                                {actionLoading ? 'Resetting...' : 'Reset PIN'}
                            </button>
                            <button
                                className={css.blockBtn}
                                onClick={() => setResetPinModal({ isOpen: false, partnerId: null, newPin: '' })}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminDeliveryPartners;
