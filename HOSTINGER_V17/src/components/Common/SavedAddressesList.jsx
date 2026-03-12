import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import css from './SavedAddressesList.module.css';

const SavedAddressesList = ({ userId, onSelect }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAddresses();
    }, [userId]);

    const loadAddresses = async () => {
        try {
            const response = await fetch(`/api/address/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
            } else {
                setError('Failed to load addresses');
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
            setError('Unable to load saved addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (addressId) => {
        if (!confirm('Delete this address?')) return;

        try {
            const response = await fetch(`/api/address/user/${userId}/${addressId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadAddresses(); // Reload list
            } else {
                alert('Failed to delete address');
            }
        } catch (error) {
            alert('Error deleting address');
        }
    };

    const getLabelIcon = (label) => {
        const icons = {
            'Home': '🏠',
            'Work': '💼',
            'Mom': '👩',
            'Dad': '👨',
            'Office': '🏢',
            'Other': '📍'
        };
        return icons[label] || '📍';
    };

    if (loading) {
        return (
            <div className={css.loading}>
                <div className={css.spinner}></div>
                <p>Loading saved addresses...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={css.error}>
                <p>⚠️ {error}</p>
            </div>
        );
    }

    if (addresses.length === 0) {
        return (
            <div className={css.noAddresses}>
                <div className={css.emptyIcon}>📍</div>
                <h3>No saved addresses yet</h3>
                <p>Use Google Map or Manual Entry to add your first address.</p>
                <p className={css.hint}>💡 Saved addresses make future orders faster!</p>
            </div>
        );
    }

    return (
        <div className={css.savedAddressesList}>
            {addresses.map((address, index) => (
                <motion.div
                    key={address._id}
                    className={css.addressCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className={css.addressHeader}>
                        <span className={css.addressLabel}>
                            {getLabelIcon(address.label)} {address.label}
                            {address.isDefault && <span className={css.badgeDefault}>Default</span>}
                        </span>
                    </div>

                    <div className={css.addressContent}>
                        {address.recipientName && (
                            <p className={css.recipientName}>
                                <strong>Recipient:</strong> {address.recipientName}
                            </p>
                        )}
                        <p className={css.addressText}>{address.fullAddress}</p>
                        <small className={css.addressCoords}>
                            📍 {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}
                        </small>
                    </div>

                    <div className={css.addressActions}>
                        <button
                            onClick={() => onSelect(address)}
                            className={css.btnSelect}
                        >
                            ✓ Select
                        </button>
                        <button
                            onClick={() => handleDelete(address._id)}
                            className={css.btnDelete}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default SavedAddressesList;
