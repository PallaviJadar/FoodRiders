const Order = require('../models/Order');
const { sendSMS } = require('./sms');
const { sendAdminOrderEmail } = require('./email');
const { notifyAdmins, notifyUser } = require('./fcm');

const reminders = {};

/**
 * PRODUCTION-GRADE REMINDER ENGINE
 * - Instant first reminder
 * - Repeats every 2 minutes
 * - Auto-cleans when order is no longer pending
 */
const startOrderReminder = (orderId) => {
    // Clear existing if any (prevent duplicates)
    if (reminders[orderId]) {
        clearInterval(reminders[orderId]);
    }

    const sendReminder = async () => {
        try {
            // Use race to prevent hanging on findById
            const order = await Promise.race([
                Order.findById(orderId).lean(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Order Lookup Timeout')), 5000))
            ]);

            if (!order) {
                console.log(`[REMINDER] ⏹️ Stopping: Order ${orderId} no longer exists or lookup timed out.`);
                clearInterval(reminders[orderId]);
                delete reminders[orderId];
                return;
            }

            const pendingStatuses = ['CREATED', 'PAYMENT_PENDING', 'PENDING_ACCEPTANCE', 'USER_MARKED_PAID'];
            const isPending = pendingStatuses.includes(order.orderStatus) || pendingStatuses.includes(order.status);
            const isRazorpay = order.paymentMethod === 'RAZORPAY';
            const isPaid = order.paymentStatus === 'PAID';

            // Logic: STOP if not pending OR (is Razorpay but hasn't been paid)
            if (!isPending || (isRazorpay && !isPaid)) {
                console.log(`[REMINDER] ⏹️ Cycle stopped for Order: ${orderId} | Status: ${order.orderStatus}/${order.status} | Paid: ${isPaid}`);
                clearInterval(reminders[orderId]);
                delete reminders[orderId];
                return;
            }

            console.log(`[REMINDER] 🔔 Running cycle for Order: ${orderId} (Method: ${order.paymentMethod})`);

            const SystemSettings = require('../models/SystemSettings');
            const settings = await SystemSettings.findOne();

            // 1. SMS to Admin (Rule 3) - Alert only once per order
            if (settings?.notificationAlerts?.smsEnabled !== false && !order.smsSent) {
                const adminNumbersStr = settings?.notificationAlerts?.adminPhone || process.env.ADMIN_PHONES || process.env.ADMIN_NUMBERS || '9380801462';
                const adminNumbers = adminNumbersStr.split(',');

                const messageBody = `
🔔 NEW ORDER

🧾 #${orderId.toString().slice(-6).toUpperCase()}
👤 ${order.userDetails?.name || 'Customer'}
💰 ₹${order.totalAmount}
💳 ${order.paymentMethod}

👉 Accept:
https://www.foodriders.in/admin/orders/${order._id}
`;

                for (const number of adminNumbers) {
                    try {
                        await sendSMS(number.trim(), messageBody);
                        console.log("SMS sent to:", number);
                    } catch (error) {
                        console.log("SMS failed for:", number, error.message);
                    }
                }

                // Mark as sent to prevent duplicates in reminder cycles
                await Order.updateOne({ _id: orderId }, { smsSent: true });
            }

            // 2. Email Notification (Rule 3 & FIX)
            if (settings?.notificationAlerts?.emailEnabled !== false) {
                try {
                    const type = (order.createdAt && (Date.now() - new Date(order.createdAt).getTime()) < 120000)
                        ? 'NEW_ORDER'
                        : 'REMINDER';

                    await sendAdminOrderEmail(order, settings?.notificationAlerts?.adminEmail, type);
                } catch (emailErr) {
                    console.error('[EMAIL] Send failed during reminder:', emailErr.message);
                }
            }

            // 3. Socket: Restart siren on admin dash
            try {
                const { getIO } = require('../socket');
                const io = getIO();
                io.to('adminRoom').emit('orderReminder', { orderId, restartSiren: true });

                // 4. FCM Push Notification to Admins
                const orderIdShort = orderId.toString().slice(-6).toUpperCase();
                await notifyAdmins(
                    `New Order Alert! #${orderIdShort}`,
                    `A new order of ₹${order.totalAmount} is waiting for your confirmation.`,
                    { orderId: orderId.toString(), click_action: '/admin/orders' },
                    order.userId // Exclude the person who placed the order
                );
            } catch (socketErr) { }

        } catch (err) {
            console.error('[REMINDER] Error in interval:', err.message);
        }
    };

    // Rule 3: Send instantly
    sendReminder();

    // Rule 4: Then every 2 mins
    reminders[orderId] = setInterval(sendReminder, 2 * 60 * 1000);
    console.log(`[REMINDER] 🚀 Started reminder cycle for Order: ${orderId}`);
};

const stopReminder = (orderId) => {
    if (reminders[orderId]) {
        clearInterval(reminders[orderId]);
        delete reminders[orderId];
        console.log(`[REMINDER] ⏹️ Manually stopped reminder for: ${orderId}`);
    }
};

module.exports = {
    startOrderReminder,
    stopReminder,
    onOrderCreated: (order) => startOrderReminder(order._id),
    onOrderAccepted: (order) => stopReminder(order._id),
    onRiderAssigned: async (order, riderId) => {
        stopReminder(order._id);
        const orderIdShort = order._id.toString().slice(-6).toUpperCase();
        await notifyUser(riderId, `New Delivery Task! #${orderIdShort}`, `You have been assigned to deliver order #${orderIdShort}. Open the app to view details.`, {
            click_action: '/delivery-dashboard',
            orderId: order._id.toString()
        });
    },
    onOrderFinished: (orderId) => stopReminder(orderId),
    clearOrderTimers: (orderId) => stopReminder(orderId)
};
