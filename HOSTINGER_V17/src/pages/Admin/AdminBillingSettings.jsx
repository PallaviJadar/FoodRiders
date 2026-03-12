import React, { useState, useEffect } from 'react';
import css from './AdminBillingSettings.module.css';
import AdminLayout from './AdminLayout';

const AdminBillingSettings = () => {
    const [settings, setSettings] = useState({
        // Platform Fee
        platformFee: { enabled: true, amount: 5 },

        // Packaging
        packagingFee: {
            mode: 'fixed', // 'fixed' or 'per100'
            fixedAmount: 2,
            per100Amount: 2
        },

        // Delivery
        deliveryFee: {
            mode: 'slabs', // 'flat' or 'slabs'
            flatAmount: 30,
            slabs: [
                { minKm: 0, maxKm: 4, charge: 30 },
                { minKm: 4, maxKm: 5, charge: 40 },
                { minKm: 5, maxKm: 6, charge: 50 },
                { minKm: 6, maxKm: 7, charge: 60 }
            ]
        },

        // Payment Methods
        isCodEnabled: true,
        isUpiEnabled: true,
        isRazorpayEnabled: true,
        upiId: 'foodriders@ybl',
        qrImageUrl: '/images/QR.jpg.jpeg',
        paymentPhone: '9876543210',

        // Tips
        tipsEnabled: true,
        tipPresets: [10, 20, 30],

        // Free Delivery
        freeDelivery: {
            firstOrderFree: true,
            minOrderValue: 300
        },

        // Notifications
        notificationAlerts: {
            whatsappEnabled: true,
            smsEnabled: true,
            emailEnabled: true,
            adminPhone: '',
            backupPhone: '',
            adminEmail: ''
        }
    });

    const [extraCharges, setExtraCharges] = useState([]);
    const [extraChargesEnabled, setExtraChargesEnabled] = useState(false);
    const [ecEditModal, setEcEditModal] = useState({ isOpen: false, charge: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrPreview, setQrPreview] = useState(settings.qrImageUrl);
    const [qrFile, setQrFile] = useState(null);

    // Load initial settings
    useEffect(() => {
        const loadAll = async () => {
            await fetchSettings();
            await fetchExtraCharges();
            setLoading(false);
        };
        loadAll();
    }, []);

    const fetchExtraCharges = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/extra-charges', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExtraChargesEnabled(data.systemEnabled || false);
                setExtraCharges(data.charges || []);
            }
        } catch (e) {
            console.error("Extra charges fetch failed", e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/payment-settings', { headers: { 'Cache-Control': 'no-cache' } });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // Merge with default/existing state to prevent undefined errors
            setSettings(prev => ({
                ...prev,
                ...data,
                platformFee: data.platformFee || prev.platformFee,
                packagingFee: data.packagingFee || prev.packagingFee,
                deliveryFee: data.deliveryFee || prev.deliveryFee,
                freeDelivery: data.freeDelivery || prev.freeDelivery,
                notificationAlerts: data.notificationAlerts || prev.notificationAlerts
            }));

            if (data.qrImageUrl) setQrPreview(data.qrImageUrl);
        } catch (err) {
            console.error("Billing settings fetch failed", err);
        }
    };

    // Calculate Preview
    const calculatePreview = () => {
        const subtotal = 500; // Sample order value
        let delivery = 0;
        let platform = 0;
        let packaging = 0;
        let tip = 0;
        let extra = 0;

        // Delivery
        if (settings.deliveryFee.mode === 'flat') {
            delivery = settings.deliveryFee.flatAmount;
        } else {
            // Sample distance: 4.5km
            const dist = 4.5;
            const slab = settings.deliveryFee.slabs.find(s => dist >= s.minKm && dist < s.maxKm);
            delivery = slab ? slab.charge : 30;
        }

        // Platform
        if (settings.platformFee.enabled) {
            platform = settings.platformFee.amount;
        }

        // Packaging
        if (settings.packagingFee.mode === 'fixed') {
            packaging = settings.packagingFee.fixedAmount;
        } else {
            packaging = (subtotal / 100) * settings.packagingFee.per100Amount;
        }

        // Tips
        if (settings.tipsEnabled && settings.tipPresets.length > 0) {
            tip = settings.tipPresets[0];
        }

        // Extra Charges
        if (extraChargesEnabled) {
            extraCharges.forEach(c => {
                if (c.enabled) {
                    if (c.type === 'fixed') extra += c.amount;
                    else {
                        const base = c.applyTo === 'all' ? subtotal : delivery;
                        extra += (base * c.amount / 100);
                    }
                }
            });
        }

        const total = subtotal + delivery + platform + packaging + tip + extra;
        return {
            subtotal,
            delivery: Math.round(delivery),
            platform,
            packaging: Math.round(packaging),
            tip,
            extra: Math.round(extra),
            total: Math.round(total)
        };
    };

    const preview = calculatePreview();

    // Handlers
    const handleSave = async () => {
        if (!window.confirm('⚠️ Changes will apply to NEW orders only. Continue?')) return;
        setSaving(true);
        try {
            // Upload QR if changed
            let finalQrUrl = settings.qrImageUrl;
            if (qrFile) {
                const formData = new FormData();
                formData.append('image', qrFile);
                const uploadRes = await fetch('/api/payment-settings/upload-qr', {
                    method: 'POST',
                    body: formData
                });
                if (uploadRes.ok) {
                    const upData = await uploadRes.json();
                    finalQrUrl = upData.url;
                }
            }

            // Save Settings
            const res = await fetch('/api/payment-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, qrImageUrl: finalQrUrl })
            });

            if (res.ok) alert('Settings saved successfully!');
            else alert('Failed to save settings.');
        } catch (err) {
            alert('Error saving settings.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Slab Helpers
    const addSlab = () => {
        setSettings(prev => ({
            ...prev,
            deliveryFee: {
                ...prev.deliveryFee,
                slabs: [...prev.deliveryFee.slabs, { minKm: 0, maxKm: 0, charge: 0 }]
            }
        }));
    };

    const removeSlab = (index) => {
        setSettings(prev => ({
            ...prev,
            deliveryFee: {
                ...prev.deliveryFee,
                slabs: prev.deliveryFee.slabs.filter((_, i) => i !== index)
            }
        }));
    };

    const updateSlab = (index, field, value) => {
        const newSlabs = [...settings.deliveryFee.slabs];
        newSlabs[index][field] = parseFloat(value) || 0;
        setSettings(prev => ({
            ...prev,
            deliveryFee: {
                ...prev.deliveryFee,
                slabs: newSlabs
            }
        }));
    };

    // Extra Charges Handlers
    const toggleExtraSystem = async (enabled) => {
        if (enabled && !window.confirm('⚠️ Enable Extra Charges System for NEW orders?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch('/api/admin/extra-charges/system', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ enabled })
            });
            setExtraChargesEnabled(enabled);
        } catch (e) { alert('Failed to update system'); }
    };

    const toggleCharge = async (id, enabled) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/admin/extra-charges/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ enabled })
            });
            setExtraCharges(prev => prev.map(c => c.id === id ? { ...c, enabled } : c));
        } catch (e) { alert('Failed to toggle charge'); }
    };

    const saveChargeEdit = async () => {
        if (!ecEditModal.charge) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/extra-charges/${ecEditModal.charge.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    type: ecEditModal.charge.type,
                    amount: ecEditModal.charge.amount,
                    applyTo: ecEditModal.charge.applyTo,
                    timeRange: ecEditModal.charge.timeRange
                })
            });
            if (res.ok) {
                setExtraCharges(prev => prev.map(c => c.id === ecEditModal.charge.id ? ecEditModal.charge : c));
                setEcEditModal({ isOpen: false, charge: null });
            }
        } catch (e) { alert('Failed to save charge'); }
    };

    if (loading) return <AdminLayout><div className={css.container}><div className={css.loading}>Loading settings...</div></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <h1>💰 Billing & Fees Management</h1>
                    <p className={css.warning}>⚠️ Changes apply to NEW orders only</p>
                </div>

                <div className={css.grid}>
                    {/* LEFT COLUMN */}
                    <div className={css.leftColumn}>

                        {/* SECTION: FEES & CHARGES */}
                        <div className={css.sectionTitle} style={{ fontWeight: '700', color: '#888' }}>PLATFORM & PACKAGING</div>

                        {/* Platform Fee */}
                        <div className={css.card}>
                            <div className={css.cardHeader}>
                                <div><h3>💵 Platform Fee</h3><p>Small service charge per order</p></div>
                                <label className={css.toggle}>
                                    <input type="checkbox" checked={settings.platformFee.enabled} onChange={(e) => setSettings(prev => ({ ...prev, platformFee: { ...prev.platformFee, enabled: e.target.checked } }))} />
                                    <span className={css.slider}></span>
                                </label>
                            </div>
                            {settings.platformFee.enabled && (
                                <div className={css.inputGroup}>
                                    <label>Amount (₹)</label>
                                    <input type="number" value={settings.platformFee.amount} onChange={(e) => setSettings(prev => ({ ...prev, platformFee: { ...prev.platformFee, amount: parseFloat(e.target.value) || 0 } }))} className={css.input} />
                                </div>
                            )}
                        </div>

                        {/* Packaging */}
                        <div className={css.card}>
                            <h3>📦 Packaging Charge</h3>
                            <div className={css.radioGroup}>
                                <label className={css.radio}><input type="radio" checked={settings.packagingFee.mode === 'fixed'} onChange={() => setSettings(prev => ({ ...prev, packagingFee: { ...prev.packagingFee, mode: 'fixed' } }))} /><span>Fixed Amount</span></label>
                                <label className={css.radio}><input type="radio" checked={settings.packagingFee.mode === 'per100'} onChange={() => setSettings(prev => ({ ...prev, packagingFee: { ...prev.packagingFee, mode: 'per100' } }))} /><span>Per ₹100 Value</span></label>
                            </div>
                            <div className={css.inputGroup}>
                                <label>{settings.packagingFee.mode === 'fixed' ? 'Fixed (₹)' : 'Per ₹100 (₹)'}</label>
                                <input type="number" value={settings.packagingFee.mode === 'fixed' ? settings.packagingFee.fixedAmount : settings.packagingFee.per100Amount} onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setSettings(prev => ({
                                        ...prev, packagingFee: {
                                            ...prev.packagingFee,
                                            fixedAmount: settings.packagingFee.mode === 'fixed' ? val : prev.packagingFee.fixedAmount,
                                            per100Amount: settings.packagingFee.mode === 'per100' ? val : prev.packagingFee.per100Amount
                                        }
                                    }))
                                }} className={css.input} />
                            </div>
                        </div>

                        <div className={css.sectionTitle} style={{ fontWeight: '700', color: '#888' }}>DELIVERY & LOGISTICS</div>

                        {/* Delivery */}
                        <div className={css.card}>
                            <h3>🏍️ Delivery Charges</h3>
                            <div className={css.radioGroup}>
                                <label className={css.radio}><input type="radio" checked={settings.deliveryFee.mode === 'flat'} onChange={() => setSettings(prev => ({ ...prev, deliveryFee: { ...prev.deliveryFee, mode: 'flat' } }))} /><span>Flat Rate</span></label>
                                <label className={css.radio}><input type="radio" checked={settings.deliveryFee.mode === 'slabs'} onChange={() => setSettings(prev => ({ ...prev, deliveryFee: { ...prev.deliveryFee, mode: 'slabs' } }))} /><span>KM Based Slabs</span></label>
                            </div>
                            {settings.deliveryFee.mode === 'flat' ? (
                                <div className={css.inputGroup}>
                                    <label>Flat Charge (₹)</label>
                                    <input type="number" value={settings.deliveryFee.flatAmount} onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: { ...prev.deliveryFee, flatAmount: parseFloat(e.target.value) || 0 } }))} className={css.input} />
                                </div>
                            ) : (
                                <div className={css.slabsTable}>
                                    {settings.deliveryFee.slabs.map((slab, index) => (
                                        <div key={index} className={css.slabRow} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                                            <input type="number" value={slab.minKm} onChange={(e) => updateSlab(index, 'minKm', e.target.value)} className={css.slabInput} placeholder="Min" style={{ width: '60px' }} />
                                            <span>to</span>
                                            <input type="number" value={slab.maxKm} onChange={(e) => updateSlab(index, 'maxKm', e.target.value)} className={css.slabInput} placeholder="Max" style={{ width: '60px' }} />
                                            <span>km: ₹</span>
                                            <input type="number" value={slab.charge} onChange={(e) => updateSlab(index, 'charge', e.target.value)} className={css.slabInput} placeholder="₹" style={{ width: '80px' }} />
                                            <button onClick={() => removeSlab(index)} className={css.deleteBtn} style={{ color: 'red' }}>×</button>
                                        </div>
                                    ))}
                                    <button onClick={addSlab} className={css.addBtn} style={{ marginTop: '10px' }}>+ Add Slab</button>
                                </div>
                            )}
                        </div>

                        {/* Extra Charges (Merged) */}
                        <div className={css.card} style={{ borderColor: '#8e44ad' }}>
                            <div className={css.cardHeader}>
                                <div><h3>⚡ Smart Extra Charges</h3><p>Rain, Surge, Night fees</p></div>
                                <label className={css.toggle}>
                                    <input type="checkbox" checked={extraChargesEnabled} onChange={(e) => toggleExtraSystem(e.target.checked)} />
                                    <span className={css.slider}></span>
                                </label>
                            </div>
                            {extraChargesEnabled && (
                                <div className={css.extraList}>
                                    {extraCharges.map(c => (
                                        <div key={c.id} className={css.extraItem} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                                            <div className={css.extraInfo}>
                                                <span style={{ fontWeight: '600' }}>{c.icon} {c.name}</span>
                                                <p><small>{c.type === 'fixed' ? `₹${c.amount}` : `${c.amount}%`}</small></p>
                                            </div>
                                            <div className={css.extraActions} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <button onClick={() => setEcEditModal({ isOpen: true, charge: { ...c } })} className={css.editBtn} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                                                <label className={css.toggle} style={{ transform: 'scale(0.8)' }}>
                                                    <input type="checkbox" checked={c.enabled} onChange={(e) => toggleCharge(c.id, e.target.checked)} />
                                                    <span className={css.slider}></span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={css.sectionTitle} style={{ fontWeight: '700', color: '#888' }}>PAYMENT & OFFERS</div>

                        {/* Payment */}
                        <div className={css.card}>
                            <h3>💳 Payment Methods</h3>
                            <div className={css.toggleRow}>
                                <span>COD</span>
                                <label className={css.toggle}><input type="checkbox" checked={settings.isCodEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isCodEnabled: e.target.checked }))} /><span className={css.slider}></span></label>
                            </div>
                            <div className={css.toggleRow}>
                                <span>UPI Manual</span>
                                <label className={css.toggle}><input type="checkbox" checked={settings.isUpiEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isUpiEnabled: e.target.checked }))} /><span className={css.slider}></span></label>
                            </div>
                            <div className={css.toggleRow}>
                                <span>Razorpay (Online)</span>
                                <label className={css.toggle}><input type="checkbox" checked={settings.isRazorpayEnabled} onChange={(e) => setSettings(prev => ({ ...prev, isRazorpayEnabled: e.target.checked }))} /><span className={css.slider}></span></label>
                            </div>
                            {settings.isUpiEnabled && (
                                <div className={css.inputGroup}>
                                    <label>UPI ID</label>
                                    <input type="text" value={settings.upiId} onChange={(e) => setSettings(prev => ({ ...prev, upiId: e.target.value }))} className={css.input} />

                                    <div style={{ marginTop: '10px' }}>
                                        <label>Mobile Number (for UPI Apps)</label>
                                        <input type="text" value={settings.paymentPhone} onChange={(e) => setSettings(prev => ({ ...prev, paymentPhone: e.target.value }))} className={css.input} placeholder="Enter 10-digit number" />
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <label>QR Code</label>
                                        <input type="file" onChange={handleQrChange} className={css.fileInput} />
                                        {qrPreview && <img src={qrPreview} className={css.qrPreview} style={{ width: '100px', marginTop: '5px' }} />}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Free Delivery */}
                        <div className={css.card}>
                            <h3>🎁 Free Delivery Rules</h3>
                            <label className={css.checkbox}><input type="checkbox" checked={settings.freeDelivery.firstOrderFree} onChange={(e) => setSettings(prev => ({ ...prev, freeDelivery: { ...prev.freeDelivery, firstOrderFree: e.target.checked } }))} /> <span>First Order Free</span></label>
                            <div style={{ marginTop: '10px' }}>
                                <label className={css.checkbox}><input type="checkbox" checked={settings.freeDelivery.minOrderValue > 0} onChange={(e) => setSettings(prev => ({ ...prev, freeDelivery: { ...prev.freeDelivery, minOrderValue: e.target.checked ? 300 : 0 } }))} /> <span>Free Above Order Value</span></label>
                                {settings.freeDelivery.minOrderValue > 0 && <input type="number" value={settings.freeDelivery.minOrderValue} onChange={(e) => setSettings(prev => ({ ...prev, freeDelivery: { ...prev.freeDelivery, minOrderValue: parseFloat(e.target.value) || 0 } }))} className={css.input} style={{ marginTop: '5px' }} />}
                            </div>
                        </div>

                        {/* Notification Alerts */}
                        <div className={css.card} style={{ borderColor: '#3498db' }}>
                            <div className={css.cardHeader}>
                                <div>
                                    <h3>🔔 Notification Alerts</h3>
                                    <p>Get notified on New Orders via multiple channels</p>
                                </div>
                            </div>

                            <div className={css.notificationGrid}>
                                {/* WhatsApp Toggle */}
                                <div className={css.notifyToggleRow}>
                                    <div className={css.notifyLabel}>
                                        <span style={{ color: '#25D366' }}>💬</span> WhatsApp
                                    </div>
                                    <label className={css.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationAlerts?.whatsappEnabled}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                notificationAlerts: { ...prev.notificationAlerts, whatsappEnabled: e.target.checked }
                                            }))}
                                        />
                                        <span className={css.slider}></span>
                                    </label>
                                </div>

                                {/* SMS Toggle */}
                                <div className={css.notifyToggleRow}>
                                    <div className={css.notifyLabel}>
                                        <span style={{ color: '#f1c40f' }}>📲</span> SMS Alerts
                                    </div>
                                    <label className={css.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationAlerts?.smsEnabled}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                notificationAlerts: { ...prev.notificationAlerts, smsEnabled: e.target.checked }
                                            }))}
                                        />
                                        <span className={css.slider}></span>
                                    </label>
                                </div>

                                {/* Email Toggle */}
                                <div className={css.notifyToggleRow}>
                                    <div className={css.notifyLabel}>
                                        <span style={{ color: '#e74c3c' }}>📧</span> Email Alerts
                                    </div>
                                    <label className={css.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationAlerts?.emailEnabled}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                notificationAlerts: { ...prev.notificationAlerts, emailEnabled: e.target.checked }
                                            }))}
                                        />
                                        <span className={css.slider}></span>
                                    </label>
                                </div>
                            </div>

                            {(settings.notificationAlerts?.whatsappEnabled || settings.notificationAlerts?.smsEnabled) && (
                                <div className={css.inputGroup} style={{ marginTop: '15px' }}>
                                    <label>Admin Mobile Number (e.g. 919876543210)</label>
                                    <input
                                        type="text"
                                        value={settings.notificationAlerts?.adminPhone}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            notificationAlerts: { ...prev.notificationAlerts, adminPhone: e.target.value }
                                        }))}
                                        className={css.input}
                                        placeholder="91-XXXX-XXXXXX"
                                    />
                                    <small style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>Used for SMS & WhatsApp notifications</small>
                                </div>
                            )}

                            {settings.notificationAlerts?.emailEnabled && (
                                <div className={css.inputGroup} style={{ marginTop: '15px' }}>
                                    <label>Admin Email Address</label>
                                    <input
                                        type="email"
                                        value={settings.notificationAlerts?.adminEmail}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            notificationAlerts: { ...prev.notificationAlerts, adminEmail: e.target.value }
                                        }))}
                                        className={css.input}
                                        placeholder="admin@foodriders.in"
                                    />
                                </div>
                            )}

                            {settings.notificationAlerts?.whatsappEnabled && (
                                <div className={css.inputGroup} style={{ marginTop: '10px' }}>
                                    <label>Backup WhatsApp Number (Optional)</label>
                                    <input
                                        type="text"
                                        value={settings.notificationAlerts?.backupPhone}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            notificationAlerts: { ...prev.notificationAlerts, backupPhone: e.target.value }
                                        }))}
                                        className={css.input}
                                        placeholder="Backup number"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className={css.card}>
                            <div className={css.cardHeader}>
                                <div><h3>💝 Delivery Tips</h3></div>
                                <label className={css.toggle}><input type="checkbox" checked={settings.tipsEnabled} onChange={(e) => setSettings(prev => ({ ...prev, tipsEnabled: e.target.checked }))} /><span className={css.slider}></span></label>
                            </div>
                            {settings.tipsEnabled && (
                                <div className={css.inputGroup}>
                                    <label>Presets (₹)</label>
                                    <div className={css.tipPresets}>
                                        {settings.tipPresets.map((tip, i) => (
                                            <input key={i} type="number" value={tip} onChange={(e) => {
                                                const newPresets = [...settings.tipPresets];
                                                newPresets[i] = parseFloat(e.target.value) || 0;
                                                setSettings(prev => ({ ...prev, tipPresets: newPresets }));
                                            }} className={css.tipInput} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN - Preview */}
                    <div className={css.rightColumn}>
                        <div className={css.previewCard} style={{ position: 'sticky', top: '20px' }}>
                            <h3>📊 Live Bill Preview</h3>
                            <p className={css.previewNote}>Sample order: ₹{preview.subtotal}</p>

                            <div className={css.billPreview}>
                                <div className={css.billRow}><span>Subtotal</span><span>₹{preview.subtotal}</span></div>
                                <div className={css.billRow}><span>Delivery</span><span>₹{preview.delivery}</span></div>
                                <div className={css.billRow}><span>Platform</span><span>₹{preview.platform}</span></div>
                                <div className={css.billRow}><span>Packaging</span><span>₹{preview.packaging}</span></div>
                                {extraChargesEnabled && extraCharges.filter(c => c.enabled).map(c => (
                                    <div key={c.id} className={css.billRow} style={{ color: '#8e44ad' }}>
                                        <span>{c.name}</span>
                                        <span>+{c.type === 'fixed' ? `₹${c.amount}` : `${c.amount}%`}</span>
                                    </div>
                                ))}
                                <div className={css.billRow}><span>Tip</span><span>₹{preview.tip}</span></div>
                                <div className={css.billRow + ' ' + css.total}><span>Total</span><span>₹{preview.total}</span></div>
                            </div>
                            <div className={css.warningBox}><strong>⚠️ Important</strong><p>These changes will only affect NEW orders.</p></div>
                            <button onClick={handleSave} disabled={saving} className={css.saveBtn} style={{ marginTop: '2rem' }}>{saving ? 'Saving...' : '💾 Save All Settings'}</button>
                        </div>
                    </div>
                </div>

                {/* Extra Charge Edit Modal */}
                {ecEditModal.isOpen && (
                    <div className={css.modalOverlay} style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div className={css.modalContent} style={{ background: 'white', padding: '2rem', borderRadius: '12px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Edit {ecEditModal.charge?.name}</h3>
                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Charge Type </label>
                                <select value={ecEditModal.charge?.type} onChange={(e) => setEcEditModal(prev => ({ ...prev, charge: { ...prev.charge, type: e.target.value } }))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                            </div>
                            <div style={{ margin: '1rem 0' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Value </label>
                                <input type="number" value={ecEditModal.charge?.amount} onChange={(e) => setEcEditModal(prev => ({ ...prev, charge: { ...prev.charge, amount: parseFloat(e.target.value) } }))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>

                            {ecEditModal.charge?.type === 'percentage' && (
                                <div style={{ margin: '1rem 0' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Apply Percentage On </label>
                                    <select value={ecEditModal.charge?.applyTo} onChange={(e) => setEcEditModal(prev => ({ ...prev, charge: { ...prev.charge, applyTo: e.target.value } }))} style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}>
                                        <option value="delivery">Delivery Charge</option>
                                        <option value="all">Subtotal (Item Value)</option>
                                    </select>
                                </div>
                            )}

                            {ecEditModal.charge?.id === 'night' && (
                                <div style={{ margin: '1rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Start Time</label>
                                        <input type="time" value={ecEditModal.charge?.timeRange?.start} onChange={(e) => setEcEditModal(prev => ({ ...prev, charge: { ...prev.charge, timeRange: { ...prev.charge.timeRange, start: e.target.value } } }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>End Time</label>
                                        <input type="time" value={ecEditModal.charge?.timeRange?.end} onChange={(e) => setEcEditModal(prev => ({ ...prev, charge: { ...prev.charge, timeRange: { ...prev.charge.timeRange, end: e.target.value } } }))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                                <button onClick={saveChargeEdit} style={{ flex: 1, background: '#2ecc71', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Save Changes</button>
                                <button onClick={() => setEcEditModal({ isOpen: false, charge: null })} style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminBillingSettings;
