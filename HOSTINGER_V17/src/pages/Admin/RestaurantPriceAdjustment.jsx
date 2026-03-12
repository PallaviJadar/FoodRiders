import React, { useState, useEffect } from 'react';
import css from './RestaurantPriceAdjustment.module.css';

const RestaurantPriceAdjustment = ({ restaurant, onUpdate }) => {
    const [config, setConfig] = useState({
        enabled: restaurant.priceAdjustment?.enabled || false,
        type: restaurant.priceAdjustment?.type || 'percentage',
        value: restaurant.priceAdjustment?.value || 0,
        applyTo: restaurant.priceAdjustment?.applyTo || 'all',
        targetCategories: restaurant.priceAdjustment?.targetCategories || []
    });
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (restaurant.categories) {
            setCategories(restaurant.categories.map(c => c.name));
        }
    }, [restaurant]);

    const handleSave = async () => {
        // Validation
        if (config.type === 'percentage') {
            if (config.value > 20) return alert('Max percentage allowed is +20%');
            if (config.value < -20) return alert('Min percentage allowed is -20%');
        } else {
            if (config.value > 50) return alert('Max fixed amount is +₹50');
            if (config.value < -50) return alert('Min fixed amount is -₹50');
        }

        if (config.value < 0 && !window.confirm('You are decreasing prices. Are you sure?')) {
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/restaurants/${restaurant._id}/price-adjustment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                const updated = await res.json();
                onUpdate(updated);
                alert('✅ Price settings updated successfully!');
            } else {
                alert('Failed to update settings');
            }
        } catch (err) {
            alert('Connection error');
        } finally {
            setSaving(false);
        }
    };

    // Calculate preview for a sample item
    const getPreview = (basePrice) => {
        let adjusted = basePrice;
        if (config.type === 'percentage') {
            adjusted = basePrice + (basePrice * config.value / 100);
        } else {
            adjusted = basePrice + config.value;
        }
        return Math.round(adjusted);
    };

    return (
        <div className={css.adjustmentWrapper}>
            <div className={css.sectionHeader}>
                <div className={css.titleBox}>
                    <h3>🏷️ Price Adjustment</h3>
                    <p>Adjust all menu prices dynamically without manual editing</p>
                </div>
                <label className={css.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                    />
                    <span className={css.slider}></span>
                </label>
            </div>

            <div className={`${css.configForm} ${!config.enabled ? css.disabled : ''}`}>
                <div className={css.formGroup}>
                    <label>Adjustment Type</label>
                    <div className={css.radioGroup}>
                        <button
                            className={config.type === 'percentage' ? css.active : ''}
                            onClick={() => setConfig({ ...config, type: 'percentage' })}
                        >
                            Percentage (%)
                        </button>
                        <button
                            className={config.type === 'fixed' ? css.active : ''}
                            onClick={() => setConfig({ ...config, type: 'fixed' })}
                        >
                            Fixed Amount (₹)
                        </button>
                    </div>
                </div>

                <div className={css.formGroup}>
                    <label>
                        Adjustment Value
                        <span className={css.hint}>
                            {config.type === 'percentage' ? '(Max +20%)' : '(Max +₹50)'}
                        </span>
                    </label>
                    <div className={css.inputWithUnit}>
                        <span className={css.unit}>{config.type === 'percentage' ? '%' : '₹'}</span>
                        <input
                            type="number"
                            value={config.value}
                            onChange={e => setConfig({ ...config, value: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className={css.previewPanel}>
                    <div className={css.previewHeader}>Calculation Preview</div>
                    <div className={css.previewItem}>
                        <div className={css.previewInfo}>
                            <span className={css.itemName}>Sample Item</span>
                            <span className={css.basePrice}>Base: ₹100</span>
                        </div>
                        <div className={css.arrow}>→</div>
                        <div className={css.adjustedPrice}>
                            Adjusted: ₹{getPreview(100)}
                            <span className={css.diff}>
                                ({config.value > 0 ? '+' : ''}{config.value}{config.type === 'percentage' ? '%' : ''})
                            </span>
                        </div>
                    </div>
                    <p className={css.disclaimer}>⚠️ Applied only to NEW orders. Real-time update for users.</p>
                </div>

                <div className={css.auditLog}>
                    {restaurant.priceAdjustment?.lastModified && (
                        <div className={css.logInfo}>
                            Last changed by <strong>{restaurant.priceAdjustment.lastModified.by}</strong>
                            &nbsp;on {new Date(restaurant.priceAdjustment.lastModified.at).toLocaleString()}
                        </div>
                    )}
                </div>

                <button
                    className={css.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default RestaurantPriceAdjustment;
