import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
    TouchableOpacity, Alert
} from 'react-native';
import api from '../../shared/api/axios';
import { CheckCircle, Clock, Package, Bike, Home, XCircle } from 'lucide-react-native';

const STATUS_STEPS = [
    { key: 'CREATED', label: 'Order Placed', icon: Package, color: '#ed1c24' },
    { key: 'ACCEPTED', label: 'Accepted by Restaurant', icon: CheckCircle, color: '#2196F3' },
    { key: 'PREPARING', label: 'Being Prepared', icon: Clock, color: '#9C27B0' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Bike, color: '#FF9800' },
    { key: 'DELIVERED', label: 'Delivered!', icon: Home, color: '#4CAF50' },
];

export default function TrackOrder({ route }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = useCallback(async () => {
        try {
            const resp = await api.get(`/orders/${orderId}`);
            setOrder(resp.data);
        } catch (err) {
            console.error('Track order error:', err);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 20000); // Poll every 20s
        return () => clearInterval(interval);
    }, [fetchOrder]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#ed1c24" /></View>;
    }

    if (!order) {
        return <View style={styles.centered}><Text>Could not load order details.</Text></View>;
    }

    const isCancelled = order.status === 'CANCELLED';
    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Order ID Banner */}
            <View style={[styles.banner, isCancelled && styles.bannerCancelled]}>
                <Text style={styles.bannerLabel}>ORDER</Text>
                <Text style={styles.bannerOrderId}>#{order._id.toString().slice(-6).toUpperCase()}</Text>
                <Text style={styles.bannerStatus}>{order.status?.replace(/_/g, ' ')}</Text>
            </View>

            {/* Progress Tracker */}
            {!isCancelled ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Live Tracking</Text>
                    {STATUS_STEPS.map((step, idx) => {
                        const done = idx < currentStepIndex;
                        const active = idx === currentStepIndex;
                        const StepIcon = step.icon;
                        return (
                            <View key={step.key} style={styles.stepWrapper}>
                                <View style={styles.stepLeft}>
                                    <View style={[
                                        styles.stepIconWrap,
                                        done && { backgroundColor: '#4CAF50' },
                                        active && { backgroundColor: step.color },
                                        !done && !active && { backgroundColor: '#eee' }
                                    ]}>
                                        <StepIcon color={done || active ? '#fff' : '#ccc'} size={18} />
                                    </View>
                                    {idx < STATUS_STEPS.length - 1 && (
                                        <View style={[styles.stepConnector, done && styles.stepConnectorDone]} />
                                    )}
                                </View>
                                <View style={[styles.stepBody, idx < STATUS_STEPS.length - 1 && { marginBottom: 20 }]}>
                                    <Text style={[styles.stepLabel, (done || active) && { color: '#222', fontWeight: '700' }]}>
                                        {step.label}
                                    </Text>
                                    {active && <Text style={[styles.stepSub, { color: step.color }]}>In progress…</Text>}
                                    {done && <Text style={styles.stepSub}>✓ Done</Text>}
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View style={[styles.card, styles.cancelledCard]}>
                    <XCircle color="#ed1c24" size={50} />
                    <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                    {order.rejectReason && <Text style={styles.cancelledReason}>{order.rejectReason}</Text>}
                </View>
            )}

            {/* Delivery Details */}
            {order.deliveryBoyId && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🛵 Delivery Partner</Text>
                    <Text style={styles.riderName}>{order.deliveryBoyId.fullName || 'Assigned'}</Text>
                    {order.deliveryBoyId.mobile && (
                        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.deliveryBoyId.mobile}`)}>
                            <Text style={styles.callBtnText}>📞 Call Rider</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Order Items */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📦 Your Items</Text>
                {(order.items || []).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemText}>{item.quantity}x {item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.itemRow}>
                    <Text style={[styles.itemText, { fontWeight: 'bold' }]}>Total Paid</Text>
                    <Text style={[styles.itemPrice, { fontWeight: 'bold', color: '#ed1c24' }]}>₹{order.totalAmount}</Text>
                </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📍 Delivery Address</Text>
                <Text style={styles.address}>{order.userDetails?.name}</Text>
                <Text style={styles.address}>{order.userDetails?.address || order.userDetails?.fullAddress}</Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    banner: { backgroundColor: '#ed1c24', padding: 25, alignItems: 'center' },
    bannerCancelled: { backgroundColor: '#9E9E9E' },
    bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 2, marginBottom: 4 },
    bannerOrderId: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    bannerStatus: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    stepWrapper: { flexDirection: 'row' },
    stepLeft: { alignItems: 'center', marginRight: 14 },
    stepIconWrap: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    stepConnector: { width: 2, flex: 1, backgroundColor: '#e0e0e0', marginVertical: 4 },
    stepConnectorDone: { backgroundColor: '#4CAF50' },
    stepBody: { flex: 1, justifyContent: 'center' },
    stepLabel: { fontSize: 14, color: '#aaa' },
    stepSub: { fontSize: 12, color: '#aaa', marginTop: 3 },
    cancelledCard: { alignItems: 'center', paddingVertical: 30 },
    cancelledTitle: { fontSize: 20, fontWeight: 'bold', color: '#ed1c24', marginTop: 16 },
    cancelledReason: { color: '#888', marginTop: 8, textAlign: 'center' },
    riderName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
    callBtn: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center' },
    callBtnText: { color: '#fff', fontWeight: 'bold' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    itemText: { color: '#555', fontSize: 14, flex: 1 },
    itemPrice: { color: '#333', fontSize: 14 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
    address: { color: '#555', fontSize: 14, lineHeight: 22 },
});
