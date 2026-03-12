import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Bell, ShieldCheck } from 'lucide-react-native';

export default function AdminProfile({ navigation }) {
    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    // You need to reset the navigation stack to root
                    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                }
            }
        ]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>A</Text>
                </View>
                <Text style={styles.name}>Admin Panel</Text>
                <Text style={styles.role}>Restaurant Owner</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Settings</Text>
                <TouchableOpacity style={styles.row}>
                    <Bell color="#555" size={20} />
                    <Text style={styles.rowText}>Notification Preferences</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.row}>
                    <ShieldCheck color="#555" size={20} />
                    <Text style={styles.rowText}>Change PIN</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut color="#fff" size={20} />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f4' },
    header: { backgroundColor: '#ed1c24', alignItems: 'center', paddingVertical: 40 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
    name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    role: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 5 },
    section: { backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 10, elevation: 2 },
    sectionTitle: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 5, paddingHorizontal: 10 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    rowText: { marginLeft: 15, fontSize: 15, color: '#333' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed1c24', margin: 15, borderRadius: 12, padding: 16 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});
