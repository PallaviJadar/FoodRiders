const nodemailer = require('nodemailer');
const SystemSettings = require('../models/SystemSettings');

/**
 * Professional Email Transport Config
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Use SSL
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('[EMAIL] ❌ SMTP Connection Error:', error.message);
        } else {
            console.log('[EMAIL] ✅ SMTP Server is ready to take messages');
        }
    });
}

/**
 * Send Admin Order Alert Email (with One-Click Accept Link)
 */
const sendAdminOrderEmail = async (order, forcedTo = null, type = 'NEW_ORDER') => {
    try {
        const orderId = order._id.toString().slice(-6).toUpperCase();
        const fullOrderId = order._id.toString();
        const customerName = order.userDetails?.name || 'Customer';
        const customerPhone = order.userDetails?.phone || 'N/A';
        const amount = order.totalAmount;
        const paymentMethod = order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment';

        const itemsList = (order.items || []).map(item =>
            `${item.name} x${item.quantity} — ₹${item.price * item.quantity}`
        ).join('<br>');

        let adminEmail = forcedTo;
        if (!adminEmail) {
            try {
                const settings = await SystemSettings.findOne().lean();
                adminEmail = settings?.notificationAlerts?.adminEmail || process.env.ADMIN_EMAIL || 'foodriders.in@gmail.com';
            } catch (e) {
                adminEmail = process.env.ADMIN_EMAIL || 'foodriders.in@gmail.com';
            }
        }

        const baseUrl = process.env.BASE_URL || 'https://www.foodriders.in';
        const acceptLink = `${baseUrl}/api/orders/admin-accept/${fullOrderId}`;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return { success: false, error: 'Auth credentials missing' };

        const isReminder = type === 'REMINDER';
        const isStatusUpdate = type === 'STATUS_UPDATE';

        let subject = `🚨 New Order Received - #${orderId}`;
        if (isReminder) subject = `⏰ Reminder: Order Not Accepted - #${orderId}`;
        if (isStatusUpdate) subject = `🔄 Order #${orderId} Status Updated: ${order.orderStatus}`;

        let title = 'New Order Received! 🚀';
        if (isReminder) title = 'Order Still Pending! ⏰';
        if (isStatusUpdate) title = `Status Updated: ${order.orderStatus} 🔄`;

        let accentColor = '#ed1c24';
        if (isReminder) accentColor = '#ffcc00';
        if (isStatusUpdate) accentColor = '#2f3542';

        const mailOptions = {
            from: `"FoodRiders Notifications" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 15px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${accentColor}; text-align: center;">${title}</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 10px;">
                        <p><strong>Order ID:</strong> #${orderId}</p>
                        <p><strong>Customer:</strong> ${customerName} (${customerPhone})</p>
                        <p><strong>Amount:</strong> ₹${amount}</p>
                        <p><strong>Items:</strong><br>${itemsList}</p>
                    </div>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="${acceptLink}" style="background: #2ed573; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Order Now</a>
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ Admin Email Sent: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL] ❌ Admin Email Failed:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send Transactional Email to Customer
 */
const sendUserOrderEmail = async (order, type = 'ORDER_CONFIRMED') => {
    try {
        const orderId = order._id.toString().slice(-6).toUpperCase();
        const email = order.userDetails?.email;
        if (!email) return { success: false, error: 'No customer email' };

        let subject = '';
        let title = '';
        let message = '';

        switch (type) {
            case 'ORDER_CONFIRMED':
                subject = `Order Confirmed! #${orderId}`;
                title = 'Thank You for Your Order! 🍕';
                message = 'Your order has been successfully placed and is being processed.';
                break;
            case 'ORDER_ACCEPTED':
                subject = `Restaurant Accepted Your Order #${orderId}`;
                title = 'Order Accepted! 👩‍🍳';
                message = 'Great news! The restaurant has started preparing your food.';
                break;
            case 'ORDER_DELIVERED':
                subject = `Order Delivered! #${orderId}`;
                title = 'Enjoy Your Meal! 😋';
                message = 'Your order has been delivered. We hope you love it!';
                break;
            default:
                return { success: false, error: 'Invalid email type' };
        }

        const mailOptions = {
            from: `"FoodRiders" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
                    <div style="text-align: center; border-bottom: 2px solid #ed1c24; padding-bottom: 10px; margin-bottom: 20px;">
                        <h2 style="color: #ed1c24;">${title}</h2>
                    </div>
                    <p>Hi ${order.userDetails?.name || 'Customer'},</p>
                    <p>${message}</p>
                    <div style="background: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                        <p><strong>Order ID:</strong> #${orderId}</p>
                        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                        <p><strong>Restaurant:</strong> ${order.restaurantName}</p>
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">
                        Need help? Contact us at support@foodriders.in
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ User Email Sent (${type}): ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL] ❌ User Email Failed:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendAdminOrderEmail, sendUserOrderEmail };
