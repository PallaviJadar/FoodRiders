import React, { useState } from 'react';
import { motion } from 'framer-motion';
import css from './SaveAddressDialog.module.css';
import { useAuth } from '../../context/AuthContext';

const SaveAddressDialog = ({ userId, addressData, onClose }) => {
    const { user } = useAuth(); // Get auth context
    const [label, setLabel] = useState('Home');
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        // Silent block for guests (as requested: "allow save only after login or skip")
        // But prompt says: "Replace with 'Login required to save address' (only if truly unauthenticated)"
        if (!user || !token) {
            setError('Login required to save address');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // New Secure Endpoint
            const response = await fetch(`/api/address/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...addressData,
                    label,
                    isDefault
                })
            });

            if (response.ok) {
                onClose(true);
            } else {
                const data = await response.json();
                console.error('Address save failed:', data);
                setError(data.error || data.message || 'Failed to save address');
            }
        } catch (error) {
            console.error('Address save exception:', error);
            setError('Error saving address. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={css.overlay} onClick={() => onClose(false)}>
            <motion.div
                className={css.dialog}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                <h3>💾 Save this address for future orders?</h3>

                <div className={css.formGroup}>
                    <label>Label</label>
                    <select
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className={css.select}
                    >
                        <option value="Home">🏠 Home</option>
                        <option value="Work">💼 Work</option>
                        <option value="Mom">👩 Mom</option>
                        <option value="Dad">👨 Dad</option>
                        <option value="Office">🏢 Office</option>
                        <option value="Other">📍 Other</option>
                    </select>
                </div>

                <div className={css.checkboxGroup}>
                    <label className={css.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                        />
                        <span>Set as default address</span>
                    </label>
                </div>

                <div className={css.addressPreview}>
                    <p><strong>Address:</strong></p>
                    <p>{addressData.fullAddress || addressData.googleFormattedAddress}</p>
                    {addressData.recipientName && (
                        <p><strong>Recipient:</strong> {addressData.recipientName}</p>
                    )}
                </div>

                {error && (
                    <div className={css.error}>
                        ⚠️ {error}
                    </div>
                )}

                <div className={css.actions}>
                    <button
                        onClick={() => onClose(false)}
                        className={css.btnSkip}
                        disabled={saving}
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSave}
                        className={css.btnSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Address'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default SaveAddressDialog;
