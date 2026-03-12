import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleMapPicker from './GoogleMapPicker';
import ManualAddressForm from './ManualAddressForm';
import SavedAddressesList from './SavedAddressesList';
import css from './AddressSelection.module.css';

const AddressSelection = ({ userId, onAddressSelected, initialAddress }) => {
    const [addressMode, setAddressMode] = useState('saved'); // 'saved', 'map', 'manual'
    const [orderingForSomeoneElse, setOrderingForSomeoneElse] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        // If user has no saved addresses, default to manual
        if (userId) {
            checkSavedAddresses();
        } else {
            setAddressMode('manual');
        }
    }, [userId]);

    const checkSavedAddresses = async () => {
        try {
            const response = await fetch(`/api/address/user/${userId}`);
            const addresses = await response.json();
            if (addresses.length === 0) {
                setAddressMode('manual');
            }
        } catch (error) {
            console.error('Failed to check saved addresses:', error);
            setAddressMode('manual');
        }
    };

    const handleAddressSelect = (address) => {
        const finalAddress = {
            ...address,
            recipientName: orderingForSomeoneElse ? recipientName : null
        };
        setSelectedAddress(finalAddress);
        onAddressSelected(finalAddress);
    };

    return (
        <div className={css.addressSelection}>
            <h3 className={css.title}>Select Delivery Address</h3>

            {/* Address Mode Selection */}
            <div className={css.addressModeTabs}>
                {userId && (
                    <button
                        className={addressMode === 'saved' ? css.active : ''}
                        onClick={() => setAddressMode('saved')}
                    >
                        💾 Saved Addresses
                    </button>
                )}
                <button
                    className={addressMode === 'map' ? css.active : ''}
                    onClick={() => setAddressMode('map')}
                >
                    📍 Use Google Map
                </button>
                <button
                    className={addressMode === 'manual' ? css.active : ''}
                    onClick={() => setAddressMode('manual')}
                >
                    ✍️ Enter Manually
                </button>
            </div>

            {/* Order for Someone Else Checkbox */}
            <div className={css.orderForSomeoneElse}>
                <label className={css.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={orderingForSomeoneElse}
                        onChange={(e) => setOrderingForSomeoneElse(e.target.checked)}
                    />
                    <span>☑ Ordering for someone else</span>
                </label>

                <AnimatePresence>
                    {orderingForSomeoneElse && (
                        <motion.div
                            className={css.recipientName}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <input
                                type="text"
                                placeholder="Recipient Name (Optional)"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                            />
                            <small>You can order for family or friends in Mahalingapura.</small>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Address Input Based on Mode */}
            <div className={css.addressInputArea}>
                <AnimatePresence mode="wait">
                    {addressMode === 'saved' && userId && (
                        <motion.div
                            key="saved"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <SavedAddressesList
                                userId={userId}
                                onSelect={handleAddressSelect}
                            />
                        </motion.div>
                    )}

                    {addressMode === 'map' && (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <GoogleMapPicker
                                onLocationSelect={handleAddressSelect}
                            />
                        </motion.div>
                    )}

                    {addressMode === 'manual' && (
                        <motion.div
                            key="manual"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <ManualAddressForm
                                onSubmit={handleAddressSelect}
                                initialAddress={initialAddress}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Address Preview */}
            <AnimatePresence>
                {selectedAddress && (
                    <motion.div
                        className={css.selectedAddressPreview}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <h4>✅ Delivery Address:</h4>
                        <p>{selectedAddress.fullAddress || selectedAddress.googleFormattedAddress}</p>
                        {selectedAddress.recipientName && (
                            <p><strong>Recipient:</strong> {selectedAddress.recipientName}</p>
                        )}
                        <small>📍 {selectedAddress.latitude?.toFixed(4)}, {selectedAddress.longitude?.toFixed(4)}</small>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddressSelection;
