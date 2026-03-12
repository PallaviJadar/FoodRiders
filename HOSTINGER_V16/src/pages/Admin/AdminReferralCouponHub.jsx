
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminReferrals from './AdminReferrals';
import AdminReferralAnalytics from './AdminReferralAnalytics';
import AdminCoupons from './AdminCoupons';
import AdminCouponAnalytics from './AdminCouponAnalytics';
import styles from './AdminReferralCouponHub.module.css';

const AdminReferralCouponHub = () => {
    const [activeTab, setActiveTab] = useState('referral-mgmt');

    const tabs = [
        { id: 'referral-mgmt', label: 'Referral Settings', component: AdminReferrals },
        { id: 'referral-stats', label: 'Referral Analytics', component: AdminReferralAnalytics },
        { id: 'coupon-mgmt', label: 'Coupon Management', component: AdminCoupons },
        { id: 'coupon-stats', label: 'Coupon Analytics', component: AdminCouponAnalytics }
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AdminReferrals;

    return (
        <AdminLayout>
            <div className={styles.hubContainer}>
                <div className={styles.hubTabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles.hubContent}>
                    <div className={styles.tabWrapper}>
                        <ActiveComponent isHub={true} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReferralCouponHub;
