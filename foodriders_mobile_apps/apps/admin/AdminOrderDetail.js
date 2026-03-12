import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import api from '../../shared/api/axios';
import { stopSiren } from '../../shared/utils/siren';

const STATUS_FLOW = [
    { key: 'CREATED', label: 'New Order', color: '#ed1c24' },
    { key: 'ACCEPTED', label: 'Accepted', color: '#2196F3' },
    { key: 'PREPARING', label: 'Preparing', color: '#9C27B0' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#FF9800' },
    { key: 'DELIVERED', label: 'Delivered', color: '#4CAF50' },
    { key: 'CANCELLED', label: 'Cancelled', color: '#9E9E9E' },
];

export default function AdminOrderDetail({ route }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [riders, setRiders] = useState([]);
    const [showRiderModal, setShowRiderModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        stopSiren(); // Stop siren when admin opens order
        fetchOrder();
        fetchRiders();
    }, []);

    const fetchOrder = async () => {
        try {
            const resp = await api.get(`/orders/${orderId}`);
            setOrder(resp.data);
        } catch (err) {
            Alert.alert('Error', 'Could not load order');
        } finally {
            setLoading(false);
        }
    };

    const fetchRiders = async () => {
        try {
            const resp = await api.get('/delivery/available-riders');
            setRiders(resp.data || []);
        } catch (err) {
            // Riders might not be available
        }
    };

    const updateStatus = async (newStatus) => {
        setSubmitting(true);
        try {
            await api.post('/orders/update-status', {
                orderId,
                newStatus,
                role: 'admin'
            });
            await fetchOrder();
            Alert.alert('Success', `Order status updated to ${newStatus}`);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const acceptOrder = () => {
        Alert.alert('Accept Order', 'Confirm acceptance of this order?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Accept', onPress: () => updateStatus('ACCEPTED') }
        ]);
    };

    const rejectOrder = () => {
        setShowCancelModal(true);
    };

    const confirmReject = async () => {
        setShowCancelModal(false);
        setSubmitting(true);
        try {
            await api.post(`/orders/${orderId}/cancel`, {
                reason: cancelReason || 'Rejected by admin',
                role: 'admin'
            });
            await fetchOrder();
            Alert.alert('Done', 'Order has been rejected');
        } catch (err) {
            Alert.alert('Error', 'Could not reject order');
        } finally {
            setSubmitting(false);
        }
    };

    const assignRider = async (riderId) => {
        setShowRiderModal(false);
        setSubmitting(true);
        try {
            await api.post('/delivery/assign', { orderId, riderId });
            await fetchOrder();
            Alert.alert('Rider Assigned', 'Delivery partner has been notified');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Assignment failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ed1c24" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text>Order not found.</Text>
            </View>
        );
    }

    const currentStatus = order.status;
    const isNew = currentStatus === 'CREATED' || currentStatus === 'PAYMENT_CONFIRMED' || currentStatus === 'USER_MARKED_PAID';
    const isAccepted = currentStatus === 'ACCEPTED';
    const isPreparing = currentStatus === 'PREPARING';
    const isOutForDelivery = currentStatus === 'OUT_FOR_DELIVERY';
    const isDone = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(currentStatus);

    return (
        <ScrollView style={styles.container}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: STATUS_FLOW.find(s => s.key === currentStatus)?.color || '#555' }]}>
                <Text style={styles.statusText}>{currentStatus.replace(/_/g, ' ')}</Text>
                <Text style={styles.orderId}>#{order._id.toString().slice(-6).toUpperCase()}</Text>
            </View>

            {/* Customer Details */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Customer</Text>
                <InfoRow label="Name" value={order.userDetails?.name || 'N/A'} />
                <InfoRow label="Phone" value={order.userDetails?.mobile || 'N/A'} />
                <InfoRow label="Address" value={order.userDetails?.address || order.userDetails?.fullAddress || 'N/A'} />
            </View>

            {/* Order Items */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🍽️ Order Items</Text>
                {(order.items || []).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
                <View style={styles.divider} />
                <InfoRow label="Subtotal" value={`₹${order.totalAmount}`} bold />
                <InfoRow label="Delivery Fee" value={`₹${order.deliveryFee || order.deliveryCharge || 0}`} />
                {order.couponDiscount > 0 && <InfoRow label="Coupon Discount" value={`-₹${order.couponDiscount}`} color="green" />}
                {order.walletAmountUsed > 0 && <InfoRow label="Wallet Used" value={`-₹${order.walletAmountUsed}`} color="green" />}
                <InfoRow label="Payment Method" value={order.paymentMethod} />
            </View>

            {/* Action Buttons */}
            {!isDone && (
                <View style={styles.actionsCard}>
                    <Text style={styles.cardTitle}>⚙️ Actions</Text>

                    {isNew && (
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={acceptOrder} disabled={submitting}>
                                <Text style={styles.btnText}>✅ Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={rejectOrder} disabled={submitting}>
                                <Text style={styles.btnText}>❌ Reject</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isAccepted && (
                        <>
                            <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => updateStatus('PREPARING')} disabled={submitting}>
                                <Text style={styles.btnTextDark}>🍳 Mark Preparing</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => setShowRiderModal(true)} disabled={submitting}>
                                <Text style={styles.btnText}>🛵 Assign Rider</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isPreparing && (
                        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => updateStatus('OUT_FOR_DELIVERY')} disabled={submitting}>
                            <Text style={styles.btnText}>📦 Mark Out for Delivery</Text>
                        </TouchableOpacity>
                    )}

                    {isOutForDelivery && (
                        <TouchableOpacity style={[styles.btn, styles.greenBtn]} onPress={() => updateStatus('DELIVERED')} disabled={submitting}>
                            <Text style={styles.btnText}>✅ Mark Delivered</Text>
                        </TouchableOpacity>
                    )}

                    {!isNew && (
                        <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={rejectOrder} disabled={submitting}>
                            <Text style={styles.btnText}>🚫 Cancel Order</Text>
                        </TouchableOpacity>
                    )}
                    {submitting && <ActivityIndicator style={{ marginTop: 15 }} color="#ed1c24" />}
                </View>
            )}

            {/* Rider Assignment Modal */}
            <Modal visible={showRiderModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Rider</Text>
                        {riders.length === 0 ? (
                            <Text style={styles.noRiders}>No riders available right now</Text>
                        ) : (
                            riders.map(rider => (
                                <TouchableOpacity key={rider._id} style={styles.riderItem} onPress={() => assignRider(rider._id)}>
                                    <Text style={styles.riderName}>{rider.fullName}</Text>
                                    <Text style={styles.riderPhone}>{rider.mobile}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowRiderModal(false)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Cancel Reason Modal */}
            <Modal visible={showCancelModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Reason for Rejection</Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Enter reason (optional)"
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                        />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={confirmReject}>
                                <Text style={styles.btnText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={() => setShowCancelModal(false)}>
                                <Text style={styles.btnTextDark}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const InfoRow = ({ label, value, bold, color }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, bold && { fontWeight: 'bold' }, color && { color }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusBanner: { padding: 20, alignItems: 'center' },
    statusText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
    orderId: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
    card: { backgroundColor: '#fff', margin: 15, marginBottom: 0, borderRadius: 12, padding: 15, elevation: 2 },
    actionsCard: { backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 15, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    infoLabel: { color: '#888', fontSize: 14 },
    infoValue: { color: '#333', fontSize: 14, maxWidth: '65%', textAlign: 'right' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    itemName: { color: '#444', fontSize: 14, flex: 1 },
    itemPrice: { color: '#333', fontSize: 14, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    btn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    acceptBtn: { backgroundColor: '#4CAF50' },
    rejectBtn: { backgroundColor: '#ed1c24' },
    primaryBtn: { backgroundColor: '#2196F3' },
    greenBtn: { backgroundColor: '#4CAF50' },
    secondaryBtn: { backgroundColor: '#eee' },
    cancelBtn: { backgroundColor: '#9E9E9E' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    btnTextDark: { color: '#333', fontWeight: 'bold', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    riderItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    riderName: { fontSize: 16, fontWeight: '600' },
    riderPhone: { color: '#888', marginTop: 3 },
    noRiders: { color: '#888', textAlign: 'center', padding: 20 },
    closeBtn: { backgroundColor: '#eee', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    closeBtnText: { fontWeight: 'bold' },
    reasonInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 20, minHeight: 80, textAlignVertical: 'top' },
});
