import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminHomeDelivery.module.css';
import LoadingScreen from '../../LoadingScreen.jsx';

const AdminHomeDelivery = () => {
    const [sections, setSections] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        categoryGroupId: '',
        displayOrder: 0,
        isActive: true
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const [secRes, grpRes] = await Promise.all([
                fetch('/api/home-sections/sections/all', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/home-sections/groups')
            ]);
            const secData = await secRes.json();
            const grpData = await grpRes.json();
            setSections(Array.isArray(secData) ? secData : []);
            setGroups(Array.isArray(grpData) ? grpData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (section = null) => {
        if (section) {
            setEditingSection(section);
            setFormData({
                title: section.title,
                categoryGroupId: section.categoryGroupId?._id || section.categoryGroupId,
                displayOrder: section.displayOrder,
                isActive: section.isActive
            });
            setImagePreview(`/uploads/${section.image}`);
        } else {
            setEditingSection(null);
            setFormData({
                title: '',
                categoryGroupId: groups[0]?._id || '',
                displayOrder: sections.length,
                isActive: true
            });
            setImagePreview(null);
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('categoryGroupId', formData.categoryGroupId);
            fd.append('displayOrder', formData.displayOrder);
            fd.append('isActive', formData.isActive);
            if (selectedFile) fd.append('image', selectedFile);

            const url = editingSection ? `/api/home-sections/sections/${editingSection._id}` : '/api/home-sections/sections';
            const method = editingSection ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });

            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
            }
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this section?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/home-sections/sections/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <AdminLayout>
            <div className={css.container}>
                <header className={css.header}>
                    <div className={css.titleBox}>
                        <h2>🛵 Home Delivery Sections</h2>
                        <p>Manage Delivery Boy entry points on the homepage.</p>
                    </div>
                    <button className={css.addBtn} onClick={() => handleOpenModal()}>+ Add Section</button>
                </header>

                <div className={css.grid}>
                    {sections.map(sec => (
                        <div key={sec._id} className={css.card}>
                            <div className={css.imgBox}>
                                <img
                                    src={sec.image?.startsWith('data:') || sec.image?.startsWith('http')
                                        ? sec.image
                                        : `/uploads/${sec.image}`}
                                    alt={sec.title}
                                />
                            </div>
                            <div className={css.info}>
                                <h3>{sec.title}</h3>
                                <div className={css.meta}>
                                    <span className={css.groupBadge}>Group: {sec.categoryGroupId?.name || 'None'}</span>
                                    <span className={`${css.status} ${sec.isActive ? css.active : css.inactive}`}>
                                        {sec.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className={css.order}>Display Order: {sec.displayOrder}</div>
                                <div className={css.actions}>
                                    <button onClick={() => handleOpenModal(sec)}>✏️ Edit</button>
                                    <button onClick={() => handleDelete(sec._id)} className={css.del}>🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className={css.modalOverlay}>
                        <div className={css.modal}>
                            <h3>{editingSection ? 'Edit Section' : 'Add Section'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className={css.formGroup}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        className={css.input}
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g. Food Delivery"
                                    />
                                </div>

                                <div className={css.formGroup}>
                                    <label>Assigned Category Group</label>
                                    <select
                                        className={css.select}
                                        value={formData.categoryGroupId}
                                        onChange={e => setFormData({ ...formData, categoryGroupId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                    </select>
                                </div>

                                <div className={css.formGroup}>
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        className={css.input}
                                        value={formData.displayOrder}
                                        onChange={e => setFormData({ ...formData, displayOrder: e.target.value })}
                                    />
                                </div>

                                <div className={css.formGroup}>
                                    <label>Status</label>
                                    <select
                                        className={css.select}
                                        value={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                    >
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>

                                <div className={css.formGroup}>
                                    <label>Illustration / Image</label>
                                    <div className={css.preview} onClick={() => fileInputRef.current.click()}>
                                        {imagePreview ? <img src={imagePreview} alt="Preview" /> : <span>Click to Upload</span>}
                                        <div className={css.overlay}>Change</div>
                                    </div>
                                    <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                                </div>

                                <div className={css.modalBtns}>
                                    <button type="button" className={css.cancel} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className={css.save} disabled={saving}>{saving ? 'Saving...' : 'Save Section'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminHomeDelivery;
