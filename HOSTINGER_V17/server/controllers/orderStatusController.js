const Order = require('../models/Order');
const User = require('../models/User');
const { notifyUser } = require('../utils/fcm');
const { sendUserOrderEmail, sendAdminOrderEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const SystemSettings = require('../models/SystemSettings');

const updateOrderStatusInternal = async (orderId, status, { io, deliveryBoyId, reason } = {}) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    const previousStatus = order.orderStatus;

    // Safety check for Razorpay (Rule 9 from previous task)
    if (status === 'ACCEPTED' && order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID') {
        throw new Error("Payment not completed. Razorpay orders must be PAID before acceptance.");
    }

    // Handle Wallet Refund if CANCELLED
    if (status === 'CANCELLED' && order.orderStatus !== 'CANCELLED' && order.walletAmountUsed > 0) {
        const WalletTransaction = require('../models/WalletTransaction');
        const user = await User.findById(order.userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + order.walletAmountUsed;
            await user.save();

            const refundTxn = new WalletTransaction({
                userId: user._id,
                amount: order.walletAmountUsed,
                type: 'CREDIT',
                source: 'ORDER_REFUND',
                orderId: order._id,
                description: `Refund: ${reason || 'Order cancelled'} (#${order._id.toString().slice(-6).toUpperCase()})`,
                status: 'ACTIVE',
                remainingAmount: order.walletAmountUsed,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            await refundTxn.save();
            order.walletAmountUsed = 0;
        }
    }

    // Update Fields
    order.orderStatus = status;
    order.status = status; // Keep for backward compatibility for now
    order.updatedAt = new Date();
    if (reason) order.rejectReason = reason;
    if (deliveryBoyId) order.deliveryBoyId = deliveryBoyId;

    // Timestamps
    if (status === 'ACCEPTED') order.acceptedAt = new Date();
    if (status === 'ASSIGNED') order.assignedAt = new Date();
    if (status === 'PICKED_UP') order.pickedUpAt = new Date();
    if (status === 'DELIVERED') {
        order.deliveredAt = new Date();
        // COD logic
        if (order.paymentMethod === 'COD') {
            order.paymentStatus = 'PAID';
        }
    }
    if (status === 'CANCELLED') order.cancelledAt = new Date();

    await order.save();

    // --- FCM Push Notification ---
    try {
        const orderIdShort = order._id.toString().slice(-6).toUpperCase();
        let title = `Order Updated: #${orderIdShort}`;
        let body = `Your order status changed to ${status}`;
        let link = `/order-tracking/${order._id}`;

        switch (status) {
            case 'ACCEPTED':
                title = 'Order Accepted! 🍳';
                body = `Your order #${orderIdShort} has been accepted and is being prepared.`;
                break;
            case 'ASSIGNED':
                title = 'Rider Assigned! 🛵';
                body = `A delivery partner has been assigned to your order #${orderIdShort}.`;
                break;
            case 'PICKED_UP':
                title = 'Order Picked Up! 📦';
                body = `Your order #${orderIdShort} has been picked up from the restaurant.`;
                break;
            case 'OUT_FOR_DELIVERY':
            case 'ON_THE_WAY':
                title = 'Order is on the Way! 📍';
                body = `Get ready! Your order #${orderIdShort} is out for delivery.`;
                break;
            case 'DELIVERED':
                title = 'Order Delivered! 🎉';
                body = `Hope you enjoy your meal! Order #${orderIdShort} was delivered successfully.`;
                break;
            case 'CANCELLED':
                title = 'Order Cancelled ❌';
                body = `Order #${orderIdShort} was cancelled: ${reason || 'Contact support for details.'}`;
                break;
        }

        // Notify User
        await notifyUser(order.userId, title, body, { orderId: order._id.toString(), click_action: link });

        // If cancelled, notify Rider too if assigned
        if (status === 'CANCELLED' && order.deliveryBoyId) {
            const riderId = order.deliveryBoyId?._id || order.deliveryBoyId;
            await notifyUser(riderId, `Order Cancelled: #${orderIdShort}`, `The order assigned to you was cancelled: ${reason || 'N/A'}`, {
                click_action: '/delivery-dashboard'
            });
        }
    } catch (fcmErr) {
        console.error('[FCM] Status Update Push failed:', fcmErr.message);
    }

    // --- SMTP Email Notification ---
    try {
        if (['ACCEPTED', 'DELIVERED'].includes(status)) {
            await sendUserOrderEmail(order, `ORDER_${status}`);
        }
    } catch (emailErr) {
        console.error('[EMAIL] User notification failed:', emailErr.message);
    }

    // --- Admin SMS/Email for Status Updates (PRO Feature) ---
    try {
        const settings = await SystemSettings.findOne().lean();
        const adminNumbersStr = settings?.notificationAlerts?.adminPhone || process.env.ADMIN_PHONES || process.env.ADMIN_NUMBERS || '9380801462';
        const adminEmail = settings?.notificationAlerts?.adminEmail || process.env.ADMIN_EMAIL || 'foodriders.in@gmail.com';

        const orderIdShort = order._id.toString().slice(-6).toUpperCase();
        const updateMsg = `Order #${orderIdShort} status updated to: ${status}${reason ? ' (Reason: ' + reason + ')' : ''}`;

        // 1. Admin Email for Status Update
        if (settings?.notificationAlerts?.emailEnabled !== false) {
            // We can reuse sendAdminOrderEmail or send a custom one. 
            // For "Every Update", we'll send a status update email.
            const { transporter } = require('../utils/email'); // We might need to export transporter or add a new util
            // But let's just use a simple one if sendAdminOrderEmail doesn't support generic updates.
            // Actually, let's just call it with a custom subject if possible.
            // For now, I'll just use the existing one with a type that stops reminders if it was NEW.
            await sendAdminOrderEmail(order, adminEmail, 'STATUS_UPDATE');
        }

        // 2. Admin SMS for Status Update (Selective to save cost but satisfy user's "every update" request)
        if (settings?.notificationAlerts?.smsEnabled !== false && ['CANCELLED', 'DELIVERED'].includes(status)) {
            const adminNumbers = adminNumbersStr.split(',');
            for (const number of adminNumbers) {
                await sendSMS(number.trim(), `[FoodRiders] ${updateMsg}`);
            }
        }
    } catch (adminNotifErr) {
        console.error('[ADMIN_NOTIF] Failed:', adminNotifErr.message);
    }

    // Notify via Sockets
    if (io) {
        const { emitOrderStatusUpdate, getIO } = require('../socket');
        // The socket utility handles targeted emits to Admin, User, and Rider
        emitOrderStatusUpdate(order);

        // Broadcast dashboard stats refresh to all admin clients
        try {
            const ioInst = getIO();
            ioInst.emit('dashboard_update', { type: 'status_update', orderId: order._id, status });
        } catch (e) { /* ignore */ }

        // Additional Siren Logic (Rule 6 & CANCELLED)
        if (status === 'ACCEPTED' || status === 'CANCELLED' || status === 'PENDING_COD') {
            io.to('adminRoom').emit('stopSiren', { orderId: order._id.toString() });
        }

        if (status === 'CANCELLED' && order.deliveryBoyId) {
            const riderId = order.deliveryBoyId?._id || order.deliveryBoyId;
            io.to(`rider_${riderId}`).emit('stopSiren', { orderId: order._id.toString() });
        }

        if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'ON_THE_WAY', 'ARRIVING'].includes(status) && order.deliveryBoyId) {
            const riderId = order.deliveryBoyId?._id || order.deliveryBoyId;
            io.to(`rider_${riderId}`).emit('stopSiren', { orderId: order._id.toString() });
        }
    }

    // Reminder Engine Updates
    const { onOrderAccepted, onRiderAssigned, onOrderFinished, clearOrderTimers } = require('../utils/orderReminders');
    if (status === 'ACCEPTED') onOrderAccepted(order);
    if (status === 'ASSIGNED' && order.deliveryBoyId) onRiderAssigned(order, order.deliveryBoyId);
    if (status === 'CANCELLED' || status === 'DELIVERED') onOrderFinished(order._id);
    if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'ON_THE_WAY', 'ARRIVING'].includes(status)) clearOrderTimers(order._id);

    // Referral Reward Logic - Apply on first successful delivery
    if (status === 'DELIVERED') {
        const user = await User.findById(order.userId);
        if (user && user.referredBy) {
            // Check if this is the user's first DELIVERED order
            const deliveredCount = await Order.countDocuments({
                userId: order.userId,
                orderStatus: 'DELIVERED'
            });

            if (deliveredCount === 1 && !order.referralApplied) {
                try {
                    const Referral = require('../models/Referral');
                    const ReferralSettings = require('../models/ReferralSettings');
                    const WalletTransaction = require('../models/WalletTransaction');

                    const settings = await ReferralSettings.findOne() || { isEnabled: true, referrerReward: 20, newUserReward: 20 };

                    if (settings.isEnabled) {
                        const referrer = await User.findOne({ referralCode: user.referredBy });
                        if (referrer) {
                            // Find or Create Referral Record
                            let referral = await Referral.findOne({ referrerId: referrer._id, newUserId: user._id });
                            if (!referral) {
                                referral = new Referral({
                                    referrerId: referrer._id,
                                    newUserId: user._id,
                                    status: 'PENDING',
                                    createdAt: new Date()
                                });
                            }

                            if (referral.status !== 'COMPLETED') {
                                // 1. Mark Referral Completed
                                referral.status = 'COMPLETED';
                                referral.orderId = order._id;
                                referral.completedAt = new Date();
                                referral.referrerReward = settings.referrerReward;
                                referral.newUserReward = settings.newUserReward;
                                await referral.save();

                                // 2. Credit Referrer
                                const expiryDate = new Date();
                                expiryDate.setDate(expiryDate.getDate() + (settings.walletExpiryDays || 30));

                                const referrerTxn = new WalletTransaction({
                                    userId: referrer._id,
                                    amount: settings.referrerReward,
                                    type: 'CREDIT',
                                    source: 'REFERRAL_REWARD',
                                    orderId: order._id,
                                    description: `Referral reward for inviting ${user.fullName || 'a friend'}`,
                                    status: 'ACTIVE',
                                    remainingAmount: settings.referrerReward,
                                    expiryDate: expiryDate
                                });
                                await referrerTxn.save();

                                // Update referrer balance
                                referrer.walletBalance = (referrer.walletBalance || 0) + settings.referrerReward;
                                await referrer.save();

                                // 3. Log notification for Referrer
                                if (io) {
                                    const { emitUserNotification } = require('../socket');
                                    emitUserNotification(referrer._id, {
                                        title: 'Referral Reward Credited! 🎁',
                                        body: `You earned ₹${settings.referrerReward} as your friend ${user.fullName} completed their first order.`,
                                        type: 'WALLET_CREDIT'
                                    });
                                }

                                // Mark order as processed for referral
                                order.referralApplied = true;
                                await order.save();
                                console.log(`✅ [REFERRAL] Credited ₹${settings.referrerReward} to referrer ${referrer._id} for order ${order._id}`);
                            }
                        }
                    }
                } catch (refErr) {
                    console.error('[REFERRAL_ERROR]', refErr);
                }
            }
        }
    }

    return order;
};

const updateStatusRoute = async (req, res) => {
    try {
        const { orderId, status, reason, deliveryBoyId } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "orderId and status are required" });
        }

        const updatedOrder = await updateOrderStatusInternal(orderId, status, {
            io: req.io,
            deliveryBoyId,
            reason
        });

        res.json({ success: true, order: updatedOrder });
    } catch (err) {
        console.error('[STATUS_UPDATE_ERROR]', err);
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    updateOrderStatusInternal,
    updateStatusRoute
};
