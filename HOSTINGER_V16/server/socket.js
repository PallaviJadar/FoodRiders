const { Server } = require("socket.io");

let io;

// Track processed events to prevent duplicates
const processedEvents = new Set();
const EVENT_EXPIRY = 60000; // 1 minute

// Clean up old event IDs periodically
setInterval(() => {
    processedEvents.clear();
}, EVENT_EXPIRY);

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT"]
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // Join role-specific rooms (Production Architecture)
        socket.on("joinAdmin", () => {
            socket.join("adminRoom");
            console.log(`[SOCKET] 👨‍✈️ Admin joined: ${socket.id}`);
        });

        socket.on("joinUser", (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`[SOCKET] 👤 User joined: user_${userId}`);
            }
        });

        socket.on("joinRider", (riderId) => {
            if (riderId) {
                socket.join(`rider_${riderId}`);
                console.log(`[SOCKET] 🏍️ Rider joined: rider_${riderId}`);
            }
        });

        // Backward compatibility for existing listeners
        socket.on("joinRole", (role) => {
            if (role === 'admin') socket.join('adminRoom');
            else if (role === 'delivery' || role === 'rider') socket.join('deliveryRoom');
        });

        socket.on("join-admin-room", () => {
            socket.join("adminRoom");
        });

        socket.on("joinRider", (riderId) => {
            socket.join(`rider_${riderId}`);
            socket.join(`delivery_${riderId}`); // for older frontend compatibility
            console.log(`[SOCKET] 🏇 Rider joined room: rider_${riderId}`);
        });

        socket.on("joinDeliveryPartner", (partnerId) => {
            socket.join(`delivery_${partnerId}`);
            socket.join(`rider_${partnerId}`);
        });

        // Handle generic room events (Security focused)
        socket.on("join-room", (room) => {
            if (room === 'adminRoom' || room === 'admin-room') {
                console.warn(`[SOCKET] ⚠️ Unauthorized generic attempt to join adminRoom from ${socket.id}`);
                return;
            }
            socket.join(room);
            console.log(`[SOCKET] 🏠 Client joined generic room: ${room}`);
        });

        // Location updates
        socket.on("updateLocation", (data) => {
            const { orderId, location } = data;
            if (orderId) {
                io.to(orderId.toString()).emit("locationUpdate", location);
            }
        });

        // Acknowledge siren received
        socket.on("sirenAcknowledged", (eventId) => {
            processedEvents.add(eventId);
            console.log(`Siren acknowledged: ${eventId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

// Emit new order alert to adminroom ONLY (Rule 1 & 7)
const emitAdminOrderAlert = async (order) => {
    const io = getIO();
    // Role-targeted: Admin-only critical events
    io.to('adminRoom').emit('newOrder', order);
    io.to('adminRoom').emit('newOrderAlert', { order, eventId: `order-${order._id}` });
    // Broad events: all connected clients refresh stats / trigger siren
    io.emit('new_order', order);
    io.emit('dashboard_update', { type: 'new_order', orderId: order._id });
    console.log(`[SOCKET] 👮 Admin alert + dashboard_update: ${order._id}`);
};

// Emit status update to all relevant roles (Strict Role-Based - Rule 7)
const emitOrderStatusUpdate = (order) => {
    const io = getIO();
    const orderId = order._id.toString();
    const userId = order.userId?._id || order.userId;
    const riderId = order.deliveryBoyId?._id || order.deliveryBoyId;

    // 1. Admin always gets update for Dashboard
    io.to('adminRoom').emit('orderUpdated', order);
    io.to('adminRoom').emit('adminOrderUpdate', order); // compatibility

    // 2. User gets 'orderUpdated'
    if (userId) {
        io.to(`user_${userId}`).emit('orderUpdated', order);
        io.to(`user_${userId}`).emit('orderStatusUpdate', order); // compatibility
    }

    // 3. Rider gets 'orderUpdated'
    if (riderId) {
        io.to(`rider_${riderId}`).emit('orderUpdated', order);
        io.to(`rider_${riderId}`).emit('riderStatusUpdate', order); // compatibility
    }

    // 4. Specific Order Room (for tracking page)
    io.to(orderId).emit('orderUpdated', order);
    io.to(orderId).emit('orderUpdate', order); // compatibility

    // 5. Broadcast dashboard stats update to all admin clients
    io.emit('dashboard_update', { type: 'status_update', orderId, status: order.orderStatus });

    console.log(`[SOCKET] 🔄 Centralized Status Update: ${orderId} -> ${order.orderStatus}`);
};

// Emit delivery assignment (Rule 5 & 7)
const emitDeliveryAssignment = (order, riderId) => {
    const io = getIO();
    // Rule 5 & 7: Rider must receive 'newAssignment' in specific room
    io.to(`rider_${riderId}`).emit('newAssignment', order);
    io.to(`delivery_${riderId}`).emit('deliveryAssigned', order); // compatibility
    console.log(`[SOCKET] 🏍️ Rider assigned: ${riderId} for ${order._id}`);
};

// Generic user notification
const emitUserNotification = (userId, notification) => {
    const io = getIO();
    io.to(`user_${userId}`).emit('userNotification', {
        ...notification,
        timestamp: Date.now()
    });
};

// Emit restaurant data update to all users (Rule 7)
const emitRestaurantUpdate = (restaurantId, data) => {
    const io = getIO();
    // Rule 7: Emit globally so all users see the 'Open/Closed' status change instantly
    io.emit('restaurantUpdate', { id: restaurantId, ...data });
    console.log(`[SOCKET] 🍴 Restaurant update: ${restaurantId}`);
};

module.exports = {
    init,
    getIO,
    emitAdminOrderAlert,
    emitDeliveryAssignment,
    emitUserNotification,
    emitOrderStatusUpdate,
    emitRestaurantUpdate
};
