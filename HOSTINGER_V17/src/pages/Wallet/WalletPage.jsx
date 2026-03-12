
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WalletPage.css';
import BackButton from '../../utils/RestaurantUtils/BackButton.jsx';

const WalletPage = () => {
    const [balanceData, setBalanceData] = useState({
        balance: 0,
        expiryWarning: null
    });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [balanceRes, historyRes] = await Promise.all([
                axios.get('/api/wallet/balance', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/wallet/history', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (balanceRes.data.success) {
                setBalanceData(balanceRes.data.data);
            }
            if (historyRes.data.success) {
                setHistory(historyRes.data.data.transactions);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="wallet-page-container">
            <div style={{ marginBottom: '1rem' }}>
                <BackButton />
            </div>

            <div className="balance-card">
                <div className="lbl">Available Balance</div>
                <div className="amount">₹{balanceData.balance}</div>
                <div className="lbl" style={{ marginTop: '0.5rem', opacity: 0.5 }}>FoodRiders Wallet</div>
            </div>

            {balanceData.expiryWarning && (
                <div className="expiry-warning">
                    <span className="icon">⏳</span>
                    <div className="text">
                        <span className="bold">₹{balanceData.expiryWarning.amount}</span> is expiring in
                        <span className="bold"> {balanceData.expiryWarning.daysLeft} days</span>. Use it before {formatDate(balanceData.expiryWarning.expiryDate)}!
                    </div>
                </div>
            )}

            <div className="history-section">
                <h2>Transaction History</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading transactions...</div>
                ) : history.length === 0 ? (
                    <div className="empty-history">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        <p>No transactions yet</p>
                        <small>Earn rewards by inviting friends!</small>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {history.map((txn) => (
                            <div key={txn.id} className="txn-item">
                                <div className="txn-left">
                                    <span className="txn-source">{txn.description}</span>
                                    <span className="txn-date">{formatDate(txn.createdAt)}</span>
                                </div>
                                <div className="txn-right">
                                    <span className={`txn-amount ${txn.type.toLowerCase()}`}>
                                        {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount}
                                    </span>
                                    <div className={`txn-status ${txn.status.toLowerCase()}`}>
                                        {txn.status === 'ACTIVE' ? '' : txn.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPage;
