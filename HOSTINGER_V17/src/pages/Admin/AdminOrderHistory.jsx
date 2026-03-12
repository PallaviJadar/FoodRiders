import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminOrderHistory.module.css';

const AdminOrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('');
    const backendUrl = '';

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders/all');
            const data = await res.json();
            // Sort by Date Descending
            const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order._id && order._id.toLowerCase().includes(searchTerm)) ||
            (order.userDetails?.name && order.userDetails.name.toLowerCase().includes(searchTerm)) ||
            (order.deliveryBoyId?.fullName && order.deliveryBoyId.fullName.toLowerCase().includes(searchTerm)) ||
            (order.restaurantName && order.restaurantName.toLowerCase().includes(searchTerm));

        const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;

        const matchesDate = !dateFilter || new Date(order.createdAt).toISOString().slice(0, 10) === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusClass = (status) => {
        if (status === 'DELIVERED') return css.statusCompleted;
        if (status === 'CANCELLED' || status === 'REJECTED') return css.statusCancelled;
        return css.statusPending;
    };

    if (loading) return <AdminLayout><div style={{ padding: '2rem' }}>Loading history...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <h1>📜 Order History</h1>
                    <div className={css.stats}>
                        <div className={css.statCard}>
                            <strong>Total Orders</strong>
                            <div style={{ fontSize: '1.5rem' }}>{orders.length}</div>
                        </div>
                        <div className={css.statCard}>
                            <strong>Revenue</strong>
                            <div style={{ fontSize: '1.5rem' }}>₹{orders.reduce((acc, o) => acc + (o.status === 'DELIVERED' ? o.totalAmount : 0), 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className={css.filters}>
                    <input
                        type="text"
                        placeholder="Search ID, Customer, Restaurant..."
                        className={css.searchInput}
                        value={searchTerm}
                        onChange={handleSearch}
                    />

                    <select
                        className={css.searchInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="CREATED">Created</option>
                        <option value="PAYMENT_PENDING">Payment Pending</option>
                        <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="ON_THE_WAY">On The Way</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        className={css.searchInput}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />

                    {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
                        <button
                            onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setDateFilter(''); }}
                            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className={css.tableWrapper}>
                    <table className={css.table}>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Timeline</th>
                                <th>Customer</th>
                                <th>Restaurant</th>
                                <th>Rider</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No orders found</td>
                                </tr>
                            ) : (
                                filteredOrders.slice(0, 50).map(order => (
                                    <tr key={order._id}>
                                        <td data-label="Order ID" style={{ fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                        <td data-label="Timeline">
                                            <div style={{ marginBottom: '4px' }}>
                                                <strong>📅 {new Date(order.createdAt).toLocaleDateString()}</strong>
                                                <br />
                                                <small style={{ color: '#666' }}>Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                            </div>
                                            {(order.acceptedAt || order.assignedAt) && (
                                                <div style={{ color: '#0984e3', fontSize: '0.75rem' }}>
                                                    ✓ Accepted: {new Date(order.acceptedAt || order.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            {order.deliveredAt && (
                                                <div style={{ color: '#27ae60', fontSize: '0.75rem' }}>
                                                    ✓ Delivered: {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Customer">
                                            <strong>{order.userDetails?.name || 'Guest'}</strong>
                                            <br />
                                            <small>{order.userDetails?.phone}</small>
                                        </td>
                                        <td data-label="Restaurant">{order.restaurantName}</td>
                                        <td data-label="Rider">
                                            {order.deliveryBoyId ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <strong>{order.deliveryBoyId.fullName}</strong>
                                                    <small style={{ color: '#666' }}>{order.deliveryBoyId.mobile}</small>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#b2bec3', fontStyle: 'italic' }}>Not Assigned</span>
                                            )}
                                        </td>
                                        <td data-label="Amount">₹{order.totalAmount}</td>
                                        <td data-label="Payment">
                                            {order.paymentMethod || order.paymentMode}
                                            <br />
                                            <small className={order.paymentStatus === 'PAID' ? css.textSuccess : (order.paymentMethod === 'COD' ? css.textWarning : css.textDanger)}>
                                                {order.paymentStatus}
                                            </small>
                                            {order.paymentScreenshot && (
                                                <div style={{ marginTop: '4px' }}>
                                                    <a
                                                        href={`${backendUrl}${order.paymentScreenshot}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontSize: '0.7rem', color: '#2ed573', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
                                                    >
                                                        📸 View Proof
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`${css.statusBadge} ${getStatusClass(order.orderStatus)}`}>
                                                {order.orderStatus.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {filteredOrders.length > 50 && (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                            Showing first 50 results (Optimization)
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrderHistory;
