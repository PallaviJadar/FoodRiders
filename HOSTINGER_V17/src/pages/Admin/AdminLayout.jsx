import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import css from './AdminLayout.module.css';
import BackButton from '../../utils/RestaurantUtils/BackButton.jsx';
import socket from '../../utils/socket';
import audioManager from '../../utils/audioManager';
import useFCM from '../../hooks/useFCM';

const AdminLayout = ({ children }) => {
    const { permissionStatus, requestPermission } = useFCM();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [liveOrders, setLiveOrders] = useState([]);
    const [isMuted, setIsMuted] = useState(localStorage.getItem('isMuted') === 'true');

    // Siren logic moved to GlobalAdminNotifications.jsx

    // Check admin authentication
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin', { replace: true });
        }
    }, [navigate]);

    // Sync Mute State
    useEffect(() => {
        const syncMute = () => setIsMuted(localStorage.getItem('isMuted') === 'true');
        window.addEventListener('storage', syncMute);
        window.addEventListener('mute-local-event', syncMute);
        return () => {
            window.removeEventListener('storage', syncMute);
            window.removeEventListener('mute-local-event', syncMute);
        };
    }, []);

    const handleMuteToggle = () => {
        const newVal = !isMuted;
        setIsMuted(newVal);
        localStorage.setItem('isMuted', newVal);
        window.dispatchEvent(new Event('mute-local-event'));
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    const [adminRole, setAdminRole] = useState(localStorage.getItem('adminRole'));

    useEffect(() => {
        setAdminRole(localStorage.getItem('adminRole'));
    }, []);

    const navItems = [
        ...(adminRole === 'super_admin' ? [{ name: 'Owner Analytics', path: '/super/dashboard', icon: '💎' }] : []),
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Category Groups', path: '/admin/category-groups', icon: '📂' },
        { name: 'Restaurants', path: '/admin/restaurants', icon: '🏪' },
        { name: 'Live Orders', path: '/admin/orders', icon: '⚡' },
        { name: 'Order History', path: '/admin/orders/history', icon: '📜' },
        { name: 'App Customers', path: '/admin/users', icon: '👥' },
        { name: 'Logistics Fleet', path: '/admin/delivery-partners', icon: '🛵' },
        { name: 'Logistics Portal', path: '/delivery-login', icon: '🚀', external: true },
        { name: 'Billing & Fees', path: '/admin/billing-settings', icon: '💸' },
        { name: 'Market (Refer & Coupon)', path: '/admin/marketing', icon: '🏷️' },
        { name: 'Popups', path: '/admin/popups', icon: '💬' },
        { name: 'Announcements', path: '/admin/announcements', icon: '📢' },
        { name: 'Homepage Carousel', path: '/admin/carousel', icon: '🎠' },
        { name: 'Home Sections', path: '/admin/home-delivery', icon: '🧩' },
        { name: 'Reports & Export', path: '/admin/reports', icon: '📈' },
    ];

    const getTitle = () => {
        const item = navItems.find(i => i.path === location.pathname);
        return item ? item.name : 'Admin Panel';
    };

    const closeSidebarOnMobile = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const handleContainerClick = () => {
        // Unlock audio on any click
        audioManager.initialize();
    };

    return (
        <div className={css.adminContainer} onClick={handleContainerClick}>
            {/* Overlay for mobile */}
            {isSidebarOpen && <div className={css.overlay} onClick={() => setIsSidebarOpen(false)}></div>}

            <aside className={`${css.sidebar} ${isSidebarOpen ? css.sidebarOpen : ''}`}>
                <div className={css.sidebarHeader}>
                    <div className={css.logo}>FOODRIDERS</div>
                    <button className={css.closeSidebar} onClick={() => setIsSidebarOpen(false)}>×</button>
                </div>
                <nav className={css.navLinks}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${css.navItem} ${location.pathname === item.path ? css.activeNavItem : ''}`}
                            onClick={closeSidebarOnMobile}
                            target={item.external ? "_blank" : undefined}
                            style={item.external ? { color: '#2ed573' } : {}}
                        >
                            <span className={css.navIcon} style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1rem 1rem 0' }}></div>
                    <Link
                        to="/"
                        className={css.navItem}
                        onClick={closeSidebarOnMobile}
                        style={{ color: 'var(--color-primary)' }}
                    >
                        <span className={css.navIcon} style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</span>
                        <span>User Home</span>
                    </Link>
                    <div className={css.mobileOnlyLogout}>
                        <button className={css.sidebarLogoutBtn} onClick={handleLogout}>🚪 Logout</button>
                    </div>
                </nav>
            </aside>

            <main className={css.mainContent}>
                <header className={css.topBar}>
                    <div className={css.topBarLeft}>
                        <button className={css.hamburger} onClick={() => setIsSidebarOpen(true)}>
                            <span></span><span></span><span></span>
                        </button>
                        <BackButton className={css.adminBackBtn} />
                    </div>
                    <div className={css.adminProfile}>
                        <button
                            className={`${css.muteBtn} ${isMuted ? '' : css.activeAlert}`}
                            onClick={handleMuteToggle}
                            title={isMuted ? "Unmute order alerts" : "Mute order alerts"}
                        >
                            {isMuted ? '🔕' : '🔔'}
                        </button>
                        <span className={css.pageTitle}>{getTitle()}</span>
                        <button
                            className={css.homeBtn}
                            onClick={() => window.location.href = '/'}
                            title="Go to User Home"
                            style={{
                                background: 'none', border: '1px solid var(--border-subtle)',
                                cursor: 'pointer', fontSize: '1rem', padding: '0.4rem 0.8rem',
                                borderRadius: '8px', color: 'var(--color-text-main)',
                                transition: 'all 0.2s'
                            }}
                        >
                            🏠
                        </button>
                        <button className={css.logoutBtn} onClick={handleLogout}>Logout</button>
                    </div>
                </header>
                <div className={css.pageBody}>
                    {permissionStatus !== 'granted' && (
                        <div className={css.permissionBanner} onClick={requestPermission}>
                            {permissionStatus === 'denied'
                                ? "🚨 Notifications blocked! Click to learn how to enable."
                                : "🔔 Enable real-time order alerts? Click here."}
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
