import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react-native';

// Customer Screens
import CustomerHome from './CustomerHome';
import RestaurantDetail from './RestaurantDetail';
import Cart from './Cart';
import Checkout from './Checkout';
import CustomerOrders from './CustomerOrders';
import TrackOrder from './TrackOrder';
import CustomerProfile from './CustomerProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomerMainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#ed1c24',
                tabBarInactiveTintColor: '#888',
                headerStyle: { backgroundColor: '#ed1c24' },
                headerTintColor: '#fff',
                tabBarStyle: { height: 60, paddingBottom: 10 },
            }}
        >
            <Tab.Screen
                name="Home"
                component={CustomerHome}
                options={{
                    title: 'FoodRiders',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Cart"
                component={Cart}
                options={{
                    title: 'My Cart',
                    tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={CustomerOrders}
                options={{
                    title: 'My Orders',
                    tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={CustomerProfile}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function CustomerApp() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="CustomerTabs"
                component={CustomerMainTabs}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="RestaurantDetail"
                component={RestaurantDetail}
                options={({ route }) => ({
                    title: route.params?.name || 'Restaurant',
                    headerStyle: { backgroundColor: '#ed1c24' },
                    headerTintColor: '#fff',
                })}
            />
            <Stack.Screen
                name="Checkout"
                component={Checkout}
                options={{ title: 'Checkout', headerStyle: { backgroundColor: '#ed1c24' }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
                name="TrackOrder"
                component={TrackOrder}
                options={{ title: 'Track Order', headerStyle: { backgroundColor: '#ed1c24' }, headerTintColor: '#fff' }}
            />
        </Stack.Navigator>
    );
}
