import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

// Shared Utilities
import { setupNotificationListeners, registerForPushNotificationsAsync } from './shared/utils/notifications';

// Auth Flow
import AuthStack from './apps/shared/AuthStack';

// App Modules (role-based)
import CustomerApp from './apps/customer/CustomerApp';
import AdminApp from './apps/admin/AdminApp';
import RiderApp from './apps/rider/RiderApp';

// Cart Context (Customer only, but wrapping globally is fine)
import { CartProvider } from './apps/customer/CartContext';

// Notification handler: Show even when app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const Stack = createNativeStackNavigator();

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState('user');

    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const role = await AsyncStorage.getItem('userRole') || 'user';

                if (token) {
                    setUserToken(token);
                    setUserRole(role);
                    // Register device for FCM notifications after login
                    await registerForPushNotificationsAsync();
                }
            } catch (e) {
                console.error('Bootstrap error:', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    useEffect(() => {
        if (!userToken) return;

        // Foreground notification listener
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('[FCM] Notification received (foreground):', notification.request.content.title);
        });

        // Response listener (when user taps notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const { data } = response.notification.request.content;
            console.log('[FCM] Notification tapped:', data);
            // Navigation handled inside setupNotificationListeners in screens
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [userToken]);

    if (isLoading) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color="#ed1c24" />
            </View>
        );
    }

    const MainComponent =
        userRole === 'admin' || userRole === 'super_admin' ? AdminApp
            : userRole === 'delivery' ? RiderApp
                : CustomerApp;

    return (
        <CartProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {!userToken ? (
                        <Stack.Screen name="Auth" component={AuthStack} />
                    ) : (
                        <Stack.Screen name="Main" component={MainComponent} />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </CartProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
