import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminExtraCharges.module.css';

const AdminExtraCharges = () => {
    const [systemEnabled, setSystemEnabled] = useState(false);
    const [charges, setCharges] = useState([
        {
            id: 'rain',
            name: 'Rain Charge',
            icon: '🌧️',
            description: 'Applied during rainy weather conditions',
            enabled: false,
            type: 'fixed', // 'fixed' or 'percentage'
            amount: 10,
            applyTo: 'delivery' // 'delivery' or 'all'
        },
        {
            id: 'surge',
            name: 'High Demand Charge',
            icon: '⚡',
            description: 'Applied during peak hours to ensure faster delivery',
            enabled: false,
            type: 'percentage',
            amount: 5,
            applyTo: 'delivery'
        },
        {
            id: 'night',
            name: 'Night Delivery Charge',
            icon: '🌙',
            description: 'Applied for late-hour service',
            enabled: false,
            type: 'fixed',
            amount: 15,
            applyTo: 'delivery',
            timeRange: {
                start: '22:00',
                end: '06:00'
            }
        }
    ]);

    const [editModal, setEditModal] = useState({ isOpen: false, charge: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/extra-charges', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched data:', data);
                if (data.systemEnabled !== undefined) setSystemEnabled(data.systemEnabled);
                if (data.charges) setCharges(data.charges);
            } else {
                const errorText = await res.text();
                console.error('API Error:', res.status, errorText);
                alert(`Failed to load: ${res.status}`);
            }
        } catch (err) {
            console.error('Failed to fetch extra charges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSystemToggle = async (enabled) => {
        if (enabled) {
            if (!window.confirm('⚠️ Enable Extra Charges System?\n\nThis will apply to NEW orders only. Existing orders remain unchanged.')) {
                return;
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/extra-charges/system', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled })
            });

            if (res.ok) {
                setSystemEnabled(enabled);
                alert(`✅ Extra Charges System ${enabled ? 'enabled' : 'disabled'}`);
            } else {
                const data = await res.json();
                alert(`❌ Failed to update system status: ${data.msg || 'Unknown error'}`);
            }
        } catch (err) {
            alert('❌ Connection error: Make sure the backend server is running.');
        } finally {
            setSaving(false);
        }
    };

    const handleChargeToggle = async (chargeId, enabled) => {
        if (enabled) {
            if (!window.confirm('⚠️ This will apply to NEW orders only. Continue?')) {
                return;
            }
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/extra-charges/${chargeId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ enabled })
            });

            if (res.ok) {
                setCharges(prev => prev.map(c =>
                    c.id === chargeId ? { ...c, enabled } : c
                ));
                alert(`✅ Charge ${enabled ? 'enabled' : 'disabled'}`);
            } else {
                const data = await res.json();
                alert(`❌ Failed to update charge status: ${data.msg || 'Unknown error'}`);
            }
        } catch (err) {
            alert('❌ Connection error: Make sure the backend server is running.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditCharge = (charge) => {
        setEditModal({ isOpen: true, charge: { ...charge } });
    };

    const handleSaveEdit = async () => {
        if (!editModal.charge) return;

        if (editModal.charge.amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/extra-charges/${editModal.charge.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: editModal.charge.type,
                    amount: editModal.charge.amount,
                    timeRange: editModal.charge.timeRange
                })
            });

            if (res.ok) {
                setCharges(prev => prev.map(c =>
                    c.id === editModal.charge.id ? editModal.charge : c
                ));
                setEditModal({ isOpen: false, charge: null });
                alert('✅ Charge updated successfully!');
            } else {
                const data = await res.json();
                alert(`❌ Failed to save changes: ${data.msg || 'Unknown error'}`);
            }
        } catch (err) {
            alert('❌ Connection error: Make sure the backend server is running.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className={css.container}>
                    <div className={css.loading}>Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <div>
                        <h1>⚡ Smart Extra Charges</h1>
                        <p className={css.subtitle}>Manage additional service charges for delivery conditions</p>
                    </div>
                    <div className={css.systemToggle}>
                        <span className={css.systemLabel}>
                            {systemEnabled ? '✅ System Active' : '⏸️ System Disabled'}
                        </span>
                        <label className={css.toggle}>
                            <input
                                type="checkbox"
                                checked={systemEnabled}
                                onChange={(e) => handleSystemToggle(e.target.checked)}
                                disabled={saving}
                            />
                            <span className={css.slider}></span>
                        </label>
                    </div>
                </div>

                <div className={css.warningBox}>
                    <strong>⚠️ Important</strong>
                    <p>All changes apply to NEW orders only. Existing orders remain unchanged.</p>
                </div>

                <div className={css.tableContainer}>
                    <table className={css.chargesTable}>
                        <thead>
                            <tr>
                                <th>Charge Type</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th>Time Range</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map(charge => (
                                <tr key={charge.id} className={charge.enabled ? css.activeRow : ''}>
                                    <td>
                                        <div className={css.chargeType}>
                                            <span className={css.chargeIcon}>{charge.icon}</span>
                                            <strong>{charge.name}</strong>
                                        </div>
                                    </td>
                                    <td className={css.description}>{charge.description}</td>
                                    <td>
                                        <span className={charge.enabled ? css.statusActive : css.statusInactive}>
                                            {charge.enabled ? 'ON' : 'OFF'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={css.amount}>
                                            {charge.type === 'fixed'
                                                ? `₹${charge.amount}`
                                                : `${charge.amount}%`
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        {charge.timeRange ? (
                                            <span className={css.timeRange}>
                                                {charge.timeRange.start} - {charge.timeRange.end}
                                            </span>
                                        ) : (
                                            <span className={css.noTime}>Always</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={css.actions}>
                                            <button
                                                className={css.editBtn}
                                                onClick={() => handleEditCharge(charge)}
                                                disabled={saving}
                                                title="Edit charge"
                                            >
                                                ✏️
                                            </button>
                                            <label className={css.toggleSmall}>
                                                <input
                                                    type="checkbox"
                                                    checked={charge.enabled}
                                                    onChange={(e) => handleChargeToggle(charge.id, e.target.checked)}
                                                    disabled={saving || !systemEnabled}
                                                />
                                                <span className={css.sliderSmall}></span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!systemEnabled && (
                        <div className={css.disabledOverlay}>
                            <p>
                                ⬆️ Please enable the <strong>Extra Charges System</strong> above first
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editModal.isOpen && editModal.charge && (
                <div className={css.modalOverlay}>
                    <div className={css.modalContent}>
                        <h3>Edit {editModal.charge.name}</h3>

                        <div className={css.inputGroup}>
                            <label>Charge Type</label>
                            <div className={css.radioGroup}>
                                <label className={css.radio}>
                                    <input
                                        type="radio"
                                        checked={editModal.charge.type === 'fixed'}
                                        onChange={() => setEditModal({
                                            ...editModal,
                                            charge: { ...editModal.charge, type: 'fixed' }
                                        })}
                                    />
                                    <span>Fixed Amount (₹)</span>
                                </label>
                                <label className={css.radio}>
                                    <input
                                        type="radio"
                                        checked={editModal.charge.type === 'percentage'}
                                        onChange={() => setEditModal({
                                            ...editModal,
                                            charge: { ...editModal.charge, type: 'percentage' }
                                        })}
                                    />
                                    <span>Percentage (%)</span>
                                </label>
                            </div>
                        </div>

                        <div className={css.inputGroup}>
                            <label>
                                {editModal.charge.type === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'}
                            </label>
                            <input
                                type="number"
                                className={css.input}
                                value={editModal.charge.amount}
                                onChange={(e) => setEditModal({
                                    ...editModal,
                                    charge: { ...editModal.charge, amount: parseFloat(e.target.value) || 0 }
                                })}
                                min="0"
                                step={editModal.charge.type === 'percentage' ? '0.1' : '1'}
                            />
                        </div>

                        {editModal.charge.id === 'night' && (
                            <div className={css.inputGroup}>
                                <label>Active Time Range</label>
                                <div className={css.timeInputs}>
                                    <div>
                                        <label className={css.smallLabel}>Start Time</label>
                                        <input
                                            type="time"
                                            className={css.input}
                                            value={editModal.charge.timeRange?.start || '22:00'}
                                            onChange={(e) => setEditModal({
                                                ...editModal,
                                                charge: {
                                                    ...editModal.charge,
                                                    timeRange: {
                                                        ...editModal.charge.timeRange,
                                                        start: e.target.value
                                                    }
                                                }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className={css.smallLabel}>End Time</label>
                                        <input
                                            type="time"
                                            className={css.input}
                                            value={editModal.charge.timeRange?.end || '06:00'}
                                            onChange={(e) => setEditModal({
                                                ...editModal,
                                                charge: {
                                                    ...editModal.charge,
                                                    timeRange: {
                                                        ...editModal.charge.timeRange,
                                                        end: e.target.value
                                                    }
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={css.modalActions}>
                            <button
                                className={css.saveBtn}
                                onClick={handleSaveEdit}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                className={css.cancelBtn}
                                onClick={() => setEditModal({ isOpen: false, charge: null })}
                                disabled={saving}
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

export default AdminExtraCharges;
