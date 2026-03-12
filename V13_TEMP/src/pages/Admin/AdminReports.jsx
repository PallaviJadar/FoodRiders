import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminReports.module.css';

const AdminReports = () => {
    const [reportType, setReportType] = useState('orders');
    const [loading, setLoading] = useState(false);
    const [restaurants, setRestaurants] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        restaurantName: ''
    });

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const res = await fetch('/api/restaurants');
            const data = await res.json();
            setRestaurants(data);
        } catch (err) {
            console.error('Failed to fetch restaurants');
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleDownload = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            let url = `/api/reports/${reportType}?`;

            if (reportType === 'orders') {
                const queryParams = new URLSearchParams();
                if (filters.startDate) queryParams.append('startDate', filters.startDate);
                if (filters.endDate) queryParams.append('endDate', filters.endDate);
                if (filters.status) queryParams.append('status', filters.status);
                if (filters.restaurantName) queryParams.append('restaurantName', filters.restaurantName);
                url += queryParams.toString();
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `foodriders-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert('Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const orderStatuses = [
        'PENDING_PAYMENT', 'PAYMENT_RECEIVED', 'ORDER_ACCEPTED',
        'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    ];

    return (
        <AdminLayout>
            <div className={css.reportsWrapper}>
                <header className={css.header}>
                    <h2>Reports & Data Export</h2>
                    <p>Generate and download CSV summaries of your business data.</p>
                </header>

                <div className={css.exportCard}>
                    <div className={css.formGroup}>
                        <label>Select Report Type</label>
                        <select
                            className={css.mainSelect}
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="orders">Orders Summary</option>
                            <option value="users">App Customers Summary</option>
                            <option value="restaurants">Restaurants Summary</option>
                        </select>
                    </div>

                    {reportType === 'orders' && (
                        <div className={css.filtersGrid}>
                            <div className={css.formGroup}>
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className={css.formGroup}>
                                <label>End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                />
                            </div>
                            <div className={css.formGroup}>
                                <label>Order Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className={css.formGroup}>
                                <label>Restaurant</label>
                                <select
                                    name="restaurantName"
                                    value={filters.restaurantName}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Restaurants</option>
                                    {restaurants.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className={css.actions}>
                        <button
                            className={css.downloadBtn}
                            onClick={handleDownload}
                            disabled={loading}
                        >
                            {loading ? (
                                <><span className={css.spinner}></span> Generating CSV...</>
                            ) : (
                                <>📥 Download CSV Summary</>
                            )}
                        </button>
                    </div>
                </div>

                <div className={css.infoSection}>
                    <h3>Export Tips</h3>
                    <ul>
                        <li>Orders summary includes itemized charges (Subtotal, Tax, Tip, Delivery etc.).</li>
                        <li>User summary helps track top customers and wallet balances.</li>
                        <li>Restaurant summary provides a high-level view of revenue per hotel.</li>
                        <li>CSV files can be opened in <strong>Microsoft Excel</strong> or <strong>Google Sheets</strong>.</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;
