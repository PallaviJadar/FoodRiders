import api from './axios';
import { ENDPOINTS } from './endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    // Step 1: After Firebase OTP verification on client
    verifyFirebaseToken: async (token) => {
        try {
            const response = await api.post('/auth/firebase-login', { token });
            return response.data;
        } catch (err) {
            throw err.response?.data?.message || 'Firebase verification failed';
        }
    },

    // Step 2: Login or Signup with PIN
    loginOrSignup: async (data) => {
        try {
            const response = await api.post('/auth/login-or-signup', data);
            const { token, user } = response.data;

            // Store token and user role
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', user.role || 'user');
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            return response.data;
        } catch (err) {
            throw err.response?.data?.message || 'Login failed';
        }
    },

    logout: async () => {
        await AsyncStorage.clear();
    },

    getCurrentUser: async () => {
        const userData = await AsyncStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    getRole: async () => {
        return await AsyncStorage.getItem('userRole') || 'user';
    }
};
