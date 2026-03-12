import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import audioManager from '../utils/audioManager';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [pendingAlerts, setPendingAlerts] = useState([]);

    useEffect(() => {
        // Initialize Socket.IO connection
        const socketInstance = io(window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socketInstance.on('connect', () => {
            console.log('✅ Socket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    const joinRole = useCallback((role) => {
        if (socket && isConnected) {
            const roomName = role === 'admin' ? 'adminRoom' : (role === 'delivery' ? 'deliveryRoom' : role);
            socket.emit('joinRole', role); // Event name stays same
            console.log(`Joined role: ${role} | Room: ${roomName}`);
        }
    }, [socket, isConnected]);

    const joinOrder = useCallback((orderId) => {
        if (socket && isConnected) {
            socket.emit('join', orderId.toString());
            console.log(`Joined order room: ${orderId}`);
        }
    }, [socket, isConnected]);

    const joinDeliveryPartner = useCallback((partnerId) => {
        if (socket && isConnected) {
            socket.emit('joinDeliveryPartner', partnerId);
            console.log(`Joined delivery partner room: ${partnerId}`);
        }
    }, [socket, isConnected]);

    const joinUser = useCallback((userId) => {
        if (socket && isConnected) {
            socket.emit('joinUser', userId);
            console.log(`Joined user room: user_${userId}`);
        }
    }, [socket, isConnected]);

    const acknowledgeSiren = useCallback((eventId) => {
        if (socket && isConnected) {
            socket.emit('sirenAcknowledged', eventId);
            audioManager.acknowledge(eventId);
            console.log(`Acknowledged event: ${eventId}`);
        }
    }, [socket, isConnected]);

    const updateLocation = useCallback((orderId, location) => {
        if (socket && isConnected) {
            socket.emit('updateLocation', { orderId, location });
        }
    }, [socket, isConnected]);

    const value = {
        socket,
        isConnected,
        joinRole,
        joinOrder,
        joinDeliveryPartner,
        joinUser,
        acknowledgeSiren,
        updateLocation,
        pendingAlerts,
        setPendingAlerts
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
