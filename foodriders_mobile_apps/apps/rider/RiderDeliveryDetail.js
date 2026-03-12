import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Linking, Platform
} from 'react-native';
import api from '../../shared/api/axios';
import { MapPin, Phone, Navigation, CheckCircle } from 'lucide-react-native';

const RIDER_STATUS_STEPS = [
    { key: 'ASSIGNED', label: 'Assigned', desc: 'You have been assigned this delivery' },
    { key: 'ACCEPTED', label: 'Order Accepted', desc: 'You accepted this delivery task' },
    { key: 'PICKED_UP', label: 'Picked Up', desc: 'Order picked up from restaurant' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Heading to customer location' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Order handed over to customer' },
];

const openMaps = (lat, lng, label) => {
    const scheme = Platform.OS === 'ios' ? 'maps://' : 'geo:';
    const url = Platform.select({
        ios: `${scheme}?daddr=${lat},${lng}&q=${encodeURIComponent(label || 'Destination')}`,
        android: `${scheme}${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label || 'Destination')})`,
    });
    Linking.openURL(url).catch(() => {
        // Fallback to Google Maps
        Linking.openURL(`https://maps.google.com/?daddr=${lat},${lng}`);
    });
};

export default function RiderDeliveryDetail({ route }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        try {
            const resp = await api.get(`/orders/${orderId}`);
            setOrder(resp.data);
        } catch (err) {
            Alert.alert('Error', 'Order not found');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus) => {
        setSubmitting(true);
        try {
            await api.post('/orders/update-status', {
                orderId,
                newStatus,
                role: 'delivery'
            });
            await fetchOrder();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#FF6600" /></View>;
    }

    if (!order) {
        return <View style={styles.centered}><Text>Order not found</Text></View>;
    }

    const currentStatus = order.status;
    const currentStepIndex = RIDER_STATUS_STEPS.findIndex(s => s.key === currentStatus);
    const isDone = currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED';

    const CustomerLocation = () => {
        const lat = order.userDetails?.latitude || order.customerLocation?.lat;
        const lng = order.userDetails?.longitude || order.customerLocation?.lng;
        if (!lat || !lng) return null;
        return (
            <TouchableOpacity style={styles.mapBtn} onPress={() => openMaps(lat, lng, 'Customer Location')}>
                <Navigation color="#fff" size={18} />
                <Text style={styles.mapBtnText}>Navigate to Customer</Text>
            </TouchableOpacity>
        );
    };

    const RestaurantLocation = () => {
        const location = order.shopLocation;
        if (!location?.lat || !location?.lng) return null;
        return (
            <TouchableOpacity style={[styles.mapBtn, styles.mapBtnSecondary]} onPress={() => openMaps(location.lat, location.lng, order.restaurantName)}>
                <Navigation color="#fff" size={18} />
                <Text style={styles.mapBtnText}>Navigate to Restaurant</Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Progress Steps */}
            <View style={styles.progressCard}>
                <Text style={styles.cardTitle}>Delivery Progress</Text>
                {RIDER_STATUS_STEPS.map((step, idx) => {
                    const done = idx < currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                        <View key={step.key} style={styles.stepRow}>
                            <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                                {done ? <CheckCircle color="#fff" size={12} /> : <Text style={styles.stepNum}>{idx + 1}</Text>}
                            </View>
                            {idx < RIDER_STATUS_STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                            <View style={styles.stepContent}>
                                <Text style={[styles.stepLabel, (done || active) && styles.stepLabelDone]}>{step.label}</Text>
                                {active && <Text style={styles.stepDesc}>{step.desc}</Text>}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Pickup Details */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🍔 Pickup From</Text>
                <Text style={styles.restName}>{order.restaurantName}</Text>
                <View style={styles.row}>
                    <MapPin color="#FF6600" size={16} />
                    <Text style={styles.address}>{order.restaurantAddress || 'No address on file'}</Text>
                </View>
                <RestaurantLocation />
            </View>

            {/* Delivery Details */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📦 Deliver To</Text>
                <Text style={styles.customerName}>{order.userDetails?.name}</Text>
                <View style={styles.row}>
                    <MapPin color="#4CAF50" size={16} />
                    <Text style={styles.address}>{order.userDetails?.address || order.userDetails?.fullAddress}</Text>
                </View>
                {order.userDetails?.mobile && (
                    <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${order.userDetails.mobile}`)}>
                        <Phone color="#fff" size={16} />
                        <Text style={styles.callBtnText}>Call Customer: {order.userDetails.mobile}</Text>
                    </TouchableOpacity>
                )}
                <CustomerLocation />
            </View>

            {/* Order Summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>📋 Order Summary</Text>
                {(order.items || []).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemText}>{item.quantity}x {item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.itemRow}>
                    <Text style={[styles.itemText, { fontWeight: 'bold' }]}>Total</Text>
                    <Text style={[styles.itemPrice, { fontWeight: 'bold' }]}>₹{order.totalAmount}</Text>
                </View>
                <Text style={[styles.paymentMode, { color: order.paymentMethod === 'COD' ? '#ed1c24' : '#4CAF50' }]}>
                    {order.paymentMethod === 'COD' ? '💵 Collect ₹' + order.totalAmount + ' Cash' : '✅ Already Paid'}
                </Text>
            </View>

            {/* Action Button */}
            {!isDone && (
                <View style={styles.actionCard}>
                    {currentStatus === 'ASSIGNED' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => updateStatus('ACCEPTED')} disabled={submitting}>
                            <Text style={styles.actionBtnText}>✅ Accept Delivery</Text>
                        </TouchableOpacity>
                    )}
                    {currentStatus === 'ACCEPTED' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => updateStatus('PICKED_UP')} disabled={submitting}>
                            <Text style={styles.actionBtnText}>📦 Mark Picked Up</Text>
                        </TouchableOpacity>
                    )}
                    {currentStatus === 'PICKED_UP' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => updateStatus('OUT_FOR_DELIVERY')} disabled={submitting}>
                            <Text style={styles.actionBtnText}>🛵 Start Delivery</Text>
                        </TouchableOpacity>
                    )}
                    {currentStatus === 'OUT_FOR_DELIVERY' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.greenBtn]} onPress={() => {
                            Alert.alert('Confirm', 'Mark order as delivered? You will not be able to undo this.', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Mark Delivered', onPress: () => updateStatus('DELIVERED') }
                            ]);
                        }} disabled={submitting}>
                            <Text style={styles.actionBtnText}>✅ Mark Delivered</Text>
                        </TouchableOpacity>
                    )}
                    {submitting && <ActivityIndicator style={{ marginTop: 15 }} color="#FF6600" />}
                </View>
            )}

            {isDone && (
                <View style={styles.doneCard}>
                    <CheckCircle color={currentStatus === 'DELIVERED' ? '#4CAF50' : '#9E9E9E'} size={48} />
                    <Text style={styles.doneText}>{currentStatus === 'DELIVERED' ? '🎉 Delivered Successfully!' : '❌ Order Cancelled'}</Text>
                </View>
            )}

            <View style={{ height: 30 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
    progressCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', zIndex: 1, marginRight: 12 },
    stepDotDone: { backgroundColor: '#4CAF50' },
    stepDotActive: { backgroundColor: '#FF6600' },
    stepNum: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
    stepLine: { position: 'absolute', left: 11, top: 24, width: 2, height: 28, backgroundColor: '#ddd' },
    stepLineDone: { backgroundColor: '#4CAF50' },
    stepContent: { flex: 1, paddingBottom: 16 },
    stepLabel: { fontSize: 14, color: '#aaa' },
    stepLabelDone: { color: '#333', fontWeight: '600' },
    stepDesc: { fontSize: 12, color: '#FF6600', marginTop: 2 },
    restName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    customerName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    address: { flex: 1, marginLeft: 8, color: '#555', fontSize: 14, lineHeight: 20 },
    mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6600', padding: 12, borderRadius: 10, justifyContent: 'center', gap: 8, marginTop: 5 },
    mapBtnSecondary: { backgroundColor: '#5c5c5c' },
    mapBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, justifyContent: 'center', gap: 8, marginBottom: 8 },
    callBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    itemText: { color: '#444', fontSize: 14, flex: 1 },
    itemPrice: { color: '#333', fontSize: 14 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
    paymentMode: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
    actionCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2 },
    actionBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
    acceptBtn: { backgroundColor: '#4CAF50' },
    primaryBtn: { backgroundColor: '#FF6600' },
    greenBtn: { backgroundColor: '#2e7d32' },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    doneCard: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 30, alignItems: 'center', elevation: 2 },
    doneText: { fontSize: 18, fontWeight: 'bold', marginTop: 16, color: '#333' },
});
