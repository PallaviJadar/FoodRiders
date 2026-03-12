import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isLoggedIn: authIsLoggedIn, triggerAuth } = useAuth();
    const location = useLocation();

    // Secondary check for localStorage to handle race conditions during navigation
    const isLoggedIn = authIsLoggedIn || !!localStorage.getItem('auth');

    useEffect(() => {
        if (!isLoggedIn) {
            // Give it a tiny delay to ensure state hasn't just updated
            const checkSync = setTimeout(() => {
                if (!localStorage.getItem('auth')) {
                    triggerAuth(null, 'Please login to view this page');
                }
            }, 100);
            return () => clearTimeout(checkSync);
        }
    }, [isLoggedIn, triggerAuth]);

    if (!isLoggedIn) {
        return null;
    }

    return children;
};

export default ProtectedRoute;
