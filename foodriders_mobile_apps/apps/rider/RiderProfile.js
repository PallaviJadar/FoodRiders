import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Bike, Phone, Bell } from 'lucide-react-native';

export default function RiderProfile({ navigation }) {
    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure?', [
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Bike color="#fff" size={44} />
                </View>
                <Text style={styles.name}>Delivery Partner</Text>
                <Text style={styles.status}>🟢 Online</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.row}>
                    <Phone color="#555" size={20} />
                    <Text style={styles.rowText}>My Phone Number</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.row}>
                    <Bell color="#555" size={20} />
                    <Text style={styles.rowText}>Notification Settings</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut color="#fff" size={20} />
                <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#FF6600', alignItems: 'center', paddingVertical: 40 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    status: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 5 },
    section: { backgroundColor: '#fff', margin: 15, borderRadius: 12, overflow: 'hidden', elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    rowText: { marginLeft: 15, fontSize: 15, color: '#333' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ed1c24', margin: 15, borderRadius: 12, padding: 16 },
    logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});
