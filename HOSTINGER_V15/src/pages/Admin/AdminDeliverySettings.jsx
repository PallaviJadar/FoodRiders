import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminDeliverySettings.module.css';

const AdminDeliverySettings = () => {
    const [settings, setSettings] = useState({
        baseTownDistance: 4,
        maxServiceDistance: 6,
        slabs: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/delivery-settings');
            const data = await res.json();
            if (data) setSettings(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch settings');
            setLoading(false);
        }
    };

    const handleUpdateField = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleUpdateSlab = (index, field, value) => {
        const newSlabs = [...settings.slabs];
        newSlabs[index][field] = field === 'label' ? value : (parseFloat(value) || 0);
        setSettings(prev => ({ ...prev, slabs: newSlabs }));
    };

    const handleAddSlab = () => {
        setSettings(prev => ({
            ...prev,
            slabs: [...prev.slabs, { maxKm: 0, charge: 0, label: '' }]
        }));
    };

    const handleRemoveSlab = (index) => {
        const newSlabs = settings.slabs.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, slabs: newSlabs }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/delivery-settings/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Settings saved successfully!');
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><div className={css.loading}>Loading Settings...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className={css.settingsWrapper}>
                <header className={css.header}>
                    <h2>Delivery Distance Settings</h2>
                    <button className={css.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </header>

                <div className={css.section}>
                    <h3 className={css.sectionTitle}>📏 Distance Constraints</h3>
                    <div className={css.inputGroup}>
                        <div className={css.field}>
                            <label>Base Town Distance (KM)</label>
                            <input
                                type="number"
                                value={settings.baseTownDistance}
                                onChange={(e) => handleUpdateField('baseTownDistance', e.target.value)}
                            />
                        </div>
                        <div className={css.field}>
                            <label>Max Serviceable Distance (KM)</label>
                            <input
                                type="number"
                                value={settings.maxServiceDistance}
                                onChange={(e) => handleUpdateField('maxServiceDistance', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={css.section}>
                    <h3 className={css.sectionTitle}>💰 Dynamic Delivery Slabs</h3>
                    <div className={css.slabList}>
                        {settings.slabs.map((slab, index) => (
                            <div key={index} className={css.slabItem}>
                                <div className={css.field}>
                                    <label>Up to KM</label>
                                    <input
                                        type="number"
                                        value={slab.maxKm}
                                        onChange={(e) => handleUpdateSlab(index, 'maxKm', e.target.value)}
                                    />
                                </div>
                                <div className={css.field}>
                                    <label>Charge (₹)</label>
                                    <input
                                        type="number"
                                        value={slab.charge}
                                        onChange={(e) => handleUpdateSlab(index, 'charge', e.target.value)}
                                    />
                                </div>
                                <div className={css.field}>
                                    <label>Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 4 - 5 KM"
                                        value={slab.label}
                                        onChange={(e) => handleUpdateSlab(index, 'label', e.target.value)}
                                    />
                                </div>
                                <button className={css.removeBtn} onClick={() => handleRemoveSlab(index)}>×</button>
                            </div>
                        ))}
                    </div>
                    <button className={css.addBtn} onClick={handleAddSlab}>+ Add New Slab</button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDeliverySettings;
