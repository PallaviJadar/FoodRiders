import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { CheckCircle, XCircle } from 'lucide-react-native';

export default function RiderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        try {
            const resp = await api.get('/delivery/my-deliveries?status=completed');
            setOrders(resp.data || []);
        } catch (err) {
            console.error('Rider history error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchHistory(); }, []));

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#FF6600" /></View>;
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor="#FF6600" />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No completed deliveries</Text></View>}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <View style={styles.row}>
                        {item.status === 'DELIVERED' ? <CheckCircle color="#4CAF50" size={20} /> : <XCircle color="#9E9E9E" size={20} />}
                        <Text style={styles.orderId}>#{item._id.toString().slice(-6).toUpperCase()}</Text>
                        <Text style={styles.amount}>₹{item.totalAmount}</Text>
                    </View>
                    <Text style={styles.restName}>{item.restaurantName}</Text>
                    <Text style={styles.customer}>{item.userDetails?.name} • {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    orderId: { fontSize: 15, fontWeight: 'bold', flex: 1 },
    amount: { fontSize: 15, fontWeight: 'bold', color: '#FF6600' },
    restName: { color: '#555', fontSize: 14, marginBottom: 4 },
    customer: { color: '#aaa', fontSize: 13 },
    empty: { padding: 50, alignItems: 'center' },
    emptyText: { color: '#aaa', fontSize: 16 },
});
