import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const DeliveryProtectedRoute = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('deliveryToken');

        if (!token) {
            setIsAuthenticated(false);
            setIsChecking(false);
            return;
        }

        // Verify token with backend
        fetch('/api/delivery/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    // Invalid token, clear it
                    localStorage.removeItem('deliveryToken');
                    localStorage.removeItem('deliveryUser');
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                // Network error, assume valid for now
                setIsAuthenticated(true);
            })
            .finally(() => {
                setIsChecking(false);
            });
    }, []);

    if (isChecking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Verifying credentials...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/delivery-login" replace />;
    }

    return children;
};

export default DeliveryProtectedRoute;
