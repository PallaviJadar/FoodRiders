import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { Package, ChevronRight } from 'lucide-react-native';

const STATUS_COLOR = {
    'CREATED': '#FF9800',
    'ACCEPTED': '#2196F3',
    'PREPARING': '#9C27B0',
    'OUT_FOR_DELIVERY': '#FF6600',
    'DELIVERED': '#4CAF50',
    'CANCELLED': '#9E9E9E',
};

export default function CustomerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchOrders = async () => {
        try {
            const resp = await api.get('/user/orders');
            setOrders(resp.data || []);
        } catch (err) {
            console.error('Fetch user orders error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchOrders(); }, []));

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const renderOrder = ({ item }) => {
        const statusColor = STATUS_COLOR[item.status] || '#888';
        const isActive = !['DELIVERED', 'CANCELLED'].includes(item.status);

        return (
            <TouchableOpacity
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => navigation.navigate('TrackOrder', { orderId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>#{item._id.toString().slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{item.status?.replace(/_/g, ' ')}</Text>
                    </View>
                </View>

                <Text style={styles.restName}>{item.restaurantName || item.items?.[0]?.restaurant}</Text>

                <View style={styles.itemsList}>
                    {(item.items || []).slice(0, 3).map((i, idx) => (
                        <Text key={idx} style={styles.itemText}>{i.quantity}x {i.name}</Text>
                    ))}
                    {item.items?.length > 3 && (
                        <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.total}>₹{item.totalAmount}</Text>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.trackRow}>
                        {isActive && <Text style={styles.trackLabel}>Track Order</Text>}
                        <ChevronRight color="#ccc" size={20} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#ed1c24" /></View>;
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={item => item._id}
            renderItem={renderOrder}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ed1c24" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.empty}>
                    <Package color="#ddd" size={80} />
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
    cardActive: { borderLeftWidth: 4, borderLeftColor: '#ed1c24' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderId: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    restName: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
    itemsList: { marginBottom: 10 },
    itemText: { color: '#888', fontSize: 13, marginBottom: 2 },
    moreItems: { color: '#aaa', fontSize: 12, fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    total: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    date: { color: '#aaa', fontSize: 12, marginTop: 2 },
    trackRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trackLabel: { color: '#ed1c24', fontSize: 13, fontWeight: '600' },
    empty: { padding: 60, alignItems: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 20 },
    emptySubtitle: { color: '#aaa', marginTop: 8, fontSize: 14 },
});
