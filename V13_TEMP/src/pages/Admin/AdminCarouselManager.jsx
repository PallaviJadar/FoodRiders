import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import css from './AdminCarouselManager.module.css';
import LoadingScreen from '../../LoadingScreen.jsx';
import { useImageCompression } from '../../utils/imageCompressor';

const AdminCarouselManager = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const { compressImage, isCompressing } = useImageCompression();

    // Data for dropdowns
    const [restaurants, setRestaurants] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        linkType: 'Category',
        linkTarget: '',
        displayOrder: 0,
        status: 'Active'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef();

    useEffect(() => {
        fetchData();
        fetchAuxiliaryData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/carousel/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                console.error('Expected array of carousel items, got:', data);
                setItems([]);
            }
        } catch (err) {
            setError('Failed to fetch carousel items');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuxiliaryData = async () => {
        try {
            // Fetch restaurants
            const restRes = await fetch('/api/restaurants');
            const restData = await restRes.json();
            setRestaurants(Array.isArray(restData) ? restData : []);

            // Fetch Category Groups
            const catRes = await fetch('/api/home-sections/groups');
            const catData = await catRes.json();
            setCategories(Array.isArray(catData) ? catData : []);

        } catch (err) {
            console.error('Aux data fetch error', err);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                redirectType: item.redirectType || item.linkType?.toLowerCase() || 'category', // Fallback for migration
                redirectTarget: item.redirectTarget || item.linkTarget || '',
                displayOrder: item.displayOrder,
                status: item.status
            });
            const imgSrc = (item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))) ? item.image : `/uploads/${item.image}`;
            setImagePreview(imgSrc);
        } else {
            setEditingItem(null);
            setFormData({
                title: '',
                redirectType: 'category',
                redirectTarget: '',
                displayOrder: items.length,
                status: 'Active'
            });
            setImagePreview(null);
        }
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({
            title: '',
            redirectType: 'category',
            redirectTarget: '',
            displayOrder: 0,
            status: 'Active'
        });
        setSelectedFile(null);
        setImagePreview(null);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const result = await compressImage(file);
            setSelectedFile(result.file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(result.file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('redirectType', formData.redirectType);
            fd.append('redirectTarget', formData.redirectTarget);
            fd.append('displayOrder', formData.displayOrder);
            fd.append('status', formData.status);
            if (selectedFile) fd.append('image', selectedFile);

            const url = editingItem ? `/api/carousel/${editingItem._id}` : '/api/carousel';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });

            if (res.ok) {
                fetchData();
                handleCloseModal();
            } else {
                const data = await res.json();
                alert(data.msg || 'Save failed');
            }
        } catch (err) {
            alert('Error saving item');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this carousel item?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/carousel/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setItems(items.filter(i => i._id !== id));
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    const handleToggleStatus = async (item) => {
        try {
            const token = localStorage.getItem('adminToken');
            const newStatus = item.status === 'Active' ? 'Hidden' : 'Active';
            const res = await fetch(`/api/carousel/${item._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...item, status: newStatus })
            });
            if (res.ok) {
                setItems(items.map(i => i._id === item._id ? { ...i, status: newStatus } : i));
            }
        } catch (err) {
            alert('Update failed');
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <AdminLayout>
            <div className={css.managerWrapper}>
                <header className={css.header}>
                    <div className={css.titleSection}>
                        <h2>🎡 Homepage Carousel Manager</h2>
                        <p>Manage high-impact banners and discovery links for the user homepage.</p>
                    </div>
                    <button className={css.addBtn} onClick={() => handleOpenModal()}>
                        <span>+</span> Add Carousel Item
                    </button>
                </header>

                <div className={css.carouselGrid}>
                    {items.map((item) => (
                        <div key={item._id} className={`${css.itemCard} ${item.status !== 'Active' ? css.itemHidden : ''}`}>
                            <div className={css.circularPreview}>
                                <div className={css.imageCircle}>
                                    <img src={(item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))) ? item.image : `/uploads/${item.image}`} alt={item.title} />
                                    <div className={css.cardOverlay}>
                                        <button className={css.overlayBtn} onClick={() => handleOpenModal(item)} title="Edit Details">
                                            ✏️
                                        </button>
                                        <button
                                            className={`${css.overlayBtn} ${item.status === 'Active' ? css.btnHide : css.btnShow}`}
                                            onClick={() => handleToggleStatus(item)}
                                            title={item.status === 'Active' ? 'Hide from User' : 'Show to User'}
                                        >
                                            {item.status === 'Active' ? '🕶️' : '👁️'}
                                        </button>
                                        <button className={`${css.overlayBtn} ${css.btnDelete}`} onClick={() => handleDelete(item._id)} title="Delete Forever">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className={css.orderBadge}>#{item.displayOrder}</div>
                            </div>

                            <div className={css.itemMeta}>
                                <h3 className={css.itemTitle}>{item.title}</h3>
                                <div className={css.itemTags}>
                                    <span className={css.typeTag}>{(item.redirectType || item.linkType || 'unknown').toUpperCase()}</span>
                                    <span className={`${css.statusTag} ${item.status === 'Active' ? css.tagActive : css.tagHidden}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className={css.modalOverlay}>
                        <div className={css.modal}>
                            <h3>{editingItem ? 'Edit Carousel Item' : 'New Carousel Item'}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className={css.formGroup}>
                                    <label>Display Title</label>
                                    <input
                                        className={css.input}
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Delicious Burger"
                                    />
                                </div>

                                <div className={css.formGroup}>
                                    <label>Redirect Type</label>
                                    <select
                                        className={css.select}
                                        value={formData.redirectType}
                                        onChange={(e) => setFormData({ ...formData, redirectType: e.target.value, redirectTarget: '' })}
                                    >
                                        <option value="category">Category</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="menu_item">Menu Item</option>
                                        <option value="offer">Offer/Ad</option>
                                        <option value="external">External Link</option>
                                    </select>
                                </div>

                                <div className={css.formGroup}>
                                    <label>Target</label>
                                    {formData.redirectType === 'category' && (
                                        <select
                                            className={css.select}
                                            required
                                            value={formData.redirectTarget}
                                            onChange={(e) => setFormData({ ...formData, redirectTarget: e.target.value })}
                                        >
                                            <option value="">Select Category Group</option>
                                            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    )}
                                    {formData.redirectType === 'restaurant' && (
                                        <select
                                            className={css.select}
                                            required
                                            value={formData.redirectTarget}
                                            onChange={(e) => setFormData({ ...formData, redirectTarget: e.target.value })}
                                        >
                                            <option value="">Select Restaurant</option>
                                            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                        </select>
                                    )}
                                    {formData.redirectType === 'menu_item' && (
                                        <input
                                            className={css.input}
                                            type="text"
                                            required
                                            placeholder="Enter exact item name"
                                            value={formData.redirectTarget}
                                            onChange={(e) => setFormData({ ...formData, redirectTarget: e.target.value })}
                                        />
                                    )}
                                    {formData.redirectType === 'offer' && (
                                        <input
                                            className={css.input}
                                            type="text"
                                            required
                                            placeholder="Enter Offer ID (e.g. SPECIAL50)"
                                            value={formData.redirectTarget}
                                            onChange={(e) => setFormData({ ...formData, redirectTarget: e.target.value })}
                                        />
                                    )}
                                    {formData.redirectType === 'external' && (
                                        <input
                                            className={css.input}
                                            type="url"
                                            required
                                            placeholder="https://example.com"
                                            value={formData.redirectTarget}
                                            onChange={(e) => setFormData({ ...formData, redirectTarget: e.target.value })}
                                        />
                                    )}
                                </div>

                                <div className={css.formGroup}>
                                    <label>Display Order</label>
                                    <input
                                        className={css.input}
                                        type="number"
                                        required
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                    />
                                </div>

                                <div className={css.formGroup}>
                                    <label>Status</label>
                                    <select
                                        className={css.select}
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Hidden">Hidden</option>
                                    </select>
                                </div>

                                <div className={css.formGroup}>
                                    <label>Image</label>
                                    <div className={css.imagePreviewArea} onClick={() => fileInputRef.current.click()}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" />
                                        ) : (
                                            <span>Click to Upload Image</span>
                                        )}
                                        <div className={css.uploadOverlay}>Change Image</div>
                                    </div>
                                    <input
                                        type="file"
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>

                                <div className={css.modalActions}>
                                    <button type="button" className={css.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className={css.saveBtn} disabled={saving || isCompressing}>
                                        {isCompressing ? 'Optimizing...' : (saving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Add Item'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminCarouselManager;
