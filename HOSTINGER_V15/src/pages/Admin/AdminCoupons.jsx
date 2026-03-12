
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminCoupons.css';

const AdminCoupons = ({ isHub }) => {
    const [coupons, setCoupons] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [stats, setStats] = useState({
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsage: 0,
        totalDiscountGiven: 0
    });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'FLAT',
        value: 0,
        minOrderAmount: 0,
        maxDiscount: '',
        validFrom: new Date().toISOString().split('T')[0],
        validTill: '',
        usageLimit: '',
        perUserLimit: 1,
        firstOrderOnly: false,
        applicableRestaurantIds: []
    });
    const [creating, setCreating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/restaurants/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setRestaurants(data);
            } else {
                console.error("Restaurants API returned non-array:", data);
                setRestaurants([]);
            }
        } catch (err) {
            console.error('Error fetching restaurants:', err);
            setRestaurants([]);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const [couponsRes, statsRes] = await Promise.all([
                axios.get('/api/coupons/admin/list', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/coupons/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setCoupons(couponsRes.data.data || []);
            setStats(statsRes.data.data || {
                totalCoupons: 0,
                activeCoupons: 0,
                totalUsage: 0,
                totalDiscountGiven: 0
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const token = localStorage.getItem('adminToken');
            const payload = {
                ...formData,
                maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
            };

            if (editMode && editingId) {
                await axios.put(`/api/coupons/admin/update/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Coupon updated successfully!');
            } else {
                await axios.post('/api/coupons/admin/create', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Coupon created successfully!');
            }

            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || `Error ${editMode ? 'updating' : 'creating'} coupon`);
        } finally {
            setCreating(false);
        }
    };

    const toggleCouponStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/coupons/admin/toggle/${id}`, { isActive: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            alert('Error updating coupon status');
        }
    };

    const handleRestaurantToggle = (id) => {
        setFormData(prev => {
            const current = [...prev.applicableRestaurantIds];
            if (current.includes(id)) {
                return { ...prev, applicableRestaurantIds: current.filter(rid => rid !== id) };
            } else {
                return { ...prev, applicableRestaurantIds: [...current, id] };
            }
        });
    };

    const handleEdit = (coupon) => {
        setEditMode(true);
        setEditingId(coupon._id);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount || 0,
            maxDiscount: coupon.maxDiscount || '',
            validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
            validTill: new Date(coupon.validTill).toISOString().split('T')[0],
            usageLimit: coupon.usageLimit || '',
            perUserLimit: coupon.perUserLimit || 1,
            firstOrderOnly: coupon.firstOrderOnly || false,
            applicableRestaurantIds: coupon.applicableRestaurantIds || []
        });
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`/api/coupons/admin/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Coupon deleted successfully');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting coupon');
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setEditingId(null);
        setFormData({
            code: '',
            type: 'FLAT',
            value: 0,
            minOrderAmount: 0,
            maxDiscount: '',
            validFrom: new Date().toISOString().split('T')[0],
            validTill: '',
            usageLimit: '',
            perUserLimit: 1,
            firstOrderOnly: false,
            applicableRestaurantIds: []
        });
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
        <div className="admin-coupons-page">
            <div className="page-header">
                {!isHub && <h1>Coupon Management</h1>}
                <button onClick={() => setShowCreateModal(true)} className="create-btn">
                    + Create Coupon
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalCoupons}</div>
                    <div className="stat-label">Total Coupons</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeCoupons}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsage}</div>
                    <div className="stat-label">Total Usage</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">₹{stats.totalDiscountGiven}</div>
                    <div className="stat-label">Total Discount Given</div>
                </div>
            </div>

            <div className="coupons-table-container">
                {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No coupons yet</p>
                        <p>Click "+ Create Coupon" to create your first coupon</p>
                    </div>
                ) : (
                    <table className="coupons-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Min Order</th>
                                <th>Restaurants</th>
                                <th>Valid Till</th>
                                <th>Usage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon._id}>
                                    <td className="coupon-code">{coupon.code}</td>
                                    <td><span className="type-badge">{coupon.type}</span></td>
                                    <td>
                                        {coupon.type === 'FLAT' ? `₹${coupon.value}` : `${coupon.value}%`}
                                    </td>
                                    <td>₹{coupon.minOrderAmount}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={
                                        coupon.applicableRestaurantIds?.length > 0
                                            ? coupon.applicableRestaurantIds.map(id => restaurants.find(r => r._id === id)?.name).join(', ')
                                            : 'All Restaurants'
                                    }>
                                        {coupon.applicableRestaurantIds && coupon.applicableRestaurantIds.length > 0
                                            ? coupon.applicableRestaurantIds.map(id => restaurants.find(r => r._id === id)?.name || 'Unknown').join(', ')
                                            : <span style={{ color: '#4caf50', fontWeight: 'bold' }}>All</span>
                                        }
                                    </td>
                                    <td>{new Date(coupon.validTill).toLocaleDateString()}</td>
                                    <td>{coupon.timesUsed || 0} / {coupon.usageLimit || '∞'}</td>
                                    <td>
                                        <span className={`status-badge ${coupon.isActive ? 'active' : 'inactive'}`}>
                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => toggleCouponStatus(coupon._id, coupon.isActive)}
                                            className="action-btn"
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                background: coupon.isActive ? '#ff4d4d' : '#4caf50',
                                                color: 'white',
                                                border: 'none'
                                            }}
                                        >
                                            {coupon.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(coupon)}
                                            className="action-btn"
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                background: '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                marginLeft: '5px'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon._id)}
                                            className="action-btn"
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                marginLeft: '5px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editMode ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="close-btn">✕</button>
                        </div>

                        <form onSubmit={handleCreateCoupon}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="FOOD10"
                                        required
                                        maxLength={20}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        required
                                    >
                                        <option value="FLAT">Flat ₹ Off</option>
                                        <option value="PERCENTAGE">Percentage %</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Value *</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        placeholder={formData.type === 'FLAT' ? '50' : '10'}
                                        required
                                        min="0"
                                        max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                                    />
                                    <small>{formData.type === 'FLAT' ? 'Amount in ₹' : 'Percentage (0-100)'}</small>
                                </div>

                                <div className="form-group">
                                    <label>Min Order Amount</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                        placeholder="300"
                                        min="0"
                                    />
                                </div>

                                {formData.type === 'PERCENTAGE' && (
                                    <div className="form-group">
                                        <label>Max Discount (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.maxDiscount}
                                            onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                            placeholder="100"
                                            min="0"
                                        />
                                        <small>Maximum discount amount</small>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Valid From *</label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Valid Till *</label>
                                    <input
                                        type="date"
                                        value={formData.validTill}
                                        onChange={(e) => setFormData({ ...formData, validTill: e.target.value })}
                                        required
                                        min={formData.validFrom}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Usage Limit (Global)</label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        placeholder="Empty for unlimited"
                                        min="1"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Per User Limit *</label>
                                    <input
                                        type="number"
                                        value={formData.perUserLimit}
                                        onChange={(e) => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                                        required
                                        min="1"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.firstOrderOnly}
                                            onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                                        />
                                        <span>First Order Only</span>
                                    </label>
                                </div>

                                <div className="form-group full-width">
                                    <label>Applicable Restaurant</label>
                                    <select
                                        value={formData.applicableRestaurantIds.length > 0 ? formData.applicableRestaurantIds[0] : 'all'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({
                                                ...formData,
                                                applicableRestaurantIds: val === 'all' ? [] : [val]
                                            });
                                        }}
                                    >
                                        <option value="all">All Restaurants</option>
                                        {restaurants.map(r => (
                                            <option key={r._id} value={r._id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                        Select a specific restaurant or apply globally.
                                    </p>
                                </div>
                            </div>


                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">Cancel</button>
                                <button type="submit" className="submit-btn" disabled={creating}>
                                    {creating ? 'Processing...' : (editMode ? 'Update Coupon' : 'Create Coupon')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );

    return isHub ? PageContent : <AdminLayout>{PageContent}</AdminLayout>;
};

export default AdminCoupons;
