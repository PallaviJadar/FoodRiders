import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        try {
            return !!localStorage.getItem('auth');
        } catch (e) {
            return false;
        }
    });
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("User recovery failed:", e);
            return null;
        }
    });
    const [authModal, setAuthModal] = useState({ login: false, signup: false });
    const [authMessage, setAuthMessage] = useState('');
    const [onSuccessAction, setOnSuccessAction] = useState(null);

    const safeStorage = {
        get: (key) => {
            try { return localStorage.getItem(key); }
            catch (e) { return null; }
        },
        set: (key, val) => {
            try { localStorage.setItem(key, val); }
            catch (e) { }
        },
        remove: (key) => {
            try { localStorage.removeItem(key); }
            catch (e) { }
        }
    };

    useEffect(() => {
        const syncUser = async () => {
            const token = safeStorage.get('token');
            if (token && isLoggedIn) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const updatedUser = await res.json();
                        setUser(updatedUser);
                        safeStorage.set('user', JSON.stringify(updatedUser));
                    } else if (res.status === 401) {
                        logout();
                    }
                } catch (err) {
                    console.error("User sync failed", err);
                }
            }
        };
        syncUser();
    }, [isLoggedIn]);

    const login = (userData, token) => {
        safeStorage.set('auth', 'true');
        safeStorage.set('token', token);
        safeStorage.set('user', JSON.stringify(userData));
        setIsLoggedIn(true);
        setUser(userData);
        setAuthModal({ login: false, signup: false });
        setAuthMessage('');

        if (onSuccessAction) {
            onSuccessAction(userData);
            setOnSuccessAction(null);
        }
    };

    const logout = () => {
        safeStorage.remove('auth');
        safeStorage.remove('token');
        safeStorage.remove('user');
        safeStorage.remove('adminToken');
        safeStorage.remove('deliveryToken');
        safeStorage.remove('deliveryUser');
        safeStorage.remove('adminUser');

        setIsLoggedIn(false);
        setUser(null);
        window.location.href = '/';
    };

    const triggerAuth = (action = null, message = 'Please login to continue') => {
        if (isLoggedIn || safeStorage.get('auth')) {
            if (action) action(user);
            return;
        }
        setOnSuccessAction(() => action);
        setAuthMessage(message);
        setAuthModal({ login: true, signup: false });
    };

    const closeAuthModal = () => {
        setAuthModal({ login: false, signup: false });
        setAuthMessage('');
        setOnSuccessAction(null);
    };

    const openSignup = () => {
        setAuthModal({ login: false, signup: true });
    };

    const openLogin = (message = '') => {
        setAuthMessage(message);
        setAuthModal({ login: true, signup: false });
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            user,
            authModal,
            authMessage,
            login,
            logout,
            triggerAuth,
            closeAuthModal,
            openSignup,
            openLogin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
