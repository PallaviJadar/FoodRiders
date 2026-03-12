import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { authService } from '../../shared/api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

function LoginScreen({ navigation }) {
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = () => {
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            alert('Invalid phone number');
            return;
        }
        setLoading(true);
        // Simulation: Navigation to OTP screen
        // On a real device, you'd use Firebase Auth for OTP
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('VerifyOTP', { mobile });
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <Image source={require('./Logo.png')} style={styles.logo} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Phone number"
                    keyboardType="numeric"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                />
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={handleSendOTP}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
            </TouchableOpacity>
        </View>
    );
}

function VerifyOTPScreen({ route, navigation }) {
    const { mobile } = route.params;
    const [otp, setOtp] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (otp.length < 4 || pin.length < 4) {
            alert('Invalid OTP or PIN');
            return;
        }
        setLoading(true);
        try {
            // Step: In a real app, verify the firebase token here
            // const verifiedUser = await authService.verifyFirebaseToken('dummy-token');

            const response = await authService.loginOrSignup({
                mobile,
                pin,
                // Simulation of being verified
            });

            // Navigate to App root on success
            //navigation.replace('Main');
            // Trigger App.js refresh via state update is better but replace works
            // Actually navigate locally won't update userToken in App.js
            // We should use a Context/State Management for local session if possible
            // but simple enough: rely on App.js checking Storage
            Alert.alert('Success', 'Logged in successfully', [
                { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] }) }
            ]);
        } catch (err) {
            alert(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Verify it's you</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {mobile}</Text>
            <TextInput
                style={styles.inputFull}
                placeholder="OTP"
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
            />
            <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>
            <TextInput
                style={styles.inputFull}
                placeholder="PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={pin}
                onChangeText={setPin}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>
        </View>
    );
}

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
    logo: { width: 100, height: 100, marginBottom: 20, alignSelf: 'center', resizeMode: 'contain' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#ed1c24', marginBottom: 30 },
    prefix: { fontSize: 18, color: '#333', marginRight: 10, fontWeight: '600' },
    input: { flex: 1, fontSize: 18, paddingVertical: 10, color: '#333' },
    inputFull: { borderBottomWidth: 1.5, borderBottomColor: '#eee', marginBottom: 20, fontSize: 18, paddingVertical: 10, color: '#333' },
    button: { backgroundColor: '#ed1c24', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
