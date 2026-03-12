import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminPaymentSettings.module.css';
import { useImageCompression } from '../../utils/imageCompressor';

const AdminPaymentSettings = () => {
    const [settings, setSettings] = useState({
        isCodEnabled: true,
        isUpiEnabled: true,
        isRazorpayEnabled: true,
        upiId: '',
        upiName: '',
        qrImageUrl: '',
        autoCancelMinutes: 15
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { compressImage, isCompressing } = useImageCompression();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/payment-settings', { headers: { 'Cache-Control': 'no-cache' } });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);

        try {
            // High quality (0.9) for QR codes to ensure scanability
            const result = await compressImage(file, { quality: 0.9 });
            const formData = new FormData();
            formData.append('image', result.file);

            const res = await fetch('/api/payment-settings/upload-qr', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, qrImageUrl: data.url }));
            } else {
                alert('Upload failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/payment-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert('Payment settings updated successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (err) {
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout><div style={{ padding: '2rem' }}>Loading settings...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <h2>Payment Configuration</h2>
                    <p>Manage how users pay for their orders</p>
                </div>

                <div className={css.card}>
                    <div className={css.cardTitle}>Payment Methods</div>

                    <div className={css.toggleRow}>
                        <span className={css.toggleLabel}>Cash on Delivery (COD)</span>
                        <label className={css.switch}>
                            <input
                                type="checkbox"
                                name="isCodEnabled"
                                checked={settings.isCodEnabled}
                                onChange={handleChange}
                            />
                            <span className={css.slider}></span>
                        </label>
                    </div>

                    <div className={css.toggleRow}>
                        <span className={css.toggleLabel}>Online UPI Payment (Manual)</span>
                        <label className={css.switch}>
                            <input
                                type="checkbox"
                                name="isUpiEnabled"
                                checked={settings.isUpiEnabled}
                                onChange={handleChange}
                            />
                            <span className={css.slider}></span>
                        </label>
                    </div>

                    <div className={css.toggleRow}>
                        <span className={css.toggleLabel}>Razorpay (Automatic Online)</span>
                        <label className={css.switch}>
                            <input
                                type="checkbox"
                                name="isRazorpayEnabled"
                                checked={settings.isRazorpayEnabled}
                                onChange={handleChange}
                            />
                            <span className={css.slider}></span>
                        </label>
                    </div>
                </div>

                {settings.isUpiEnabled && (
                    <div className={css.card}>
                        <div className={css.cardTitle}>UPI Settings (Manual Flow)</div>

                        <div className={css.formGroup}>
                            <label className={css.label}>Merchant UPI ID (VPA)</label>
                            <input
                                type="text"
                                className={css.input}
                                name="upiId"
                                value={settings.upiId}
                                onChange={handleChange}
                                placeholder="e.g. foodriders@ybl"
                            />
                        </div>

                        <div className={css.formGroup}>
                            <label className={css.label}>Payee Name</label>
                            <input
                                type="text"
                                className={css.input}
                                name="upiName"
                                value={settings.upiName}
                                onChange={handleChange}
                                placeholder="e.g. FoodRiders Mahalingapura"
                            />
                        </div>

                        <div className={css.formGroup}>
                            <label className={css.label}>QR Code Image URL</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input
                                    type="text"
                                    className={css.input}
                                    name="qrImageUrl"
                                    value={settings.qrImageUrl}
                                    onChange={handleChange}
                                    placeholder="/images/QR.jpg"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUpload}
                                        disabled={uploading || isCompressing}
                                    />
                                    {(uploading || isCompressing) && <span>{isCompressing ? 'Optimizing QR...' : 'Uploading...'}</span>}
                                </div>
                            </div>
                            {settings.qrImageUrl && (
                                <img src={settings.qrImageUrl} alt="QR Preview" className={css.previewQr} onError={(e) => e.target.style.display = 'none'} />
                            )}
                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                                You can upload a new image or paste a URL manually.
                            </p>
                        </div>

                        <div className={css.formGroup}>
                            <label className={css.label}>Auto-Cancel Unpaid Orders After (Minutes)</label>
                            <input
                                type="number"
                                className={css.input}
                                name="autoCancelMinutes"
                                value={settings.autoCancelMinutes}
                                onChange={handleChange}
                                min="5"
                                max="60"
                            />
                        </div>
                    </div>
                )}

                <button className={css.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </AdminLayout>
    );
};

export default AdminPaymentSettings;
