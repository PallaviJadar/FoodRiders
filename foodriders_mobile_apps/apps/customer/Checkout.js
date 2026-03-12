import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../shared/api/axios';
import { useCart } from './CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react-native';

const DELIVERY_FEE = 30;
const PAYMENT_METHODS = [
    { key: 'COD', label: 'Cash on Delivery', icon: Banknote, color: '#4CAF50' },
    { key: 'RAZORPAY', label: 'Pay Online (Razorpay)', icon: CreditCard, color: '#2196F3' },
    { key: 'UPI_MANUAL', label: 'UPI (Manual)', icon: Smartphone, color: '#9C27B0' },
];

export default function Checkout() {
    const navigation = useNavigation();
    const { cart, subtotal, clearCart } = useCart();

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('Mahalingapura');
    const [pinCode, setPinCode] = useState('587312');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const totalAmount = subtotal + DELIVERY_FEE;

    const placeOrder = async () => {
        if (!name.trim() || !mobile.trim() || !address.trim()) {
            Alert.alert('Missing Info', 'Please fill in your name, phone number, and delivery address.');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
            return;
        }

        setLoading(true);
        try {
            const userData = await AsyncStorage.getItem('userData');
            const user = userData ? JSON.parse(userData) : null;
            const userId = user?._id || user?.id;

            if (!userId) {
                Alert.alert('Not Logged In', 'Please log in to place an order.');
                navigation.navigate('Auth');
                return;
            }

            const orderPayload = {
                userId,
                userDetails: {
                    name: name.trim(),
                    mobile: mobile.trim(),
                    address: address.trim(),
                    townCity: area,
                    pinCode,
                },
                items: cart.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    restaurant: item.restaurant,
                })),
                totalAmount,
                paymentMode: paymentMethod,
                deliveryCharge: DELIVERY_FEE,
                order_notes: notes.trim() || null,
            };

            const resp = await api.post('/orders/create', orderPayload);

            if (resp.data.isDraft && paymentMethod === 'RAZORPAY') {
                // Handle Razorpay — in a real app, open Razorpay checkout here
                Alert.alert('Razorpay', 'Razorpay payment flow would open here. For now, order draft was created.', [
                    { text: 'OK', onPress: () => { clearCart(); navigation.navigate('Orders'); } }
                ]);
                return;
            }

            clearCart();
            const orderId = resp.data.orderId || resp.data._id;
            Alert.alert('Order Placed! 🎉', `Your order #${orderId?.toString().slice(-6).toUpperCase()} has been placed successfully!`, [
                { text: 'Track Order', onPress: () => navigation.navigate('TrackOrder', { orderId }) },
                { text: 'OK', onPress: () => navigation.navigate('Orders') }
            ]);
        } catch (err) {
            const msg = err.response?.data?.error || err.message || 'Order failed';
            Alert.alert('Order Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Delivery Address */}
            <View style={styles.section}>
                <View style={styles.sectionTitle}>
                    <MapPin color="#ed1c24" size={18} />
                    <Text style={styles.sectionTitleText}>Delivery Details</Text>
                </View>
                <Field label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
                <Field label="Mobile Number" value={mobile} onChangeText={setMobile} placeholder="10-digit number" keyboardType="numeric" maxLength={10} />
                <Field label="Full Address" value={address} onChangeText={setAddress} placeholder="House / Flat, Street, Landmark" multiline />
                <Field label="Area / Town" value={area} onChangeText={setArea} placeholder="Mahalingapura" />
                <Field label="PIN Code" value={pinCode} onChangeText={setPinCode} placeholder="587312" keyboardType="numeric" maxLength={6} />
                <Field label="Order Notes (optional)" value={notes} onChangeText={setNotes} placeholder="E.g. Leave at door" multiline />
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
                <View style={styles.sectionTitle}>
                    <CreditCard color="#ed1c24" size={18} />
                    <Text style={styles.sectionTitleText}>Payment Method</Text>
                </View>
                {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.key;
                    return (
                        <TouchableOpacity
                            key={method.key}
                            style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
                            onPress={() => setPaymentMethod(method.key)}
                        >
                            <Icon color={selected ? method.color : '#888'} size={20} />
                            <Text style={[styles.paymentLabel, selected && { color: method.color }]}>{method.label}</Text>
                            {selected && <View style={[styles.paymentCheck, { backgroundColor: method.color }]}><Text style={{ color: '#fff', fontSize: 10 }}>✓</Text></View>}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                {cart.items.map((item, idx) => (
                    <View key={idx} style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{item.quantity}x {item.name}</Text>
                        <Text style={styles.summaryValue}>₹{item.price * item.quantity}</Text>
                    </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{subtotal}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                    <Text style={styles.summaryValue}>₹{DELIVERY_FEE}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.totalLabel]}>Total</Text>
                    <Text style={[styles.summaryValue, styles.totalValue]}>₹{totalAmount}</Text>
                </View>
            </View>

            {/* Place Order Button */}
            <TouchableOpacity style={styles.placeOrderBtn} onPress={placeOrder} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderText}>Place Order • ₹{totalAmount}</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, maxLength }) {
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#ccc"
                multiline={multiline}
                keyboardType={keyboardType || 'default'}
                maxLength={maxLength}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    section: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 14, padding: 16, elevation: 2 },
    sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitleText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    field: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 },
    fieldInput: { borderBottomWidth: 1.5, borderBottomColor: '#eee', fontSize: 15, paddingVertical: 8, color: '#333' },
    fieldInputMulti: { minHeight: 70, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10 },
    paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', marginBottom: 10, gap: 12 },
    paymentOptionSelected: { borderColor: '#ed1c24', backgroundColor: '#fff8f8' },
    paymentLabel: { flex: 1, fontSize: 15, color: '#555', fontWeight: '500' },
    paymentCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#555', fontSize: 14 },
    summaryValue: { color: '#333', fontSize: 14 },
    totalLabel: { fontWeight: 'bold', fontSize: 15, color: '#222' },
    totalValue: { fontWeight: 'bold', fontSize: 15, color: '#ed1c24' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
    placeOrderBtn: { backgroundColor: '#ed1c24', margin: 15, borderRadius: 14, padding: 18, alignItems: 'center', elevation: 4, shadowColor: '#ed1c24', shadowOpacity: 0.4, shadowRadius: 8 },
    placeOrderText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
