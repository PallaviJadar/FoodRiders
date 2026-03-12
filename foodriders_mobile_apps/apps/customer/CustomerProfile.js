import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../shared/api/axios';
import { LogOut, User, Bell, CreditCard, Wallet, PhoneCall } from 'lucide-react-native';

export default function CustomerProfile({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                setUser(JSON.parse(userData));
            }
            // Also try to refresh from API
            const resp = await api.get('/user/profile');
            setUser(resp.data);
            await AsyncStorage.setItem('userData', JSON.stringify(resp.data));
        } catch (err) {
            console.error('Profile load error:', err);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                }
            }
        ]);
    };

    const Initials = user?.fullName
        ? user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    {user?.profilePic ? (
                        <Image source={{ uri: user.profilePic }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{Initials}</Text>
                    )}
                </View>
                <Text style={styles.name}>{user?.fullName || 'Loading…'}</Text>
                <Text style={styles.mobile}>+91 {user?.mobile || ''}</Text>
                {user?.walletBalance > 0 && (
                    <View style={styles.walletBadge}>
                        <Wallet color="#fff" size={14} />
                        <Text style={styles.walletText}>₹{user.walletBalance} Wallet</Text>
                    </View>
                )}
            </View>

            {/* Account Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <SectionItem icon={<User color="#555" size={20} />} label="Edit Profile" />
                <SectionItem icon={<Bell color="#555" size={20} />} label="Notifications" />
                <SectionItem icon={<Wallet color="#555" size={20} />} label={`Wallet Balance: ₹${user?.walletBalance || 0}`} />
            </View>

            {/* Support */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <SectionItem icon={<PhoneCall color="#555" size={20} />} label="Contact Us" />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut color="#fff" size={20} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.appVersion}>FoodRiders v1.0.0</Text>
        </ScrollView>
    );
}

function SectionItem({ icon, label }) {
    return (
        <TouchableOpacity style={styles.sectionItem}>
            {icon}
            <Text style={styles.sectionItemText}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { backgroundColor: '#ed1c24', alignItems: 'center', paddingTop: 40, paddingBottom: 30 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
    avatarImage: { width: 90, height: 90 },
    avatarText: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
    name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    mobile: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
    walletBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12, gap: 6 },
    walletText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    section: { backgroundColor: '#fff', margin: 15, marginBottom: 0, borderRadius: 14, overflow: 'hidden', elevation: 2 },
    sectionTitle: { fontSize: 12, color: '#aaa', fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12 },
    sectionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 14 },
    sectionItemText: { fontSize: 15, color: '#333', flex: 1 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed1c24', margin: 15, marginTop: 20, borderRadius: 12, padding: 16, gap: 10 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    appVersion: { textAlign: 'center', color: '#ccc', fontSize: 12, marginBottom: 30 },
});
