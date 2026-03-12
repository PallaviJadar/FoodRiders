import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminAnnouncements.module.css';

const AdminAnnouncements = () => {
    // v1.1.0 - Cache Buster
    const [announcements, setAnnouncements] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewWishes, setViewWishes] = useState({ isOpen: false, wishes: [], title: '' });
    const [formData, setFormData] = useState({
        type: 'General Notice',
        title: '',
        description: '',
        linkedRestaurantId: '',
        startDate: '',
        endDate: '',
        isActive: true,
        priority: 'MEDIUM'
    });
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
        fetchRestaurants();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/announcements/admin-list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch announcements error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRestaurants = async () => {
        try {
            const res = await fetch('/api/restaurants');
            const data = await res.json();
            setRestaurants(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Fetch restaurants error:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    type: 'General Notice',
                    title: '',
                    description: '',
                    linkedRestaurantId: '',
                    startDate: '',
                    endDate: '',
                    isActive: true,
                    priority: 'MEDIUM'
                });
                setImageFile(null);
                fetchAnnouncements();
            } else {
                const errData = await res.json();
                alert(errData.msg || 'Operation failed');
            }
        } catch (err) {
            alert('Error saving announcement');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (ann) => {
        setEditingId(ann._id);
        setFormData({
            type: ann.type,
            title: ann.title,
            description: ann.description || '',
            linkedRestaurantId: ann.linkedRestaurantId || '',
            startDate: ann.startDate.split('T')[0],
            endDate: ann.endDate.split('T')[0],
            isActive: ann.isActive,
            priority: ann.priority || 'MEDIUM'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchAnnouncements();
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <AdminLayout>
            <div className={css.container}>
                <div className={css.header}>
                    <h2>📢 Announcements Hub v1.2</h2>
                    <button className={css.addBtn} onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData({
                            type: 'General Notice',
                            title: '',
                            description: '',
                            linkedRestaurantId: '',
                            startDate: '',
                            endDate: '',
                            isActive: true,
                            priority: 'MEDIUM'
                        });
                    }}>
                        + Create Announcement
                    </button>
                </div>

                {showForm && (
                    <div className={css.modal}>
                        <div className={css.formCard}>
                            <h3>{editingId ? 'Edit Announcement' : 'New Announcement'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className={css.formGroup}>
                                    <label>Type</label>
                                    <select name="type" value={formData.type} onChange={handleInputChange}>
                                        <option>New Shop Opening</option>
                                        <option>Promotion / Offer</option>
                                        <option>Birthday Wishes</option>
                                        <option>Festival Wishes</option>
                                        <option>General Notice</option>
                                    </select>
                                </div>
                                <div className={css.formGroup}>
                                    <label>Priority</label>
                                    <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ color: formData.priority === 'HIGH' ? '#e74c3c' : formData.priority === 'MEDIUM' ? '#f39c12' : '#2ecc71', fontWeight: 'bold' }}>
                                        <option value="LOW">LOW - Regular</option>
                                        <option value="MEDIUM">MEDIUM - Featured</option>
                                        <option value="HIGH">HIGH - Urgent/Critical</option>
                                    </select>
                                </div>
                                <div className={css.formGroup}>
                                    <label>Title</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                                </div>
                                <div className={css.formGroup}>
                                    <label>Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} />
                                </div>
                                <div className={css.formGroup}>
                                    <label>Linked Restaurant (Optional)</label>
                                    <select name="linkedRestaurantId" value={formData.linkedRestaurantId} onChange={handleInputChange}>
                                        <option value="">None</option>
                                        {restaurants.map(r => (
                                            <option key={r._id} value={r._id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={css.formRow}>
                                    <div className={css.formGroup}>
                                        <label>Start Date</label>
                                        <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                                    </div>
                                    <div className={css.formGroup}>
                                        <label>End Date</label>
                                        <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className={css.formGroup}>
                                    <label>Banner Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                                </div>
                                <div className={css.formGroupCheckbox}>
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                                    <label>Active</label>
                                </div>
                                <div className={css.formActions}>
                                    <button type="button" onClick={() => setShowForm(false)} className={css.cancelBtn}>Cancel</button>
                                    <button type="submit" className={css.saveBtn} disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Announcement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className={css.list}>
                    {loading ? <p>Loading...</p> : (
                        announcements.map(ann => (
                            <div key={ann._id} className={`${css.card} ${!ann.isActive ? css.inactiveCard : ''}`}>
                                <div className={css.cardImg}>
                                    {ann.image ? (
                                        <img
                                            src={(ann.image && (ann.image.startsWith('http') || ann.image.startsWith('data:'))) ? ann.image : `/uploads/${ann.image}`}
                                            alt=""
                                            onError={(e) => {
                                                if (e.target.src.includes('/uploads/')) {
                                                    e.target.style.display = 'none';
                                                }
                                            }}
                                        />
                                    ) : <div className={css.placeholder}>No Image</div>}
                                    <span className={css.typeBadge}>{ann.type}</span>
                                    {ann.priority && (
                                        <span className={`${css.prioBadge} ${css['prio' + ann.priority]}`}>
                                            {ann.priority}
                                        </span>
                                    )}
                                </div>
                                <div className={css.cardInfo}>
                                    <h4>{ann.title}</h4>
                                    <p>{ann.description}</p>
                                    <div className={css.cardMeta}>
                                        <span>📅 {new Date(ann.startDate).toLocaleDateString()} - {new Date(ann.endDate).toLocaleDateString()}</span>
                                        <span
                                            className={css.wishCount}
                                            onClick={() => setViewWishes({ isOpen: true, wishes: ann.interactions || [], title: ann.title })}
                                        >
                                            🎉 {ann.interactions?.length || 0} Wishes (View)
                                        </span>
                                    </div>
                                    <div className={css.cardActions}>
                                        <button onClick={() => handleEdit(ann)}>Edit</button>
                                        <button onClick={() => handleDelete(ann._id)} className={css.deleteBtn}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Wishes Modal */}
                {viewWishes.isOpen && (
                    <div className={css.modal} onClick={() => setViewWishes({ ...viewWishes, isOpen: false })}>
                        <div className={css.wishesCard} onClick={e => e.stopPropagation()}>
                            <div className={css.modalHeader}>
                                <h4>Messages for: {viewWishes.title}</h4>
                                <button onClick={() => setViewWishes({ ...viewWishes, isOpen: false })}>×</button>
                            </div>
                            <div className={css.wishesList}>
                                {viewWishes.wishes.length === 0 ? <p className={css.empty}>No messages yet.</p> : (
                                    viewWishes.wishes.map((w, idx) => (
                                        <div key={idx} className={css.wishItem}>
                                            <div className={css.wishUser}>
                                                <strong>{w.userName || 'Guest User'}</strong>
                                                <span>{new Date(w.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className={css.wishMsg}>{w.message || '(No message)'}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAnnouncements;
