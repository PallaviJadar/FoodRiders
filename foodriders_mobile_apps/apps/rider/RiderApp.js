import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Package, User, History } from 'lucide-react-native';

// Rider Screens
import RiderDeliveries from './RiderDeliveries';
import RiderDeliveryDetail from './RiderDeliveryDetail';
import RiderProfile from './RiderProfile';
import RiderHistory from './RiderHistory';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function RiderMainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#FF6600',
                tabBarInactiveTintColor: '#888',
                headerStyle: { backgroundColor: '#FF6600' },
                headerTintColor: '#fff',
                tabBarStyle: { height: 60, paddingBottom: 10 },
            }}
        >
            <Tab.Screen
                name="Deliveries"
                component={RiderDeliveries}
                options={{
                    title: 'My Deliveries',
                    tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="History"
                component={RiderHistory}
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={RiderProfile}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function RiderApp() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="RiderTabs"
                component={RiderMainTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RiderDeliveryDetail"
                component={RiderDeliveryDetail}
                options={{ title: 'Delivery Details', headerStyle: { backgroundColor: '#FF6600' }, headerTintColor: '#fff' }}
            />
        </Stack.Navigator>
    );
}
