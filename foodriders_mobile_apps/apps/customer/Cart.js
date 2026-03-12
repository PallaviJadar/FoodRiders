import React from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from './CartContext';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react-native';

export default function Cart() {
    const navigation = useNavigation();
    const { cart, addItem, removeItem, clearCart, totalItems, subtotal } = useCart();
    const DELIVERY_FEE = subtotal > 0 ? 30 : 0;

    if (!cart.items || cart.items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ShoppingBag color="#ddd" size={90} />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Add items from a restaurant to get started</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.browseBtnText}>Browse Restaurants</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemRestaurant}>{item.restaurant}</Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>

            <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item)}>
                    {item.quantity === 1 ? <Trash2 color="#ed1c24" size={16} /> : <Minus color="#fff" size={16} />}
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addItem(item, item.restaurant, cart.restaurantId)}>
                    <Plus color="#fff" size={16} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Restaurant Info */}
            <View style={styles.restBanner}>
                <Text style={styles.restBannerText}>{cart.restaurantName}</Text>
            </View>

            <FlatList
                data={cart.items}
                keyExtractor={(item, idx) => item.name + idx}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />

            {/* Order Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <SummaryRow label="Subtotal" value={`₹${subtotal}`} />
                <SummaryRow label="Delivery Fee" value={`₹${DELIVERY_FEE}`} />
                <View style={styles.divider} />
                <SummaryRow label="Total" value={`₹${subtotal + DELIVERY_FEE}`} bold />
            </View>

            {/* Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
                    <Text style={styles.clearBtnText}>Clear Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => navigation.navigate('Checkout')}
                >
                    <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const SummaryRow = ({ label, value, bold }) => (
    <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, bold && styles.bold]}>{label}</Text>
        <Text style={[styles.summaryValue, bold && styles.bold]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
    emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#444', marginTop: 20 },
    emptySubtitle: { color: '#aaa', textAlign: 'center', marginTop: 10, lineHeight: 22 },
    browseBtn: { backgroundColor: '#ed1c24', paddingHorizontal: 30, paddingVertical: 13, borderRadius: 12, marginTop: 25 },
    browseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    restBanner: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    restBannerText: { fontSize: 15, color: '#555', fontWeight: '600' },
    listContent: { paddingHorizontal: 15, paddingTop: 10 },
    itemCard: { backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, elevation: 1 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '600', color: '#222' },
    itemRestaurant: { color: '#aaa', fontSize: 12, marginTop: 2, marginBottom: 5 },
    itemPrice: { color: '#ed1c24', fontWeight: 'bold', fontSize: 15 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ed1c24', borderRadius: 10, overflow: 'hidden' },
    qtyBtn: { padding: 10 },
    qtyText: { color: '#fff', fontWeight: 'bold', paddingHorizontal: 12, fontSize: 15 },
    summaryCard: { backgroundColor: '#fff', margin: 15, borderRadius: 14, padding: 16, elevation: 2 },
    summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#555', fontSize: 14 },
    summaryValue: { color: '#333', fontSize: 14 },
    bold: { fontWeight: 'bold', fontSize: 15, color: '#222' },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
    footer: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 25, gap: 10 },
    clearBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ed1c24', borderRadius: 12, padding: 14, alignItems: 'center' },
    clearBtnText: { color: '#ed1c24', fontWeight: 'bold', fontSize: 14 },
    checkoutBtn: { flex: 2, backgroundColor: '#ed1c24', borderRadius: 12, padding: 14, alignItems: 'center' },
    checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
