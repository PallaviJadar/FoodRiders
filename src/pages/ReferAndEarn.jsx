
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ReferAndEarn.css';
import BackButton from '../utils/RestaurantUtils/BackButton.jsx';

const ReferAndEarn = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalReferrals: 0,
        totalEarned: 0
    });
    const [referralSettings, setReferralSettings] = useState({
        referrerReward: 20,
        appLink: 'https://foodriders.in'
    });
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, settingsRes] = await Promise.all([
                axios.get('/api/referrals/user/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/referrals/settings')
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }
            if (settingsRes.data.success) {
                setReferralSettings(settingsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching referral data:', error);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(user?.referralCode || '');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const message = `Hey! Use my referral code *${user?.referralCode}* to get ₹${referralSettings.referrerReward} off on your first order from FoodRiders! 🍔🚀\n\nDownload the app here: ${referralSettings.appLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleNativeShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'FoodRiders Referral',
                text: `Use my code ${user?.referralCode} to get ₹${referralSettings.referrerReward} off on your first order!`,
                url: referralSettings.appLink,
            })
                .catch(console.error);
        } else {
            handleCopyCode();
        }
    };

    return (
        <div className="refer-earn-container">
            <div style={{ marginBottom: '1rem' }}>
                <BackButton />
            </div>

            <div className="refer-card">
                <h1>Invite & Earn</h1>
                <p>Share your love for FoodRiders and get ₹{referralSettings.referrerReward} in your wallet for every friend who orders!</p>
            </div>

            <div className="referral-stats-mini">
                <div className="mini-stat">
                    <span className="val">{stats.totalReferrals}</span>
                    <span className="lbl">Friends Invited</span>
                </div>
                <div className="mini-stat">
                    <span className="val">₹{stats.totalEarned}</span>
                    <span className="lbl">Total Earned</span>
                </div>
            </div>

            <div className="how-it-works">
                <h2>How it works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-num">1</div>
                        <div className="step-text">Share your unique referral code with friends</div>
                    </div>
                    <div className="step">
                        <div className="step-num">2</div>
                        <div className="step-text">Friends sign up using your code</div>
                    </div>
                    <div className="step">
                        <div className="step-num">3</div>
                        <div className="step-text">You both get rewards when they complete their first order!</div>
                    </div>
                </div>
            </div>

            <div className="referral-box">
                <div className="lbl">Your Referral Code</div>
                <div className="code-wrapper">
                    <span className="referral-code">{user?.referralCode || 'NOTSET'}</span>
                    <button className="copy-btn" onClick={handleCopyCode}>
                        {copySuccess ? '✓' : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="share-actions">
                <button className="whatsapp-btn" onClick={handleWhatsAppShare}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.302-.15-.1.432-.726.715-.282.125-.56.065-.823-.1-.315-.2-.937-.345-1.713-1.035-.6-.53-1.005-1.185-1.122-1.385-.117-.2-.012-.307.087-.407.09-.09.195-.23.292-.34.1-.115.132-.195.197-.325.066-.13.033-.245-.017-.345-.05-.1-.442-1.063-.606-1.457-.16-.39-.32-.336-.442-.342-.112-.006-.24-.007-.367-.007-.127 0-.333.047-.507.235-.174.188-.665.65-.665 1.583 0 .933.678 1.834.773 1.963.094.128 1.332 2.035 3.226 2.858.45.196.8.314 1.073.4.452.143.863.123 1.188.075.362-.054 1.114-.455 1.27-1.345 1.2-.6 \n\n (TRUNCATED SVG FOR LENGTH) \n\n " /></svg>
                    Share on WhatsApp
                </button>
                <button className="other-share-btn" onClick={handleNativeShare}>
                    More Options
                </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '2rem' }}>
                Referral rewards are credited after your friend's first successful order.
            </p>
        </div>
    );
};

export default ReferAndEarn;
