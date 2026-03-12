import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Image, Alert, Switch, ActivityIndicator, Modal,
    TextInput, ScrollView
} from 'react-native';
import api from '../../shared/api/axios';
import { Plus, Edit3, Trash2 } from 'lucide-react-native';

export default function AdminMenu() {
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [form, setForm] = useState({ name: '', price: '', description: '', isAvailable: true });

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const resp = await api.get('/restaurant');
            setRestaurants(resp.data || []);
            if (resp.data?.length > 0) {
                selectRestaurant(resp.data[0]);
            }
        } catch (err) {
            Alert.alert('Error', 'Could not fetch restaurants');
        } finally {
            setLoading(false);
        }
    };

    const selectRestaurant = async (rest) => {
        setSelectedRestaurant(rest);
        setLoading(true);
        try {
            const resp = await api.get(`/restaurant/${rest._id}`);
            setCategories(resp.data.categories || []);
        } catch (err) {
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleItemAvailability = async (categoryName, itemName, currentStatus) => {
        try {
            await api.put(`/restaurant/${selectedRestaurant._id}/category/${encodeURIComponent(categoryName)}/item/${encodeURIComponent(itemName)}/toggle`);
            selectRestaurant(selectedRestaurant); // Refresh
        } catch (err) {
            Alert.alert('Error', 'Could not update availability');
        }
    };

    const openEditModal = (category, item) => {
        setEditCategoryName(category);
        setEditItem(item);
        setForm({
            name: item.name,
            price: String(item.price),
            description: item.description || '',
            isAvailable: item.isAvailable !== false
        });
        setShowItemModal(true);
    };

    const openAddModal = (category) => {
        setEditCategoryName(category);
        setEditItem(null);
        setForm({ name: '', price: '', description: '', isAvailable: true });
        setShowItemModal(true);
    };

    const saveItem = async () => {
        if (!form.name || !form.price) {
            Alert.alert('Error', 'Name and price are required');
            return;
        }
        try {
            if (editItem) {
                // Edit existing item
                await api.put(`/restaurant/${selectedRestaurant._id}/menu-item`, {
                    categoryName: editCategoryName,
                    itemName: editItem.name,
                    updatedItem: { ...form, price: Number(form.price) }
                });
            } else {
                // Add new item
                await api.post(`/restaurant/${selectedRestaurant._id}/menu-item`, {
                    categoryName: editCategoryName,
                    item: { ...form, price: Number(form.price) }
                });
            }
            setShowItemModal(false);
            selectRestaurant(selectedRestaurant);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Save failed');
        }
    };

    const deleteItem = (categoryName, item) => {
        Alert.alert('Delete Item', `Remove "${item.name}" from menu?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/restaurant/${selectedRestaurant._id}/menu-item`, {
                            data: { categoryName, itemName: item.name }
                        });
                        selectRestaurant(selectedRestaurant);
                    } catch (err) {
                        Alert.alert('Error', 'Could not delete item');
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.centered}><ActivityIndicator size="large" color="#ed1c24" /></View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Restaurant Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.restPicker}>
                {restaurants.map(r => (
                    <TouchableOpacity
                        key={r._id}
                        style={[styles.restChip, selectedRestaurant?._id === r._id && styles.restChipActive]}
                        onPress={() => selectRestaurant(r)}
                    >
                        <Text style={[styles.restChipText, selectedRestaurant?._id === r._id && styles.restChipTextActive]}>
                            {r.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Categories & Items */}
            <FlatList
                data={categories}
                keyExtractor={(_, idx) => String(idx)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item: cat }) => (
                    <View style={styles.categoryCard}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <TouchableOpacity style={styles.addBtn} onPress={() => openAddModal(cat.name)}>
                                <Plus color="#fff" size={14} />
                                <Text style={styles.addBtnText}>Add Item</Text>
                            </TouchableOpacity>
                        </View>

                        {(cat.items || []).map((item, idx) => (
                            <View key={idx} style={styles.itemCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                                    {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
                                </View>

                                <View style={styles.itemActions}>
                                    <Switch
                                        value={item.isAvailable !== false}
                                        onValueChange={() => toggleItemAvailability(cat.name, item.name, item.isAvailable)}
                                        thumbColor={item.isAvailable !== false ? '#4CAF50' : '#f4f3f4'}
                                        trackColor={{ false: '#ccc', true: '#c8e6c9' }}
                                    />
                                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(cat.name, item)}>
                                        <Edit3 color="#2196F3" size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconBtn} onPress={() => deleteItem(cat.name, item)}>
                                        <Trash2 color="#ed1c24" size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            />

            {/* Add/Edit Item Modal */}
            <Modal visible={showItemModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>{editItem ? 'Edit Item' : 'Add New Item'}</Text>

                        <Text style={styles.fieldLabel}>Item Name</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={v => setForm({ ...form, name: v })}
                            placeholder="e.g. Paneer Butter Masala"
                        />

                        <Text style={styles.fieldLabel}>Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.price}
                            onChangeText={v => setForm({ ...form, price: v })}
                            placeholder="e.g. 150"
                            keyboardType="numeric"
                        />

                        <Text style={styles.fieldLabel}>Description (optional)</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 60 }]}
                            value={form.description}
                            onChangeText={v => setForm({ ...form, description: v })}
                            placeholder="Brief description"
                            multiline
                        />

                        <View style={styles.availRow}>
                            <Text style={styles.fieldLabel}>Available</Text>
                            <Switch
                                value={form.isAvailable}
                                onValueChange={v => setForm({ ...form, isAvailable: v })}
                                thumbColor={form.isAvailable ? '#4CAF50' : '#f4f3f4'}
                                trackColor={{ false: '#ccc', true: '#c8e6c9' }}
                            />
                        </View>

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={[styles.mBtn, styles.saveBtn]} onPress={saveItem}>
                                <Text style={styles.mBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.mBtn, styles.cancelModalBtn]} onPress={() => setShowItemModal(false)}>
                                <Text style={styles.mBtnTextDark}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    restPicker: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, maxHeight: 60 },
    restChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10 },
    restChipActive: { backgroundColor: '#ed1c24' },
    restChipText: { color: '#666', fontWeight: '600' },
    restChipTextActive: { color: '#fff' },
    listContent: { padding: 15 },
    categoryCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2 },
    categoryHeader: { backgroundColor: '#fff8f8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0e0e0' },
    categoryName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ed1c24', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: '#fff', marginLeft: 4, fontSize: 13, fontWeight: '600' },
    itemCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    itemName: { fontSize: 14, fontWeight: '600', color: '#333' },
    itemPrice: { color: '#ed1c24', fontWeight: 'bold', marginTop: 2 },
    itemDesc: { color: '#999', fontSize: 12, marginTop: 2 },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: { padding: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    fieldLabel: { fontSize: 13, color: '#666', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, textAlignVertical: 'top' },
    availRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
    mBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtn: { backgroundColor: '#ed1c24' },
    cancelModalBtn: { backgroundColor: '#eee' },
    mBtnText: { color: '#fff', fontWeight: 'bold' },
    mBtnTextDark: { color: '#333', fontWeight: 'bold' },
});
