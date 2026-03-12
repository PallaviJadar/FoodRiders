import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import css from './AdminRestaurants.module.css';
import LoadingScreen from '../../LoadingScreen.jsx';
import { useImageCompression } from '../../utils/imageCompressor';
import socket from '../../utils/socket';

const API_URL = '/api/restaurants/all'; // Use Admin route

// 🛸 Persistent Locks (Global across re-mounts)
const globalFleetLock = { inProgress: false, lastFetch: 0 };
let globalFleetHash = "";

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [allCategoryGroups, setAllCategoryGroups] = useState([]); // Loaded from API
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', rating: '', deliveryTime: '', phone: '', whatsappEnabled: true, displayOrder: 0, image: null, categoryGroups: [], bridgeCategories: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { compressImage, isCompressing, compressionResult } = useImageCompression();

  const token = localStorage.getItem('adminToken');

  const fetchRestaurants = async (isInitial = false) => {
    // 🛡️ Global Throttle & Lock
    if (globalFleetLock.inProgress) return;
    const now = Date.now();
    // Only fetch if 30s passed OR it's a forced refetch from an action
    if (!isInitial && (now - globalFleetLock.lastFetch < 30000)) return;

    globalFleetLock.inProgress = true;
    globalFleetLock.lastFetch = now;

    // Only show big loader if we have NO restaurants in the UI yet
    if (isInitial && restaurants.length === 0) setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // 🧠 Comparison logic: Don't re-render if data is the same
      const currentHash = JSON.stringify(data);
      if (currentHash !== globalFleetHash) {
        globalFleetHash = currentHash;
        setRestaurants(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to fetch restaurants');
    } finally {
      setLoading(false);
      globalFleetLock.inProgress = false;
    }
  };

  const fetchCategoryGroups = async () => {
    try {
      const res = await fetch('/api/home-sections/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setAllCategoryGroups(data);
    } catch (err) {
      console.error("Failed to load category groups");
    }
  };

  useEffect(() => {
    fetchRestaurants(true);
    fetchCategoryGroups();

    // 📡 Live Fleet Sync
    const handleFleetUpdate = (payload) => {
      console.log(`[AdminRestaurants] 📡 Real-time update: ${payload.id}`);
      fetchRestaurants(true); // Bypass throttle for real-time events
    };

    socket.on('restaurantUpdate', handleFleetUpdate);
    return () => {
      socket.off('restaurantUpdate', handleFleetUpdate);
    };
    // eslint-disable-next-line
  }, []);

  const handleInput = async e => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const result = await compressImage(files[0]);
      setForm(f => ({ ...f, [name]: result.file }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleGroupToggle = (groupName) => {
    setForm(prev => {
      const current = prev.categoryGroups || [];
      if (current.includes(groupName)) {
        return { ...prev, categoryGroups: current.filter(g => g !== groupName) };
      } else {
        return { ...prev, categoryGroups: [...current, groupName] };
      }
    });
  };

  const handleBridgeToggle = (bridgeName) => {
    setForm(prev => {
      const current = prev.bridgeCategories || [];
      if (current.includes(bridgeName)) {
        return { ...prev, bridgeCategories: current.filter(g => g !== bridgeName) };
      } else {
        return { ...prev, bridgeCategories: [...current, bridgeName] };
      }
    });
  };

  const handleEditInit = (res) => {
    setForm({
      name: res.name,
      address: res.address,
      rating: res.rating,
      deliveryTime: res.deliveryTime,
      phone: res.phone || '',
      whatsappEnabled: res.whatsappEnabled !== false,
      displayOrder: res.displayOrder || 0,
      image: null,
      categoryGroups: Array.isArray(res.categoryGroups) ? res.categoryGroups : [],
      bridgeCategories: Array.isArray(res.bridgeCategories) ? res.bridgeCategories : []
    });
    setEditingId(res._id);
    setShowForm(true);
  };

  const handleAddOrUpdate = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('address', form.address);
    formData.append('rating', form.rating);
    formData.append('deliveryTime', form.deliveryTime);
    formData.append('phone', form.phone);
    formData.append('whatsappEnabled', form.whatsappEnabled);
    formData.append('displayOrder', form.displayOrder || 0);
    if (form.image) formData.append('image', form.image);
    formData.append('categoryGroups', JSON.stringify(form.categoryGroups || []));
    formData.append('bridgeCategories', JSON.stringify(form.bridgeCategories || []));

    try {
      const url = editingId ? `/api/restaurants/${editingId}` : '/api/restaurants';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error(`Failed to ${editingId ? 'update' : 'add'} restaurant`);
      const updatedRes = await res.json();

      setForm({ name: '', address: '', rating: '', deliveryTime: '', displayOrder: 0, image: null, categoryGroups: [], bridgeCategories: [] });
      setShowForm(false);
      setEditingId(null);
      setSuccess(`Restaurant ${editingId ? 'updated' : 'added'}!`);
      fetchRestaurants();

      if (!editingId) {
        setTimeout(() => {
          navigate(`/admin/restaurants/${updatedRes._id}/manage`);
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this restaurant?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Deleted!');
      fetchRestaurants();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/restaurants/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Toggle failed');
      // Optimistic update or refetch
      fetchRestaurants();
      setSuccess(`Restaurant ${!currentStatus ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className={css.restaurantWrapper}>
        <header className={css.header}>
          <h2>Restaurants</h2>
          <button className={css.addBtn} onClick={() => {
            setShowForm(!showForm);
            if (showForm) setEditingId(null);
          }}>
            {showForm ? 'Cancel' : '+ New Restaurant'}
          </button>
        </header>

        {showForm && (
          <form className={css.formCard} onSubmit={handleAddOrUpdate}>
            <h3>{editingId ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
            <input className={css.inputField} name="name" value={form.name} onChange={handleInput} placeholder="Restaurant Name" required />
            <input className={css.inputField} name="address" value={form.address} onChange={handleInput} placeholder="Detailed Address" required />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input className={css.inputField} name="rating" value={form.rating} onChange={handleInput} placeholder="Rating (4.5)" type="number" step="0.1" min="0" max="5" required />
              <input className={css.inputField} name="deliveryTime" value={form.deliveryTime} onChange={handleInput} placeholder="Del. Time (mins)" type="number" min="1" required />
              <input className={css.inputField} name="displayOrder" value={form.displayOrder} onChange={handleInput} placeholder="Priority (Higher=First)" type="number" title="Higher numbers show first" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
              <input className={css.inputField} name="phone" value={form.phone} onChange={handleInput} placeholder="WA Phone (e.g. 9198...)" type="text" style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#e0ffe0', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <input type="checkbox" checked={form.whatsappEnabled} onChange={e => setForm(f => ({ ...f, whatsappEnabled: e.target.checked }))} />
                <span>Enable Alerts</span>
              </label>
            </div>

            <div style={{ margin: '1rem 0' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Category Groups Visibility:</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {allCategoryGroups.map(group => (
                  <label key={group._id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem', background: '#f5f5f5', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                    <input
                      type="checkbox"
                      checked={(form.categoryGroups || []).includes(group.name)}
                      onChange={() => handleGroupToggle(group.name)}
                    />
                    {group.name}
                  </label>
                ))}
                {allCategoryGroups.length === 0 && <span style={{ color: '#888' }}>No category groups found.</span>}
              </div>
            </div>

            {/* Discovery Bridge Section */}
            {(form.categoryGroups || []).length > 0 && (
              <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(252, 128, 25, 0.05)', borderRadius: '20px', border: '1px dashed var(--color-primary)' }}>
                <label style={{ fontWeight: '800', display: 'block', marginBottom: '1rem', color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                  🎯 Discovery Bridge Assignment:
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {allCategoryGroups
                    .filter(g => form.categoryGroups.includes(g.name))
                    .flatMap(g => g.categories || [])
                    .map((cat, idx) => (
                      <label key={idx} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.8rem', background: 'white', padding: '0.6rem 1.2rem', borderRadius: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: (form.bridgeCategories || []).includes(cat.name) ? '2px solid var(--color-primary)' : '2px solid transparent' }}>
                        <input
                          type="checkbox"
                          checked={(form.bridgeCategories || []).includes(cat.name)}
                          onChange={() => handleBridgeToggle(cat.name)}
                        />
                        <img src={(cat.image && (cat.image.startsWith('http') || cat.image.startsWith('data:'))) ? cat.image : `/uploads/${cat.image}`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{cat.name}</span>
                      </label>
                    ))}
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                  Selecting these ensures the restaurant appears when users click specific icons (like Veg/Non-Veg) in the Home Section.
                </p>
              </div>
            )}

            <div className={css.fileInputWrapper}>
              <label>Restaurant Thumbnail Image:</label>
              <input className={css.inputField} name="image" type="file" accept="image/*" onChange={handleInput} disabled={isCompressing} />
              {isCompressing && <span className={css.compressionStatus}>Compressing image...</span>}
              {!isCompressing && compressionResult?.wasCompressed && (
                <span className={css.compressionResult}>
                  Optimized: {(compressionResult.compressedSize / 1024).toFixed(0)}KB (↓{compressionResult.savings}%)
                </span>
              )}
            </div>

            <button type="submit" className={css.addBtn} style={{ width: '100%' }}>
              {editingId ? 'Save Changes' : 'Create Restaurant'}
            </button>
          </form>
        )}

        {error && <div style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{error}</div>}
        {success && <div style={{ color: '#00ff88', marginBottom: '1rem' }}>{success}</div>}

        {loading ? (
          <div className={css.loadingState}>
            <LoadingScreen />
            <p>Scanning Mahalingapura Logistics fleet...</p>
          </div>
        ) : (
          <div className={css.restaurantGrid}>
            {restaurants.length === 0 ? (
              <div className={css.emptyFleet}>
                <div className={css.emptyIcon}>🚜</div>
                <h3>No merchants found in the fleet</h3>
                <p>Start by adding your first restaurant to the discovery layer.</p>
              </div>
            ) : (
              restaurants.map(r => (
                <div key={r._id} className={css.merchantCard}>
                  <div className={css.merchantHeader}>
                    <div className={css.merchantImg}>
                      <img
                        src={(r.image && (r.image.startsWith('http') || r.image.startsWith('data:'))) ? r.image : `/uploads/${r.image}`}
                        alt={r.name}
                        loading="lazy"
                      />
                      <div className={css.ratingBadge}>★ {r.rating}</div>
                    </div>
                    <div className={css.merchantActions}>
                      <button onClick={() => handleEditInit(r)} className={css.iconBtn} title="Update Basic Info">✏️</button>
                      <button
                        onClick={() => handleToggleStatus(r._id, r.isActive)}
                        className={css.iconBtn}
                        title={r.isActive !== false ? "Disable" : "Enable"}
                        style={{ opacity: r.isActive !== false ? 1 : 0.5 }}
                      >
                        {r.isActive !== false ? '🟢' : '🔴'}
                      </button>
                      <button onClick={() => handleDelete(r._id)} className={`${css.iconBtn} ${css.delBtn}`} title="Remove from Fleet">🗑️</button>
                    </div>
                  </div>

                  <div className={css.merchantBody}>
                    <h3 className={css.merchantName}>{r.name}</h3>
                    <p className={css.merchantAddress}>{r.address}</p>

                    <div className={css.merchantStats}>
                      <div className={css.statItem}>
                        <span className={css.statVal}>{r.categoryCount || 0}</span>
                        <span className={css.statLab}>Categories</span>
                      </div>
                      <div className={css.statDivider}></div>
                      <div className={css.statItem}>
                        <span className={css.statVal}>{r.itemCount || 0}</span>
                        <span className={css.statLab}>Live Items</span>
                      </div>
                      <div className={css.statDivider}></div>
                      <div className={css.statItem}>
                        <span className={css.statVal}>{r.deliveryTime}m</span>
                        <span className={css.statLab}>Fulfillment</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/restaurants/${r._id}/manage`)}
                      className={css.manageFleetBtn}
                    >
                      <span>🍴</span> Manage Menu & Prices
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout >
  );
};

export default AdminRestaurants;
