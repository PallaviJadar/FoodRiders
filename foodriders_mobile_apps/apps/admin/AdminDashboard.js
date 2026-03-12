import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Alert, Vibration
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { ENDPOINTS } from '../../shared/api/endpoints';
import { Package, MapPin, CreditCard, ChevronRight } from 'lucide-react-native';
import { stopSiren } from '../../shared/utils/siren';

export default function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchOrders = async () => {
        try {
            const resp = await api.get(ENDPOINTS.GET_LIVE_ORDERS);
            setOrders(resp.data);

            // If there are 'CREATED' orders, vibrate for attention
            const hasNewOrder = resp.data.some(o => o.status === 'CREATED' || o.status === 'PAYMENT_PENDING');
            if (hasNewOrder) {
                Vibration.vibrate([0, 500, 200, 500]);
            } else {
                stopSiren(); // Stop if all handled
            }
        } catch (err) {
            console.error('Fetch live orders error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
            const interval = setInterval(fetchOrders, 30000); // 30 sec poll
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderOrderItem = ({ item }) => {
        const statusColor = {
            'CREATED': '#ed1c24',
            'ACCEPTED': '#2196F3',
            'OUT_FOR_DELIVERY': '#FF9800',
            'DELIVERED': '#4CAF50',
            'CANCELLED': '#9E9E9E',
        }[item.status] || '#555';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    stopSiren();
                    navigation.navigate('AdminOrderDetail', { orderId: item._id });
                }}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>#{item._id.toString().slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <Package color="#555" size={16} />
                        <Text style={styles.infoText}>₹{item.totalAmount} • {item.items.length} Items</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MapPin color="#555" size={16} />
                        <Text style={styles.infoText} numberOfLines={1}>{item.userDetails?.address || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <CreditCard color="#555" size={16} />
                        <Text style={styles.infoText}>{item.paymentMethod}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <ChevronRight color="#888" size={20} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ed1c24" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No live orders at the moment.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ed1c24" />}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    cardBody: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    infoText: { marginLeft: 10, color: '#666', fontSize: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    time: { color: '#aaa', fontSize: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#888', fontSize: 16 },
});
