import React, { useState, useEffect } from 'react';
import css from './AdminPopupManager.module.css';
import AdminLayout from './AdminLayout';
import { useImageCompression } from '../../utils/imageCompressor';

const AdminPopupManager = () => {
    const [popups, setPopups] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const { compressImage, isCompressing } = useImageCompression();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ctaText: '',
        ctaLink: '',
        phoneNumber: '',
        whatsappNumber: '',
        websiteUrl: '',
        duration: 10,
        frequency: 'every_refresh',
        startDate: '',
        endDate: '',
        isActive: true,
        image: null,
        priority: 5,
        customInterval: 60,
        allowManualClose: true
    });

    const [showContactOptions, setShowContactOptions] = useState(false);

    // Helper to get admin token
    const getAdminToken = () => {
        return localStorage.getItem('adminToken');
    };

    const fetchPopups = async () => {
        try {
            const res = await fetch('/api/popups/admin', {
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Popup Fetch Error: Non-JSON Response", text);
                return;
            }

            if (res.ok && data.success) {
                setPopups(data.data || []);
            } else {
                console.error("Failed to load popups:", data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleChange = async (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            if (files && files[0]) {
                const result = await compressImage(files[0]);
                setFormData(prev => ({ ...prev, image: result.file }));
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleToggleActive = () => {
        setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            ctaText: '',
            ctaLink: '',
            phoneNumber: '',
            whatsappNumber: '',
            websiteUrl: '',
            duration: 10,
            frequency: 'every_refresh',
            startDate: '',
            endDate: '',
            isActive: true,
            image: null,
            priority: 5,
            customInterval: 60,
            allowManualClose: true
        });
        setEditingId(null);
        setShowContactOptions(false);
        // Clear file input manually if needed
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = "";
    };

    const handleEdit = (popup) => {
        setEditingId(popup._id);
        setFormData({
            ...popup,
            image: null, // Don't prefill file input
            startDate: popup.startDate ? popup.startDate.split('T')[0] : '',
            endDate: popup.endDate ? popup.endDate.split('T')[0] : '',
            phoneNumber: popup.phoneNumber || '',
            whatsappNumber: popup.whatsappNumber || '',
            websiteUrl: popup.websiteUrl || '',
            priority: popup.priority || 5,
            frequency: popup.frequency || 'every_refresh',
            customInterval: popup.customInterval || 60,
            allowManualClose: popup.allowManualClose !== undefined ? popup.allowManualClose : true
        });

        if (popup.phoneNumber || popup.whatsappNumber || popup.websiteUrl) {
            setShowContactOptions(true);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/popups/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getAdminToken()}` }
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    fetchPopups();
                } else {
                    alert("Delete failed: " + data.message);
                }
            } catch (e) {
                alert("Server Error during delete. Please try again.");
            }
        } catch (err) { alert("Failed to delete"); }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            alert("Title is required");
            return false;
        }
        // Check if image OR description is present
        // Note: image might be null in state but present if editing (we don't check prev image here easily, so we rely on backend or loose check)
        // If it's a new popup (no editingId) and no image file AND no description => fail
        if (!editingId && !formData.image && !formData.description.trim()) {
            alert("Please provide either a Promo Image or a Description.");
            return false;
        }

        if (parseInt(formData.priority) < 1 || parseInt(formData.priority) > 10) {
            alert("Priority must be between 1 and 10");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'image') {
                if (formData[key]) data.append(key, formData[key]);
                return;
            }
            if (['priority', 'customInterval', 'duration'].includes(key)) {
                data.append(key, parseInt(formData[key]) || 0);
            } else if (key === 'allowManualClose') {
                data.append(key, String(formData[key]));
            } else {
                data.append(key, formData[key] === null ? '' : formData[key]);
            }
        });

        try {
            const url = editingId
                ? `/api/popups/admin/${editingId}`
                : '/api/popups/admin';

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${getAdminToken()}` },
                body: data
            });

            // STRICT JSON PARSING (MANDATORY FIX)
            const text = await res.text();
            let resData;

            try {
                resData = JSON.parse(text);
            } catch (e) {
                // Formatting failed - likely server crash or HTML 500
                console.error("Non-JSON Server Response:", text);
                throw new Error("Server error, please try again later.");
            }

            if (res.ok && resData.success) {
                alert(resData.message || (editingId ? "Popup updated" : "Popup created"));
                fetchPopups();
                resetForm();
            } else {
                // Show readable error from backend
                alert(`Error: ${resData.message || "Operation failed"}`);
                console.error("Popup Error Details:", resData);
            }
        } catch (err) {
            console.error("Submission Error:", err);
            if (err.message.includes("Unexpected token") || err.message.includes("JSON")) {
                alert("Server Error. Please hit refresh and try again.");
            } else {
                alert(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <h1>Popup Announcements</h1>
                    <p>Manage promotional popups shown to visitors.</p>
                </div>

                <div className={css.contentGrid}>
                    {/* Editor Column */}
                    <div className={css.card}>
                        <div className={css.cardTitle}>
                            {editingId ? "Edit Popup" : "Create New Popup"}
                            {editingId && <button onClick={resetForm} className={css.editBtn}>Cancel</button>}
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={css.formGroup}>
                                <div className={css.toggleWrapper}>
                                    <label className={css.label} style={{ marginBottom: 0 }}>Status:</label>
                                    <div
                                        className={`${css.switch} ${formData.isActive ? css.active : ''}`}
                                        onClick={handleToggleActive}
                                    >
                                        <div className={css.slider}></div>
                                    </div>
                                    <span className={`${css.statusLabel} ${formData.isActive ? css.on : css.off}`}>
                                        {formData.isActive ? "Active" : "Paused"}
                                    </span>
                                </div>
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Title (Required)</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={css.input}
                                    required
                                    placeholder="Summer Sale!"
                                />
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Promo Image</label>
                                <input
                                    type="file"
                                    id="fileInput"
                                    name="image"
                                    onChange={handleChange}
                                    className={css.input}
                                    accept="image/*"
                                />
                                <small style={{ color: '#666', fontSize: '0.8rem' }}>Either Image or Description is required.</small>
                            </div>

                            <div className={css.formGroup}>
                                <label className={css.label}>Description (Short)</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={css.textarea}
                                    placeholder="Get 50% off on all orders..."
                                />
                            </div>

                            {/* Contact Options Section */}
                            <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setShowContactOptions(!showContactOptions)}>
                                    <input
                                        type="checkbox"
                                        checked={showContactOptions}
                                        readOnly
                                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Add Contact Options (Phone / WhatsApp / Web)</span>
                                </div>

                                {showContactOptions && (
                                    <>
                                        <div className={css.formGroup}>
                                            <label className={css.label}>📞 Phone Number (Digits only)</label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className={css.input}
                                                placeholder="9876543210"
                                            />
                                        </div>
                                        <div className={css.formGroup}>
                                            <label className={css.label}>💬 WhatsApp Number (Digits only)</label>
                                            <input
                                                type="text"
                                                name="whatsappNumber"
                                                value={formData.whatsappNumber}
                                                onChange={handleChange}
                                                className={css.input}
                                                placeholder="9876543210"
                                            />
                                        </div>
                                        <div className={css.formGroup}>
                                            <label className={css.label}>🌐 Website URL</label>
                                            <input
                                                type="text"
                                                name="websiteUrl"
                                                value={formData.websiteUrl}
                                                onChange={handleChange}
                                                className={css.input}
                                                placeholder="https://example.com"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className={css.formGroup} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>CTA Text (Button)</label>
                                    <input
                                        type="text"
                                        name="ctaText"
                                        value={formData.ctaText}
                                        onChange={handleChange}
                                        className={css.input}
                                        placeholder="Order Now"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>CTA Link</label>
                                    <input
                                        type="text"
                                        name="ctaLink"
                                        value={formData.ctaLink}
                                        onChange={handleChange}
                                        className={css.input}
                                        placeholder="/menu"
                                    />
                                </div>
                            </div>

                            <div className={css.formGroup} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>Display Priority (1-10)</label>
                                    <input
                                        type="number"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className={css.input}
                                        min="1" max="10"
                                    />
                                    <small style={{ fontSize: '0.75rem', color: '#666' }}>Higher number shows first.</small>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>Allow Manual Close</label>
                                    <select
                                        name="allowManualClose"
                                        value={formData.allowManualClose}
                                        onChange={(e) => setFormData(prev => ({ ...prev, allowManualClose: e.target.value === 'true' }))}
                                        className={css.select}
                                    >
                                        <option value="true">Yes, User can close</option>
                                        <option value="false">No, Force wait</option>
                                    </select>
                                </div>
                            </div>

                            <div className={css.formGroup} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label className={css.label}>Display Mode</label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        className={css.select}
                                    >
                                        <option value="every_refresh">Every Refresh (Default)</option>
                                        <option value="session">Once per Session</option>
                                        <option value="day">Once per Day</option>
                                        <option value="once_ever">Once Ever</option>
                                        <option value="custom">Custom Interval</option>
                                    </select>
                                </div>

                                {formData.frequency === 'custom' && (
                                    <div style={{ flex: 1, minWidth: '140px' }}>
                                        <label className={css.label}>Interval (Minutes)</label>
                                        <input
                                            type="number"
                                            name="customInterval"
                                            value={formData.customInterval}
                                            onChange={handleChange}
                                            className={css.input}
                                            placeholder="e.g. 30"
                                        />
                                    </div>
                                )}

                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label className={css.label}>Auto Close Timer (Sec)</label>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className={css.input}
                                        min="3" max="300"
                                    />
                                </div>
                            </div>

                            <div className={css.formGroup} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className={css.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={css.label}>End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className={css.input}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={css.saveBtn} disabled={loading || isCompressing}>
                                {isCompressing ? "Optimizing..." : (loading ? "Saving..." : (editingId ? "Update Popup" : "Create Popup"))}
                            </button>
                        </form>
                    </div>

                    {/* List Column */}
                    <div className={css.card}>
                        <div className={css.cardTitle}>
                            Existing Popups
                            <button className={css.createBtn} onClick={resetForm}>+ New</button>
                        </div>

                        <div className={css.popupList}>
                            {popups.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No popups created yet.</p>}

                            {popups.map(popup => (
                                <div key={popup._id} className={css.popupItem}>
                                    <div className={css.popupInfo}>
                                        <h4>
                                            <span className={`${css.activeTag} ${popup.isActive ? css.live : css.paused}`}>
                                                {popup.isActive ? "LIVE" : "PAUSED"}
                                            </span>
                                            {popup.title}
                                        </h4>
                                        <div className={css.popupMeta}>
                                            Seen: {popup.viewCount} · Clicks: {popup.clickCount}
                                            <br />
                                            <span style={{ fontSize: '0.8rem', color: '#666', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', marginRight: '0.5rem' }}>
                                                Pri: {popup.priority || 5}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: '#666', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                                                {popup.frequency === 'every_refresh' ? 'Every Refresh' : popup.frequency}
                                            </span>
                                            <br />
                                            {new Date(popup.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className={css.actions}>
                                        <button onClick={() => handleEdit(popup)} className={css.editBtn}>Edit</button>
                                        <button onClick={() => handleDelete(popup._id)} className={css.deleteBtn}>Del</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPopupManager;
