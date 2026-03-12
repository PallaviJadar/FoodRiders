import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Vibration
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { MapPin, Package, Navigation } from 'lucide-react-native';
import { stopSiren } from '../../shared/utils/siren';

export default function RiderDeliveries() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchDeliveries = async () => {
        try {
            const resp = await api.get('/delivery/my-deliveries?status=active');
            const data = resp.data || [];
            setDeliveries(data);

            // Vibrate for new ASSIGNED deliveries
            const hasNew = data.some(d => d.status === 'ACCEPTED' || d.status === 'ASSIGNED');
            if (hasNew) {
                Vibration.vibrate([0, 400, 200, 400]);
            }
        } catch (err) {
            console.error('Rider deliveries error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDeliveries();
            const interval = setInterval(fetchDeliveries, 30000);
            return () => clearInterval(interval);
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDeliveries();
    };

    const renderDelivery = ({ item }) => {
        const statusColor = {
            'ASSIGNED': '#FF6600',
            'ACCEPTED': '#2196F3',
            'PICKED_UP': '#9C27B0',
            'OUT_FOR_DELIVERY': '#FF9800',
            'DELIVERED': '#4CAF50',
        }[item.status] || '#888';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    stopSiren();
                    navigation.navigate('RiderDeliveryDetail', { orderId: item._id });
                }}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>#{item._id.toString().slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{item.status?.replace(/_/g, ' ')}</Text>
                    </View>
                </View>

                <View style={styles.routeContainer}>
                    <View style={styles.routeStep}>
                        <View style={[styles.dot, { backgroundColor: '#FF6600' }]} />
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>PICKUP FROM</Text>
                            <Text style={styles.routeAddress} numberOfLines={1}>{item.restaurantName || 'Restaurant'}</Text>
                            <Text style={styles.routeAddressSmall} numberOfLines={1}>{item.restaurantAddress || ''}</Text>
                        </View>
                    </View>
                    <View style={styles.routeLine} />
                    <View style={styles.routeStep}>
                        <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        <View style={styles.routeInfo}>
                            <Text style={styles.routeLabel}>DELIVER TO</Text>
                            <Text style={styles.routeAddress} numberOfLines={1}>{item.userDetails?.name || 'Customer'}</Text>
                            <Text style={styles.routeAddressSmall} numberOfLines={1}>{item.userDetails?.address || ''}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.amount}>₹{item.totalAmount}</Text>
                    <View style={styles.navBtn}>
                        <Navigation color="#FF6600" size={16} />
                        <Text style={styles.navText}>Navigate</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#FF6600" /></View>;
    }

    return (
        <View style={styles.container}>
            {deliveries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Package color="#ddd" size={80} />
                    <Text style={styles.emptyTitle}>No active deliveries</Text>
                    <Text style={styles.emptySubtitle}>New orders will appear here when assigned by admin</Text>
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={item => item._id}
                    renderItem={renderDelivery}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6600" />}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    routeContainer: { marginBottom: 12 },
    routeStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 10, flexShrink: 0 },
    routeLine: { width: 2, height: 20, backgroundColor: '#ddd', marginLeft: 5, marginBottom: 4 },
    routeInfo: { flex: 1 },
    routeLabel: { fontSize: 10, color: '#aaa', fontWeight: 'bold', letterSpacing: 0.5 },
    routeAddress: { fontSize: 14, color: '#333', fontWeight: '600', marginTop: 1 },
    routeAddressSmall: { fontSize: 12, color: '#888', marginTop: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    navText: { color: '#FF6600', fontWeight: '600', fontSize: 14 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 20 },
    emptySubtitle: { color: '#aaa', textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
