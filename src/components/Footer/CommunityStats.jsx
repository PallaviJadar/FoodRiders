import React, { useState, useEffect, useRef } from 'react';
import css from './CommunityStats.module.css';
import socket from '../../utils/socket';

const CountUp = ({ end, duration = 600 }) => {
    const [count, setCount] = useState(0);
    const countingStarted = useRef(false);

    useEffect(() => {
        if (countingStarted.current) return;
        countingStarted.current = true;

        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const Sparkline = ({ data = [] }) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 40 - ((val - min) / range) * 35;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `0,40 ${points} 100,40`;

    return (
        <div className={css.sparklineContainer}>
            <svg viewBox="0 0 100 40" className={css.sparklineSvg} preserveAspectRatio="none">
                <polygon points={fillPath} className={css.sparklineArea} />
                <polyline points={points} className={css.sparklinePath} vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

const CommunityStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // ✅ Controlled by admin toggle — default hidden until we know
    const [showUserStats, setShowUserStats] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Fetch the public site setting (no auth required)
    const fetchSiteSettings = async () => {
        try {
            const res = await fetch('/api/site-settings');
            if (res.ok) {
                const data = await res.json();
                setShowUserStats(data.showUserStats ?? false);
            }
        } catch (err) {
            setShowUserStats(false);
        } finally {
            setSettingsLoaded(true);
        }
    };

    useEffect(() => {
        fetchSiteSettings();

        const fetchStats = async () => {
            try {
                const res = await fetch('/api/system/usage-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();

        // ✅ Listen for admin toggling user stats in real-time
        const handleSettingsUpdate = (data) => {
            if (typeof data.showUserStats !== 'undefined') {
                setShowUserStats(data.showUserStats);
            }
        };
        socket.on('site_settings_updated', handleSettingsUpdate);

        return () => {
            socket.off('site_settings_updated', handleSettingsUpdate);
        };
    }, []);

    // ✅ If admin has disabled user stats — render nothing
    if (!settingsLoaded) return null;  // Wait silently while loading setting
    if (!showUserStats) return null;    // Hidden by admin toggle

    const statConfig = [
        { key: 'usersToday', label: 'Users Today', icon: '👥' },
        { key: 'last7Days', label: 'Last 7 Days', icon: '📆' },
        { key: 'thisMonth', label: 'This Month', icon: '🗓️' },
        { key: 'thisYear', label: 'This Year', icon: '📈' },
        { key: 'totalRegistered', label: 'Total Users', icon: '⭐' }
    ];

    if (loading || !stats) {
        return (
            <div className={css.communitySection}>
                <div className={css.container}>
                    <p className={css.note}>Loading community activity...</p>
                </div>
            </div>
        );
    }

    const { insights } = stats;

    return (
        <section className={css.communitySection} aria-labelledby="community-title">
            <div className={css.container}>
                <header className={css.header}>
                    <h2 id="community-title">Our Community</h2>
                    <p className={css.subtitle}>Live activity on FoodRiders</p>
                </header>

                <div className={css.statsGrid}>
                    {statConfig.map((item) => (
                        <div key={item.key} className={css.statCard}>
                            <div className={css.iconWrapper} aria-hidden="true">
                                {item.icon}
                            </div>
                            <div className={css.number}>
                                <CountUp end={stats[item.key] || 0} />
                            </div>
                            <div className={css.label}>{item.label}</div>
                        </div>
                    ))}
                </div>

                {insights && (
                    <div className={css.insightsRow}>
                        <div className={`${css.insightCard} ${css.peakCard}`}>
                            <div className={css.insightHeader}>
                                <span className={css.insightIcon}>🔥</span>
                                <span className={css.insightTitle}>Peak Activity Today</span>
                            </div>
                            <div className={css.insightValue}>{insights.peakTime}</div>
                            <div className={css.insightSub}>Most active hours</div>
                        </div>

                        <div className={css.insightCard}>
                            <div className={css.insightHeader}>
                                <span className={css.insightIcon}>📊</span>
                                <span className={css.insightTitle}>Activity (Last 7 Days)</span>
                            </div>
                            <Sparkline data={insights.sparkline} />
                        </div>

                        <div className={css.insightCard}>
                            <div className={css.insightHeader}>
                                <span className={css.insightIcon}>🏙️</span>
                                <span className={css.insightTitle}>Top Active Town</span>
                            </div>
                            <div className={css.insightValue}>{insights.activeTown?.name || 'Mahalingapura'}</div>
                            <div className={css.insightSub}>{insights.activeTown?.count || 'High Activity'}</div>
                        </div>
                    </div>
                )}

                <p className={css.note}>
                    Insights are generated from overall platform activity. No personal data is displayed.
                </p>
            </div>
        </section>
    );
};

export default CommunityStats;
