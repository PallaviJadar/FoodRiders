import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminCategoryGroups.module.css';
import LoadingScreen from '../../LoadingScreen.jsx';
import { useImageCompression } from '../../utils/imageCompressor';

const AdminCategoryGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({ name: '', categories: [] });
    const [saving, setSaving] = useState(false);
    const { compressImage, isCompressing } = useImageCompression();

    // Temp category form
    const [tempCategory, setTempCategory] = useState({ name: '', image: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef();

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/home-sections/groups');
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData({ name: group.name, categories: [...group.categories] });
        } else {
            setEditingGroup(null);
            setFormData({ name: '', categories: [] });
        }
        setIsModalOpen(true);
    };

    const handleAddCategoryToGroup = async () => {
        if (!tempCategory.name || (!selectedFile && !tempCategory.image)) {
            alert("Please provide name and image");
            return;
        }

        let imageName = tempCategory.image;

        if (selectedFile) {
            const token = localStorage.getItem('adminToken');
            const fd = new FormData();
            fd.append('image', selectedFile);
            const res = await fetch('/api/home-sections/upload-category-image', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            const data = await res.json();
            imageName = data.filename;
        }

        setFormData({
            ...formData,
            categories: [...formData.categories, { name: tempCategory.name, image: imageName }]
        });
        setTempCategory({ name: '', image: '' });
        setSelectedFile(null);
    };

    const handleRemoveCategoryFromGroup = (index) => {
        const updated = [...formData.categories];
        updated.splice(index, 1);
        setFormData({ ...formData, categories: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingGroup ? `/api/home-sections/groups/${editingGroup._id}` : '/api/home-sections/groups';
            const method = editingGroup ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchGroups();
                setIsModalOpen(false);
            }
        } catch (err) {
            alert('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Delete this group?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/home-sections/groups/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchGroups();
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
                        <h2>📁 Category Groups</h2>
                        <p>Manage sets of categories for Home Delivery Sections.</p>
                    </div>
                    <button className={css.addBtn} onClick={() => handleOpenModal()}>+ Create Group</button>
                </header>

                <div className={css.groupGrid}>
                    {groups.map(group => (
                        <div key={group._id} className={css.groupCard}>
                            <div className={css.groupHeader}>
                                <div className={css.groupTitleInfo}>
                                    <span className={css.groupIcon}>📦</span>
                                    <div className={css.groupText}>
                                        <h3>{group.name}</h3>
                                        <p>{group.categories.length} Categories Active</p>
                                    </div>
                                </div>
                                <div className={css.groupActions}>
                                    <button className={css.editBtn} onClick={() => handleOpenModal(group)} title="Review & Edit">
                                        ✏️
                                    </button>
                                    <button className={css.deleteBtn} onClick={() => handleDeleteGroup(group._id)} title="Remove Group">
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className={css.categoryDiscovery}>
                                <label>Discovery Bridge</label>
                                <div className={css.categoryList}>
                                    {group.categories.map((cat, i) => (
                                        <div key={i} className={css.catChip}>
                                            <div className={css.chipImgWrapper}>
                                                <img
                                                    src={cat.image?.startsWith('data:') || cat.image?.startsWith('http')
                                                        ? cat.image
                                                        : `/uploads/${cat.image}`}
                                                    alt={cat.name}
                                                />
                                            </div>
                                            <span>{cat.name}</span>
                                        </div>
                                    ))}
                                    {group.categories.length === 0 && (
                                        <div className={css.emptyDiscovery}>
                                            <p>No discovery paths created yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className={css.modalOverlay}>
                        <div className={css.modal}>
                            <h3>{editingGroup ? 'Edit Group' : 'New Group'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className={css.formGroup}>
                                    <label>Group Name</label>
                                    <input
                                        type="text"
                                        className={css.input}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="e.g. Food Delivery"
                                    />
                                </div>

                                <div className={css.categoryEditor}>
                                    <label>Manage Categories</label>
                                    <div className={css.currentCategories}>
                                        {formData.categories.map((cat, i) => (
                                            <div key={i} className={css.catEditChip}>
                                                <img
                                                    src={cat.image?.startsWith('data:') || cat.image?.startsWith('http')
                                                        ? cat.image
                                                        : `/uploads/${cat.image}`}
                                                    alt={cat.name}
                                                />
                                                <span>{cat.name}</span>
                                                <button type="button" onClick={() => handleRemoveCategoryFromGroup(i)}>×</button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={css.addCategoryForm}>
                                        <input
                                            type="text"
                                            placeholder="Category Name"
                                            value={tempCategory.name}
                                            onChange={e => setTempCategory({ ...tempCategory, name: e.target.value })}
                                        />
                                        <input
                                            type="file"
                                            hidden
                                            ref={fileInputRef}
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const result = await compressImage(file);
                                                    setSelectedFile(result.file);
                                                }
                                            }}
                                            accept="image/*"
                                        />
                                        <button type="button" onClick={() => fileInputRef.current.click()} className={css.uploadBtn} disabled={isCompressing}>
                                            {isCompressing ? 'Optimizing...' : (selectedFile ? 'Image Ready' : '📁 Upload Image')}
                                        </button>
                                        <button type="button" onClick={handleAddCategoryToGroup} className={css.appendBtn}>Add</button>
                                    </div>
                                </div>

                                <div className={css.modalBtnGroup}>
                                    <button type="button" className={css.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className={css.saveBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Group'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCategoryGroups;
