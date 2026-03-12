import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ListOrdered, Utensils, Settings } from 'lucide-react-native';

// Admin Screens
import AdminDashboard from './AdminDashboard';
import AdminOrderDetail from './AdminOrderDetail';
import AdminMenu from './AdminMenu';
import AdminProfile from './AdminProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminMainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#ed1c24',
                tabBarInactiveTintColor: '#888',
                headerShown: true,
                headerStyle: { backgroundColor: '#ed1c24' },
                headerTintColor: '#fff',
                tabBarStyle: { height: 60, paddingBottom: 10 }
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={AdminDashboard}
                options={{
                    title: 'Live Orders',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="AllOrders"
                component={AdminDashboard} // Reusing for now
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, size }) => <ListOrdered color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Menu"
                component={AdminMenu}
                options={{
                    title: 'Menu',
                    tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Settings"
                component={AdminProfile}
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

export default function AdminApp() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="AdminTabs"
                component={AdminMainTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AdminOrderDetail"
                component={AdminOrderDetail}
                options={{ title: 'Order Details', headerBackTitleVisible: false }}
            />
        </Stack.Navigator>
    );
}
