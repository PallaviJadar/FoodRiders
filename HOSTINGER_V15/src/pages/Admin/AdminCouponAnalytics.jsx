
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminCouponAnalytics.css';

const AdminCouponAnalytics = ({ isHub }) => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        restaurantId: ''
    });
    const [restaurants, setRestaurants] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('/api/restaurants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRestaurants(res.data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('/api/analytics/coupons', {
                params: filters,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCoupons(response.data.data.coupons);
            }
        } catch (error) {
            console.error('Error fetching coupon analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCoupon = async (couponId, currentStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`/api/coupons/admin/toggle/${couponId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnalytics();
        } catch (error) {
            alert('Error toggling coupon status');
        }
    };

    const PageContent = (
        <div className="coupon-analytics-page">
            {!isHub && <h1>Coupon Performance Analytics</h1>}

            <div className="analytics-filters">
                <select
                    value={filters.restaurantId}
                    onChange={(e) => setFilters({ ...filters, restaurantId: e.target.value })}
                >
                    <option value="">All Restaurants</option>
                    {restaurants.map(r => (
                        <option key={r._id} value={r._id}>{r.hotel}</option>
                    ))}
                </select>
                <input
                    type="date"
                    placeholder="Start Date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
                <input
                    type="date"
                    placeholder="End Date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading analytics...</div>
            ) : (
                <div className="coupons-grid">
                    {coupons.length === 0 ? (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem' }}>
                            No coupons analytics found for selected range.
                        </div>
                    ) : (
                        coupons.map(coupon => (
                            <div key={coupon.couponId} className="coupon-perf-card">
                                <div className="coupon-card-header">
                                    <div className="coupon-main-info">
                                        <h2>{coupon.code}</h2>
                                        <span className="coupon-type">
                                            {coupon.type === 'FLAT' ? `₹${coupon.value} Off` : `${coupon.value}% Off`}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${coupon.status.toLowerCase()}`}>
                                        {coupon.status}
                                    </span>
                                </div>

                                <div className="perf-stats-body">
                                    <div className="main-metrics">
                                        <div className="metric-item">
                                            <span className="val">{coupon.successfulUses}</span>
                                            <span className="lbl">Uses</span>
                                        </div>
                                        <div className="metric-item">
                                            <span className="val">₹{coupon.totalDiscount}</span>
                                            <span className="lbl">Saved</span>
                                        </div>
                                    </div>

                                    <div className="secondary-metrics">
                                        <div className="sec-metric">
                                            <span className="lbl">AOV</span>
                                            <span className="val">₹{coupon.avgOrderValue}</span>
                                        </div>
                                        <div className="sec-metric">
                                            <span className="lbl">Conversion</span>
                                            <span className="val">{coupon.conversionRate}%</span>
                                        </div>
                                        <div className="sec-metric">
                                            <span className="lbl">Applied</span>
                                            <span className="val">{coupon.timesApplied}</span>
                                        </div>
                                        <div className="sec-metric">
                                            <span className="lbl">Failed</span>
                                            <span className="val">{coupon.failedAttempts}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="coupon-actions">
                                    <button className="action-btn">Edit</button>
                                    <button className="action-btn">Duplicate</button>
                                    <button
                                        className="action-btn disable-btn"
                                        onClick={() => handleToggleCoupon(coupon.couponId, coupon.isActive)}
                                    >
                                        {coupon.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );

    return isHub ? PageContent : <AdminLayout>{PageContent}</AdminLayout>;
};

export default AdminCouponAnalytics;
