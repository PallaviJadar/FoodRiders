const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const { onOrderCreated } = require('../utils/orderReminders');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Detect test vs live mode
const isTestMode = (process.env.RAZORPAY_KEY_ID || '').startsWith('rzp_test_');
console.log(`[RAZORPAY] 🔥 TESTING UPDATES - Initialized in ${isTestMode ? '🧪 TEST' : '🔴 LIVE'} mode | Key: ${(process.env.RAZORPAY_KEY_ID || '').substring(0, 16)}...`);

/**
 * @route   POST /api/payment/razorpay/create-order
 * @desc    Create a Razorpay order
 * @access  Private (User)
 */
router.post('/razorpay/create-order', auth, async (req, res) => {
    try {
        // Validate Razorpay availability at system level
        const SystemSettings = require('../models/SystemSettings');
        const settings = await SystemSettings.findOne();
        if (settings && !settings.isRazorpayEnabled) {
            return res.status(400).json({ msg: 'Selected payment method is currently unavailable.' });
        }

        const { orderId } = req.body;
        const OrderDraft = require('../models/OrderDraft');

        let order = await Order.findById(orderId);
        let draft = null;

        if (!order) {
            draft = await OrderDraft.findById(orderId);
            if (!draft) return res.status(404).json({ msg: 'Order session expired. Please re-order.' });
        }

        const orderAmount = order ? order.totalAmount : draft.orderData.totalAmount;
        const amount = Math.round(orderAmount * 100); // Amount in paise

        console.log(`[RAZORPAY] Creating order | Draft: ${!!draft} | Amount: ₹${orderAmount} (${amount} paise)`);

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: orderId.toString(),
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Update ID in whichever record exists
        if (order) {
            order.razorpay_order_id = razorpayOrder.id;
            order.paymentMethod = 'RAZORPAY';
            order.paymentStatus = 'PENDING';
            await order.save();
        } else {
            draft.razorpay_order_id = razorpayOrder.id;
            await draft.save();
        }

        console.log(`[RAZORPAY] ✅ Order initiated | Razorpay ID: ${razorpayOrder.id}`);

        res.json({
            success: true,
            key_id: process.env.RAZORPAY_KEY_ID,
            order: razorpayOrder
        });
    } catch (err) {
        console.error('[RAZORPAY] ❌ Create Order Error:', err.message);
        console.error('[RAZORPAY] Full Error:', err);
        res.status(500).json({ msg: 'Payment initialization failed', error: err.message });
    }
});

/**
 * @route   POST /api/payment/razorpay/verify
 * @desc    Verify payment signature after frontend callback
 * @access  Public (Signature verification handles security)
 */
router.post('/razorpay/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        console.log(`[RAZORPAY VERIFY] Verifying payment...`);
        console.log(`[RAZORPAY VERIFY] Order ID: ${razorpay_order_id}`);
        console.log(`[RAZORPAY VERIFY] Payment ID: ${razorpay_payment_id}`);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, msg: 'Missing payment details' });
        }

        // Verify signature using Razorpay key_secret
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('[RAZORPAY VERIFY] ❌ Signature mismatch!');
            console.error(`[RAZORPAY VERIFY] Expected: ${generatedSignature}`);
            console.error(`[RAZORPAY VERIFY] Received: ${razorpay_signature}`);
            return res.status(400).json({ success: false, msg: 'Payment verification failed' });
        }

        console.log('[RAZORPAY VERIFY] ✅ Signature verified successfully');

        // Find and update the order
        let order = await Order.findOne({ razorpay_order_id });

        if (!order) {
            const OrderDraft = require('../models/OrderDraft');
            const draft = await OrderDraft.findOne({ razorpay_order_id });

            if (draft) {
                order = new Order({
                    ...draft.orderData,
                    paymentMethod: 'RAZORPAY',
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    paymentStatus: 'PAID', // Rule: ONLY PAID after verify
                    orderStatus: 'PENDING_ACCEPTANCE'
                });
                await order.save();
                await OrderDraft.deleteOne({ _id: draft._id });
                console.log(`[RAZORPAY VERIFY] ✅ New OrderCreated Order from Draft: ${order._id}`);
            } else {
                console.error(`[RAZORPAY VERIFY] No order or draft found for: ${razorpay_order_id}`);
                return res.status(404).json({ success: false, msg: 'Order not found' });
            }
        }

        // Only trigger if just paid (idempotent)
        if (order.paymentStatus !== 'PAID' || order.isNew) {
            order.paymentStatus = 'PAID';
            order.orderStatus = 'PENDING_ACCEPTANCE';
            order.razorpay_payment_id = razorpay_payment_id;
            order.razorpay_signature = razorpay_signature;
            await order.save();

            // Trigger Lifecycle Actions
            try {
                const { getIO } = require('../socket');
                const io = getIO();

                // Rule 5: Order Created Event (Admin Only)
                io.to("adminRoom").emit("newOrder", order);

                // Rule 3: Immediate Reminder
                const { startOrderReminder } = require('../utils/orderReminders');
                startOrderReminder(order._id);
            } catch (e) {
                console.error('[RAZORPAY VERIFY] Lifecycle trigger error:', e.message);
            }
        }

        // Send User Confirmation Email
        const { sendUserOrderEmail } = require('../utils/email');
        sendUserOrderEmail(order, 'ORDER_CONFIRMED');

        res.json({
            success: true,
            orderId: order._id,
            status: order.paymentStatus
        });
    } catch (err) {
        console.error('[RAZORPAY VERIFY] ❌ Error:', err.message);
        res.status(500).json({ success: false, msg: 'Verification failed', error: err.message });
    }
});

/**
 * @route   POST /api/payment/razorpay/webhook
 * @desc    Razorpay Webhook listener (for production — requires public URL)
 * @access  Public
 */
router.post('/razorpay/webhook', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) return res.status(400).send('No signature');

    try {
        const rawBody = req.body.toString();
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('[RAZORPAY WEBHOOK] ❌ Invalid Signature');
            return res.status(400).send('Invalid signature');
        }

        const body = JSON.parse(rawBody);
        const event = body.event;
        const payload = body.payload;

        console.log(`[RAZORPAY WEBHOOK] 📩 Event: ${event}`);

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const razorpayPaymentId = payment.id;

            console.log(`[RAZORPAY WEBHOOK] Payment captured | Razorpay Order: ${razorpayOrderId} | Payment: ${razorpayPaymentId} | Amount: ₹${payment.amount / 100}`);

            let order = await Order.findOne({ razorpay_order_id: razorpayOrderId });

            if (!order) {
                const OrderDraft = require('../models/OrderDraft');
                const draft = await OrderDraft.findOne({ razorpay_order_id: razorpayOrderId });
                if (draft) {
                    order = new Order({
                        ...draft.orderData,
                        paymentMethod: 'RAZORPAY',
                        razorpay_order_id: razorpayOrderId,
                        razorpay_payment_id: razorpayPaymentId,
                        paymentStatus: 'PAID',
                        orderStatus: 'PENDING_ACCEPTANCE'
                    });
                    await order.save();
                    await OrderDraft.deleteOne({ _id: draft._id });
                }
            }

            if (order && order.paymentStatus !== 'PAID') {
                order.paymentStatus = 'PAID';
                order.orderStatus = 'PENDING_ACCEPTANCE';
                order.razorpay_payment_id = razorpayPaymentId;
                await order.save();

                // Trigger LifeCycle Actions
                const { getIO } = require('../socket');
                const io = getIO();
                io.to("adminRoom").emit("newOrder", order);
                const { startOrderReminder } = require('../utils/orderReminders');
                startOrderReminder(order._id);
            }
        }
        else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const order = await Order.findOne({ razorpay_order_id: razorpayOrderId });
            if (order) {
                order.paymentStatus = 'FAILED';
                await order.save();
                console.log(`[RAZORPAY WEBHOOK] ❌ Order #${order._id.toString().slice(-6).toUpperCase()} payment FAILED | Reason: ${payment.error_description || 'Unknown'}`);
            }
        }
        else if (event === 'refund.processed') {
            const refund = payload.refund.entity;
            const razorpayPaymentId = refund.payment_id;
            const order = await Order.findOne({ razorpay_payment_id: razorpayPaymentId });
            if (order) {
                order.paymentStatus = 'REFUNDED';
                order.razorpay_refund_id = refund.id;
                await order.save();
                console.log(`[RAZORPAY WEBHOOK] 💰 Order #${order._id.toString().slice(-6).toUpperCase()} REFUNDED | Refund ID: ${refund.id}`);
            }
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('[RAZORPAY WEBHOOK] ❌ Error:', err);
        res.status(500).send('Webhook failed');
    }
});

/**
 * @route   POST /api/payment/razorpay/refund
 * @desc    Initiate a refund for an order
 * @access  Private (Admin)
 */
router.post('/razorpay/refund', auth, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ msg: 'Unauthorized' });
    }

    try {
        const { orderId, amount } = req.body;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ msg: 'Order not found' });
        if (!order.razorpay_payment_id) return res.status(400).json({ msg: 'No Razorpay payment ID found' });

        console.log(`[RAZORPAY REFUND] Processing refund for Order #${order._id.toString().slice(-6).toUpperCase()} | Amount: ${amount ? '₹' + amount : 'FULL'}`);

        const refundOptions = {
            payment_id: order.razorpay_payment_id,
            amount: amount ? Math.round(amount * 100) : undefined, // Full or partial
        };

        const refund = await razorpay.payments.refund(order.razorpay_payment_id, refundOptions);

        order.paymentStatus = 'REFUNDED';
        order.razorpay_refund_id = refund.id;
        await order.save();

        console.log(`[RAZORPAY REFUND] ✅ Refund successful | Refund ID: ${refund.id}`);

        res.json({
            success: true,
            refund: refund
        });
    } catch (err) {
        console.error('[RAZORPAY REFUND] ❌ Error:', err.message);
        res.status(500).json({ msg: 'Refund failed', error: err.message });
    }
});

module.exports = router;
