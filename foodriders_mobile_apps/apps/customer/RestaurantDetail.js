import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ScrollView, SectionList, ActivityIndicator, Alert, Image
} from 'react-native';
import api from '../../shared/api/axios';
import { useCart } from './CartContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function RestaurantDetail({ route }) {
    const { restaurantId, name } = route.params;
    const [restaurant, setRestaurant] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const { cart, addItem, removeItem, totalItems, subtotal } = useCart();
    const navigation = useNavigation();

    useEffect(() => {
        fetchMenu();
    }, [restaurantId]);

    const fetchMenu = async () => {
        try {
            const resp = await api.get(`/restaurant/${restaurantId}`);
            setRestaurant(resp.data);
            const cats = (resp.data.categories || []).map(cat => ({
                title: cat.name,
                data: (cat.items || []).filter(item => item.isAvailable !== false),
            })).filter(s => s.data.length > 0);
            setSections(cats);
        } catch (err) {
            console.error('Restaurant detail error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (item) => {
        // Check if adding from a different restaurant
        if (cart.restaurantName && cart.restaurantName !== name && cart.items.length > 0) {
            Alert.alert(
                'Different Restaurant',
                'Your cart has items from another restaurant. Do you want to clear it and start fresh?',
                [
                    { text: 'Keep Current', style: 'cancel' },
                    {
                        text: 'Start Fresh',
                        onPress: () => {
                            clearCart();
                            addItem(item, name, restaurantId);
                        }
                    }
                ]
            );
            return;
        }
        addItem(item, name, restaurantId);
    };

    const getItemQuantity = (itemName) => {
        const found = cart.items.find(i => i.name === itemName);
        return found ? found.quantity : 0;
    };

    const renderItem = ({ item }) => {
        const qty = getItemQuantity(item.name);
        return (
            <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                    {item.isVeg !== undefined && (
                        <View style={[styles.vegBadge, { borderColor: item.isVeg ? '#4CAF50' : '#ed1c24' }]}>
                            <View style={[styles.vegDot, { backgroundColor: item.isVeg ? '#4CAF50' : '#ed1c24' }]} />
                        </View>
                    )}
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description ? <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text> : null}
                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                </View>

                <View style={styles.itemRight}>
                    {item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl.startsWith('data:') ? item.imageUrl : `https://www.foodriders.in${item.imageUrl}` }}
                            style={styles.itemImage}
                        />
                    ) : null}
                    {qty === 0 ? (
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
                            <Text style={styles.addBtnText}>ADD</Text>
                            <Plus color="#ed1c24" size={14} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.qtyControl}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item)}>
                                <Minus color="#fff" size={14} />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{qty}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAdd(item)}>
                                <Plus color="#fff" size={14} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderSectionHeader = ({ section: { title } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#ed1c24" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Restaurant Top Info */}
            {restaurant && (
                <View style={styles.restHeader}>
                    {restaurant.imageUrl ? (
                        <Image
                            source={{ uri: restaurant.imageUrl.startsWith('data:') ? restaurant.imageUrl : `https://www.foodriders.in${restaurant.imageUrl}` }}
                            style={styles.restImage}
                        />
                    ) : <View style={styles.restImagePlaceholder}><Text style={{ fontSize: 48 }}>🍽️</Text></View>}
                    <View style={styles.restOverlay}>
                        <Text style={styles.restName}>{restaurant.name}</Text>
                        <Text style={styles.restMeta}>{restaurant.cuisineType || 'Restaurant'} • {restaurant.deliveryTime || '30-45'} min</Text>
                    </View>
                </View>
            )}

            <SectionList
                sections={sections}
                keyExtractor={(item, index) => item.name + index}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No items available</Text></View>}
            />

            {/* Cart Footer */}
            {totalItems > 0 && (
                <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
                    <View style={styles.cartBarLeft}>
                        <View style={styles.cartCount}>
                            <Text style={styles.cartCountText}>{totalItems}</Text>
                        </View>
                        <Text style={styles.cartBarText}>View Cart</Text>
                    </View>
                    <Text style={styles.cartBarTotal}>₹{subtotal}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    restHeader: { height: 200, position: 'relative' },
    restImage: { width: '100%', height: '100%' },
    restImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#ffeee0', justifyContent: 'center', alignItems: 'center' },
    restOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: 15 },
    restName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    restMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
    sectionHeader: { backgroundColor: '#f0f0f0', paddingVertical: 8, paddingHorizontal: 15, borderLeftWidth: 4, borderLeftColor: '#ed1c24' },
    sectionHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#333', textTransform: 'uppercase', letterSpacing: 0.5 },
    listContent: { paddingBottom: 100 },
    itemCard: { backgroundColor: '#fff', flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'flex-start' },
    itemInfo: { flex: 1, paddingRight: 10 },
    vegBadge: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    vegDot: { width: 8, height: 8, borderRadius: 4 },
    itemName: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
    itemDesc: { fontSize: 12, color: '#888', lineHeight: 17, marginBottom: 6 },
    itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#222' },
    itemRight: { alignItems: 'center', justifyContent: 'flex-end' },
    itemImage: { width: 90, height: 80, borderRadius: 10, marginBottom: 8, backgroundColor: '#f0f0f0' },
    addBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#ed1c24', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, gap: 4, backgroundColor: '#fff' },
    addBtnText: { color: '#ed1c24', fontWeight: 'bold', fontSize: 13 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ed1c24', borderRadius: 8, overflow: 'hidden' },
    qtyBtn: { padding: 8 },
    qtyText: { color: '#fff', fontWeight: 'bold', paddingHorizontal: 10, fontSize: 15 },
    emptyContainer: { padding: 50, alignItems: 'center' },
    emptyText: { color: '#aaa', fontSize: 16 },
    cartBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#ed1c24', flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 16, paddingHorizontal: 20,
        elevation: 10, shadowColor: '#ed1c24', shadowOpacity: 0.4, shadowRadius: 8,
    },
    cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cartCount: { backgroundColor: 'rgba(255,255,255,0.3)', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    cartCountText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    cartBarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cartBarTotal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
