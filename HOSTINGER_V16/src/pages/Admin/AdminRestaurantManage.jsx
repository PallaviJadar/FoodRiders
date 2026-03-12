import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import css from './AdminRestaurantManage.module.css';
import LoadingScreen from '../../LoadingScreen.jsx';
import DynamicRestaurantMenu from '../../components/RestaurantComponents/DynamicRestaurantMenu.jsx';
import RestaurantPriceAdjustment from './RestaurantPriceAdjustment';
import { useImageCompression } from '../../utils/imageCompressor';
import socket from '../../utils/socket';

// 🛸 Persistent Locks (Global across re-mounts)
const globalFetchLocks = {};
const globalDataHashes = {};

const AdminRestaurantManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'settings'
    const { compressImage, isCompressing } = useImageCompression();

    const fetchRestaurant = useCallback(async (isInitial = false) => {
        // Only fetch if a request isn't already flying for THIS specific ID
        if (globalFetchLocks[id]) return;
        globalFetchLocks[id] = true;

        // Only show full loader if it's the very first visit
        if (isInitial && !restaurant) setLoading(true);

        try {
            const currentToken = localStorage.getItem('adminToken');
            const res = await fetch(`/api/restaurants/${id}`, {
                headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (!res.ok) throw new Error('Restaurant not found');
            const data = await res.json();

            // 🧠 Satisfaction Engine: Only update state if data ACTUALLY changed
            const currentHash = JSON.stringify(data);
            if (currentHash !== globalDataHashes[id]) {
                globalDataHashes[id] = currentHash;
                setRestaurant(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            globalFetchLocks[id] = false;
        }
    }, [id]);

    useEffect(() => {
        fetchRestaurant(true);

        // 📡 Live Menu Sync
        const handleUpdate = (payload) => {
            if (payload.id === id) {
                console.log(`[AdminManage] 📡 Real-time update for: ${id}`);
                fetchRestaurant(); // Refresh background
            }
        };

        socket.on('restaurantUpdate', handleUpdate);
        return () => {
            socket.off('restaurantUpdate', handleUpdate);
        };
    }, [id, fetchRestaurant]);

    const saveMenu = async (updatedCategories) => {
        setSaving(true);
        try {
            // Clean the data of UI-only properties before sending to server
            const cleanCategories = JSON.parse(JSON.stringify(updatedCategories)).map(cat => {
                delete cat._originalIndex;
                if (cat.items) {
                    cat.items = cat.items.map(item => {
                        delete item._originalIndex;
                        delete item.categoryAvailability;
                        return item;
                    });
                }
                return cat;
            });

            const currentToken = localStorage.getItem('adminToken');
            const res = await fetch(`/api/restaurants/${id}/menu`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentToken}`
                },
                body: JSON.stringify({ categories: cleanCategories })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.msg || 'Failed to save menu');
            }
            const data = await res.json();
            setRestaurant(data);
        } catch (err) {
            console.error('Menu save error:', err);
            alert('Update Failed: ' + err.message);
            fetchRestaurant(); // Background refresh
        } finally {
            setSaving(false);
        }
    };

    // Category Actions
    const handleAddCategory = () => {
        const name = window.prompt('Enter Category Name (e.g. Starters):');
        if (!name) return;
        const newCategory = {
            name,
            items: [],
            isManuallyClosed: false,
            timings: [{ startTime: "00:00", endTime: "23:59" }]
        };
        const updated = [...(restaurant.categories || []), newCategory];
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleUpdateCategory = (index, newName) => {
        const updated = JSON.parse(JSON.stringify(restaurant.categories));
        updated[index].name = newName;
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleDeleteCategory = (index) => {
        if (!window.confirm('Delete this entire category and its items?')) return;
        const updated = restaurant.categories.filter((_, i) => i !== index);
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleUpdateCategoryDetails = (index, details) => {
        const updated = JSON.parse(JSON.stringify(restaurant.categories));
        updated[index] = { ...updated[index], ...details };
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    // Item Actions
    const handleAddItem = (catIndex) => {
        const updated = JSON.parse(JSON.stringify(restaurant.categories));
        updated[catIndex].items.push({
            name: 'New Item',
            price: 0,
            image: '',
            isAvailable: true
        });
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleUpdateItem = (catIndex, itemIndex, updatedItem) => {
        const updated = JSON.parse(JSON.stringify(restaurant.categories));
        updated[catIndex].items[itemIndex] = updatedItem;
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleDeleteItem = (catIndex, itemIndex) => {
        if (!window.confirm('Delete this item?')) return;
        const updated = JSON.parse(JSON.stringify(restaurant.categories));
        updated[catIndex].items = updated[catIndex].items.filter((_, i) => i !== itemIndex);
        setRestaurant(prev => ({ ...prev, categories: updated }));
        saveMenu(updated);
    };

    const handleImageUpload = async (catIndex, itemIndex, file) => {
        setSaving(true);
        try {
            const result = await compressImage(file);
            const formData = new FormData();
            formData.append('image', result.file);

            const currentToken = localStorage.getItem('adminToken');
            const res = await fetch('/api/restaurants/upload-item-image', {
                method: 'POST',
                headers: { Authorization: `Bearer ${currentToken}` },
                body: formData
            });
            const { filename } = await res.json();

            const updated = JSON.parse(JSON.stringify(restaurant.categories));
            updated[catIndex].items[itemIndex].image = filename;
            setRestaurant(prev => ({ ...prev, categories: updated }));
            saveMenu(updated);
        } catch (err) {
            alert('Image upload failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;
    if (error) return (
        <AdminLayout>
            <div className={css.error}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h2>{error}</h2>
                <button className={css.backBtn} onClick={() => navigate('/admin/restaurants')}>Go Back</button>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className={css.manageWrapper}>
                <header className={css.header}>
                    <div className={css.headerInfo}>
                        <button className={css.circleBackBtn} onClick={() => navigate('/admin/restaurants')}>←</button>
                        <div>
                            <h2>{restaurant.name}</h2>
                            <p>{restaurant.address}</p>
                        </div>
                    </div>
                    <div className={css.headerActions}>
                        {(saving || isCompressing) && <span className={css.savingTag}>{isCompressing ? 'Optimizing Image...' : 'Updating Database...'}</span>}
                        {activeTab === 'menu' && (
                            <button className={css.addCatBtn} onClick={handleAddCategory}>+ Add Category</button>
                        )}
                    </div>
                </header>

                <div className={css.tabContainer}>
                    <button
                        className={`${css.tab} ${activeTab === 'menu' ? css.activeTab : ''}`}
                        onClick={() => setActiveTab('menu')}
                    >
                        🍴 Menu Management
                    </button>
                    <button
                        className={`${css.tab} ${activeTab === 'settings' ? css.activeTab : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ Restaurant Settings
                    </button>
                </div>

                <div className={css.adminMenuContent}>
                    {activeTab === 'menu' ? (
                        <DynamicRestaurantMenu
                            restaurant={restaurant}
                            isAdmin={true}
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                            onUpdateCategory={handleUpdateCategory}
                            onDeleteCategory={handleDeleteCategory}
                            onUpdateCategoryDetails={handleUpdateCategoryDetails}
                            onImageUpload={handleImageUpload}
                        />
                    ) : (
                        <RestaurantPriceAdjustment
                            restaurant={restaurant}
                            onUpdate={(updated) => setRestaurant(updated)}
                        />
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminRestaurantManage;
