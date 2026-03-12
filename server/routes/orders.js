const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { updateStatusRoute, updateOrderStatusInternal } = require('../controllers/orderStatusController');

// Payment screenshot upload config using memory storage
const paymentStorage = multer.memoryStorage();
const paymentUpload = multer({
    storage: paymentStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit for base64
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// @route   POST api/orders/:id/upload-payment
// @desc    Upload manual payment screenshot (Base64)
router.post('/:id/upload-screenshot', paymentUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const base64Image = req.file.buffer.toString("base64");
        order.paymentScreenshot = `data:${req.file.mimetype};base64,${base64Image}`;

        // Update statuses
        order.status = 'USER_MARKED_PAID';
        order.orderStatus = 'USER_MARKED_PAID';
        order.isPaid = false; // Admin must confirm

        await order.save();

        if (req.io) {
            req.io.to(order._id.toString()).emit('orderUpdate', order);
            req.io.to('adminRoom').emit('adminOrderUpdate', order);
            // Re-trigger alert for admin to verify payment
            const { emitAdminOrderAlert } = require('../socket');
            emitAdminOrderAlert(order);
        }

        res.json({ success: true, paymentScreenshot: order.paymentScreenshot });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// Haversine formula to calculate distance in KM
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const isTimeWithinSchedules = (timeStr, timings) => {
    if (!timings || timings.length === 0) return true; // Default to open if no timings specified
    return timings.some(t => timeStr >= t.startTime && timeStr <= t.endTime);
};

// Debug route
router.get('/ping-test', (req, res) => res.json({ msg: 'Orders route is live' }));

// ✅ CENTRALIZED STATUS UPDATE API (Step 2 & 3)
router.post('/update-status', updateStatusRoute);

// =============================================
// ONE-CLICK ACCEPT FROM EMAIL (GET endpoint)
// Admin clicks "Accept Order" link in email
// =============================================
router.get('/admin-accept/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:50px;">
                <h1>❌ Order Not Found</h1>
                <p>This order may have been deleted or the link is invalid.</p>
                <a href="/admin/orders" style="color:#ed1c24;">Go to Dashboard</a>
                </body></html>
            `);
        }

        // Check if already accepted/cancelled
        const pendingStatuses = ['CREATED', 'PAYMENT_PENDING', 'USER_MARKED_PAID', 'PAYMENT_CONFIRMED'];
        if (!pendingStatuses.includes(order.status)) {
            const orderIdShort = order._id.toString().slice(-6).toUpperCase();
            return res.send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:50px;">
                <h1>ℹ️ Order Already Processed</h1>
                <p>Order <strong>#${orderIdShort}</strong> is currently: <strong>${order.status}</strong></p>
                <p>No action needed.</p>
                <a href="/admin/orders" style="display:inline-block;margin-top:20px;padding:12px 30px;background:#ed1c24;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">Open Dashboard</a>
                </body></html>
            `);
        }

        // Accept the order
        order.status = 'ACCEPTED';
        order.orderStatus = 'ACCEPTED';
        order.acceptedAt = new Date();
        await order.save();

        const orderIdShort = order._id.toString().slice(-6).toUpperCase();

        // Stop reminders
        const { onOrderAccepted } = require('../utils/orderReminders');
        onOrderAccepted(order);

        // Socket: Notify dashboard + stop siren
        if (req.io) {
            req.io.to(order._id.toString()).emit('orderUpdate', order);
            req.io.to('adminRoom').emit('adminOrderUpdate', order);
            req.io.to('adminRoom').emit('stopSiren', { orderId: order._id.toString() });
        }

        console.log(`[ORDER] ✅ Order #${orderIdShort} accepted via EMAIL one-click link`);

        // Return success HTML page
        res.send(`
            <html>
            <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
            <body style="font-family:'Segoe UI',sans-serif;text-align:center;padding:50px;background:#f8f9fa;">
                <div style="max-width:500px;margin:0 auto;background:#fff;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);">
                    <div style="font-size:60px;margin-bottom:20px;">✅</div>
                    <h1 style="color:#2ed573;margin-bottom:10px;">Order Accepted!</h1>
                    <p style="font-size:18px;color:#555;">Order <strong style="color:#ed1c24;">#${orderIdShort}</strong> has been confirmed.</p>
                    <p style="color:#888;font-size:14px;margin-top:5px;">Customer: ${order.userDetails?.name || 'N/A'} | ₹${order.totalAmount}</p>
                    <hr style="margin:25px 0;border:none;border-top:1px solid #eee;">
                    <p style="color:#888;font-size:13px;">Reminders have been stopped. Please assign a delivery partner.</p>
                    <a href="/admin/orders" style="display:inline-block;margin-top:20px;padding:15px 40px;background:linear-gradient(135deg,#ed1c24,#ff6b6b);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:16px;box-shadow:0 5px 20px rgba(237,28,36,0.3);">
                        Open Dashboard →
                    </a>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error('[ORDER] Email accept error:', err);
        res.status(500).send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:50px;">
            <h1>❌ Error</h1>
            <p>${err.message}</p>
            <a href="/admin/orders" style="color:#ed1c24;">Go to Dashboard</a>
            </body></html>
        `);
    }
});

// Cancel Order (User or Admin) - Moved to top for priority
const handleCancellation = async (req, res) => {
    try {
        const { reason, role } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const currentStatus = order.status;

        // User specific restriction
        if (role !== 'admin' && role !== 'ADMIN') {
            const allowedForUser = ['CREATED', 'PAYMENT_PENDING'];
            if (!allowedForUser.includes(currentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Order cannot be cancelled at this stage: ${currentStatus}`
                });
            }
        } else {
            // Admin specific restriction
            if (['DELIVERED', 'CANCELLED'].includes(currentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel an order that is already delivered or cancelled'
                });
            }
        }

        // Logic for wallet refund if used
        if (order.walletAmountUsed > 0) {
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
                    description: `Refund for cancelled order #${order._id.toString().slice(-6).toUpperCase()}`,
                    status: 'ACTIVE',
                    remainingAmount: order.walletAmountUsed,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
                await refundTxn.save();
            }
        }

        order.status = 'CANCELLED';
        order.orderStatus = 'CANCELLED';
        order.cancelledAt = new Date();
        order.rejectReason = reason || 'Order cancelled';
        await order.save();

        if (req.io) {
            req.io.to(order._id.toString()).emit('orderUpdate', order);
            req.io.to('adminRoom').emit('adminOrderUpdate', order);
            // Stop siren immediately on cancel
            req.io.to('adminRoom').emit('stopSiren', { orderId: order._id.toString() });
            if (order.deliveryBoyId) {
                req.io.to(`delivery_${order.deliveryBoyId}`).emit('stopSiren', { orderId: order._id.toString() });
            }
        }

        // Clear all reminder timers
        const { onOrderFinished } = require('../utils/orderReminders');
        onOrderFinished(order._id);

        res.json({ success: true, message: 'Order cancelled successfully.', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

router.put('/:id/cancel', handleCancellation);
router.post('/:id/cancel', handleCancellation);

// Create a new order
router.post('/create', async (req, res) => {
    try {
        const {
            userId, userDetails, items, totalAmount, paymentMode, userCoords,
            tipAmount, packagingCharge, platformFee, deliveryDistance, deliveryCharge,
            walletAmountUsed, order_notes, scheduled_at,
            extraCharges, extraChargesTotal,
            couponCode, couponDiscount // New coupon fields
        } = req.body;

        // CRITICAL: Prevent guest orders - user must be logged in
        if (!userId || userId === 'guest') {
            return res.status(401).json({
                error: 'Please login to place an order',
                requiresAuth: true
            });
        }

        const settings = await SystemSettings.findOne();

        // ========================
        // PAYMENT METHOD VALIDATION
        // ========================
        const paymentMethod = (paymentMode || '').toUpperCase();
        const mode = paymentMethod;

        // Safety: all methods disabled
        if (settings && !settings.isCodEnabled && !settings.isUpiEnabled && !settings.isRazorpayEnabled) {
            return res.status(400).json({ error: 'Payments are temporarily unavailable. Please try later.' });
        }

        // Validate individual methods
        if (mode === 'COD' && settings && !settings.isCodEnabled) {
            return res.status(400).json({ error: 'Selected payment method is currently unavailable.' });
        }
        if (mode === 'UPI_MANUAL' && settings && !settings.isUpiEnabled) {
            return res.status(400).json({ error: 'Selected payment method is currently unavailable.' });
        }
        if (mode === 'RAZORPAY' && settings && !settings.isRazorpayEnabled) {
            return res.status(400).json({ error: 'Selected payment method is currently unavailable.' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Enhanced Address Validation
        const TOWN_CONFIG = {
            validPinCode: '587312',
            townKeywords: ['mahalingapura', 'mahalingpur', 'mahalingpuram', 'mlp'],
            serviceCenterLat: 16.3833,
            serviceCenterLng: 75.1167,
            maxServiceRadiusKm: 7
        };

        // Validate delivery address
        let deliveryLat = userCoords?.lat;
        let deliveryLng = userCoords?.lng;

        // If userDetails has coordinates (from address selection), use those
        if (userDetails?.latitude && userDetails?.longitude) {
            deliveryLat = userDetails.latitude;
            deliveryLng = userDetails.longitude;
        }

        // Validate service area
        const validateServiceArea = (pinCode, townCity, lat, lng) => {
            // Check 1: PIN code match
            if (pinCode === TOWN_CONFIG.validPinCode) {
                return { valid: true, reason: 'PIN code match' };
            }

            // Check 2: Town keyword match
            if (townCity) {
                const normalizedTown = townCity.toLowerCase().trim();
                const hasKeyword = TOWN_CONFIG.townKeywords.some(keyword =>
                    normalizedTown.includes(keyword)
                );
                if (hasKeyword) {
                    return { valid: true, reason: 'Town keyword match' };
                }
            }

            // Check 3: Geocoded location within service radius
            if (lat && lng) {
                const distance = calculateDistance(
                    lat, lng,
                    TOWN_CONFIG.serviceCenterLat, TOWN_CONFIG.serviceCenterLng
                );
                if (distance <= TOWN_CONFIG.maxServiceRadiusKm) {
                    return { valid: true, reason: 'Within service radius', distance };
                }
            }

            return { valid: false };
        };

        const addressValidation = validateServiceArea(
            userDetails?.pinCode,
            userDetails?.townCity,
            deliveryLat,
            deliveryLng
        );

        if (!addressValidation.valid) {
            return res.status(400).json({
                error: 'Delivery is available only within Mahalingapura (PIN 587312). You can order for someone inside this area.'
            });
        }

        // COUPON + WALLET CONFLICT CHECK
        if (couponCode && couponCode.trim() && walletAmountUsed > 0) {
            return res.status(400).json({
                error: 'You can use either a coupon or wallet credit, not both'
            });
        }

        // Wallet Balance Check & Deduction
        let user = null;
        if (userId && userId !== 'guest') {
            try { user = await User.findById(userId); } catch (e) { }
        }
        if (walletAmountUsed > 0 && userId !== 'guest') {
            if (!user || user.walletBalance < walletAmountUsed) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            user.walletBalance -= walletAmountUsed;
            await user.save();
        }

        // Backend Safety Check: Ensure all items belong to the same restaurant
        const firstRestaurantName = items[0].restaurant;
        const uniformRestaurant = items.every(item => item.restaurant === firstRestaurantName);

        if (!uniformRestaurant) {
            return res.status(400).json({ error: 'Items must belong to the same restaurant' });
        }

        // Backend Safety Check: GPS & Charge Validation
        const [restaurant, deliverySettings] = await Promise.all([
            Restaurant.findOne({ name: firstRestaurantName }),
            require('../models/DeliverySettings').findOne()
        ]);

        let finalDistance = deliveryDistance || 0;
        let finalDeliveryCharge = deliveryCharge || 30;
        let appliedOffer = null;
        let discountAmount = 0;
        let freeDeliveryApplied = false;

        // Offer: First Order Free Delivery with Abuse Protection
        const crypto = require('crypto');
        let blockReason = null;

        // 1. Generate Address Hash
        const rawAddress = userDetails?.address || userDetails?.fullAddress || '';
        const normalizedAddress = rawAddress.toLowerCase().replace(/[^a-z0-9]/g, '');
        const addressHash = crypto.createHash('sha256').update(normalizedAddress).digest('hex');

        // 2. Check Device Fingerprint (from headers or body)
        const deviceFingerprint = req.headers['x-device-fingerprint'] || req.body.deviceFingerprint;

        // 3. Check Eligibility
        // Only if user has 0 orders AND feature is enabled in settings
        if (user && (user.totalOrders || 0) === 0 && settings?.freeDelivery?.firstOrderFree) {

            // Check abuse (same device OR same address used for a DELIVERED order)
            // We search for ANY order that was delivered and matches specific traits
            // NOTE: We only care about DELIVERED orders. Canceled ones don't count.
            const abuseQuery = {
                status: 'DELIVERED',
                $or: [
                    { addressHash: addressHash },
                    ...(deviceFingerprint ? [{ deviceFingerprint: deviceFingerprint }] : [])
                ]
            };

            const existingUsage = await Order.findOne(abuseQuery);

            if (existingUsage) {
                // Abuse Detected -> Deny Offer
                freeDeliveryApplied = false;
                appliedOffer = null;
                blockReason = `Benefit used by Order ${existingUsage._id} (Device/Address Match)`;
                console.log(`[ABUSE_PREVENT] Denied Free Delivery for User ${userId}. Reason: ${blockReason}`);
            } else {
                // Eligible
                finalDeliveryCharge = 0;
                freeDeliveryApplied = true;
                appliedOffer = 'FIRST_ORDER_FREE_DELIVERY';
            }
        }

        // Secondary check for minimum order value free delivery (Global)
        if (!freeDeliveryApplied && settings?.freeDelivery?.minOrderValue > 0) {
            const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
            if (subtotal >= settings.freeDelivery.minOrderValue) {
                finalDeliveryCharge = 0;
                freeDeliveryApplied = true;
                appliedOffer = 'MIN_ORDER_VALUE_FREE_DELIVERY';
            }
        }


        if (restaurant && restaurant.location && deliveryLat && deliveryLng) {
            const distance = calculateDistance(
                deliveryLat, deliveryLng,
                restaurant.location.lat, restaurant.location.lng
            );

            finalDistance = distance;

            // Dynamic Slab Logic
            if (!freeDeliveryApplied) {
                if (deliverySettings && deliverySettings.slabs) {
                    const activeSlab = deliverySettings.slabs.find(s => distance <= s.maxKm);
                    if (activeSlab) {
                        finalDeliveryCharge = activeSlab.charge;
                    } else {
                        // Use last slab or 60 as fallback
                        const lastSlab = deliverySettings.slabs[deliverySettings.slabs.length - 1];
                        finalDeliveryCharge = lastSlab ? lastSlab.charge : 60;
                    }
                } else {
                    // Hardcoded Fallback if DB settings missing
                    if (distance <= 4) finalDeliveryCharge = 30;
                    else if (distance <= 5) finalDeliveryCharge = 40;
                    else if (distance <= 6) finalDeliveryCharge = 50;
                    else finalDeliveryCharge = 60;
                }
            }

            const radius = deliverySettings?.maxServiceDistance || restaurant.deliveryRadius || 7;
            if (distance > radius && !freeDeliveryApplied) {
                return res.status(400).json({
                    error: `Delivery not available. You are ${distance.toFixed(1)}km away (Limit: ${radius}km).`
                });
            }
        }

        // Scheduling Validation
        let checkTimeStr = '';
        if (scheduled_at) {
            const scheDate = new Date(scheduled_at);
            checkTimeStr = scheDate.getHours().toString().padStart(2, '0') + ':' + scheDate.getMinutes().toString().padStart(2, '0');
        }

        // Availability & Timing Validation
        for (const cartItem of items) {
            let found = false;
            for (const cat of (restaurant.categories || [])) {
                const itemData = cat.items.find(i => i.name === cartItem.name);
                if (itemData) {
                    found = true;
                    // Check manual closure
                    if (cat.isManuallyClosed) {
                        return res.status(400).json({ error: `Category '${cat.name}' is currently closed.` });
                    }
                    // Check item availability
                    if (itemData.isAvailable === false) {
                        return res.status(400).json({ error: `Item '${cartItem.name}' is temporarily unavailable.` });
                    }
                    // Check scheduled timing if applicable
                    if (scheduled_at) {
                        if (!isTimeWithinSchedules(checkTimeStr, cat.timings)) {
                            return res.status(400).json({ error: `The restaurant is closed at ${checkTimeStr} for '${cat.name}'.` });
                        }
                    }
                    break;
                }
            }
        }

        // Increment order count
        if (user) {
            user.totalOrders += 1;
            await user.save();
        }

        // Calculate initial status using new enum
        let initialStatus = 'CREATED';
        if (paymentMode === 'UPI_MANUAL') {
            initialStatus = 'PAYMENT_PENDING';
        } else if (paymentMode === 'RAZORPAY') {
            // Razorpay orders wait for webhook confirmation
            initialStatus = 'PAYMENT_PENDING';
        } else if (paymentMode === 'COD') {
            // COD orders start as CREATED so they buzz until admin accepts
            initialStatus = 'CREATED';
        }

        if (scheduled_at) {
            // Scheduled orders stay in PAYMENT_PENDING until scheduled time
            initialStatus = 'PAYMENT_PENDING';
        }

        // Validate and ensure all fees are numbers (never undefined)
        const validatedTotalAmount = Number(totalAmount) || 0;
        const validatedDeliveryFee = Number(finalDeliveryCharge) || 0;
        const validatedPackagingFee = Number(packagingCharge) || 0;
        const validatedPlatformFee = Number(platformFee) || 0;
        const validatedTipAmount = Number(tipAmount) || 0;
        const validatedWalletAmount = Number(walletAmountUsed) || 0;
        const validatedCouponDiscount = Number(couponDiscount) || 0;
        const validatedExtraChargesTotal = Number(extraChargesTotal) || 0;

        const OrderDraft = require('../models/OrderDraft');

        // ✅ SERVER-SIDE TOTAL AMOUNT RECALCULATION (safety net)
        // If frontend sends 0 or undefined, we recalculate from items + fees
        let serverCalculatedTotal = 0;
        if (!validatedTotalAmount || validatedTotalAmount <= 0) {
            const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
            serverCalculatedTotal = subtotal
                + validatedDeliveryFee
                + validatedPackagingFee
                + validatedPlatformFee
                + validatedTipAmount
                + validatedExtraChargesTotal
                - validatedWalletAmount
                - validatedCouponDiscount;
            serverCalculatedTotal = Math.max(0, Math.round(serverCalculatedTotal));
            console.warn(`[ORDER] ⚠️ Frontend sent totalAmount=${validatedTotalAmount}, recalculated: ₹${serverCalculatedTotal}`);
        }
        const finalTotalAmount = validatedTotalAmount > 0 ? validatedTotalAmount : serverCalculatedTotal;

        const orderPayload = {
            userId,
            userDetails: {
                ...userDetails,
                googleFormattedAddress: userDetails.googleFormattedAddress,
                latitude: deliveryLat,
                longitude: deliveryLng,
                addressType: userDetails.addressType || 'manual'
            },
            items,
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            restaurantAddress: restaurant.address,
            shopLocation: restaurant.location ? { lat: restaurant.location.lat, lng: restaurant.location.lng } : undefined,

            // Validated amounts (never undefined, never 0)
            totalAmount: finalTotalAmount,
            deliveryFee: validatedDeliveryFee,
            packagingFee: validatedPackagingFee,
            platformFee: validatedPlatformFee,
            tipAmount: validatedTipAmount,
            walletAmountUsed: validatedWalletAmount,
            couponDiscount: validatedCouponDiscount,
            extraChargesTotal: validatedExtraChargesTotal,

            paymentMethod: (mode === 'UPI_MANUAL') ? 'RAZORPAY' : mode,
            status: initialStatus,
            orderStatus: initialStatus,
            deliveryDistance: Number(finalDistance) || 0,
            deliveryCharge: validatedDeliveryFee,
            packagingCharge: validatedPackagingFee,

            customCharges: req.body.customCharges || [],
            order_notes: order_notes || null,
            scheduled_at: scheduled_at ? new Date(scheduled_at) : null,

            // Coupon details
            appliedCoupon: couponCode ? {
                code: couponCode,
                discountAmount: validatedCouponDiscount
            } : undefined,

            appliedOffer,
            discountAmount: Number(discountAmount) || 0,
            freeDeliveryApplied,
            paymentStatus: 'PENDING',

            customerLocation: { lat: deliveryLat, lng: deliveryLng },
            deviceFingerprint,
            addressHash,
            isFirstOrderBenefit: freeDeliveryApplied,

            // Smart Extra Charges
            extraCharges: extraCharges || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (paymentMode.toUpperCase() === 'RAZORPAY') {
            // Rule 1: Never create order before verification
            const draft = new OrderDraft({
                userId,
                orderData: orderPayload
            });
            await draft.save();
            return res.status(201).json({
                ...orderPayload,
                _id: draft._id,
                orderId: draft._id, // ✅ Include both keys
                isDraft: true
            });
        }

        const newOrder = new Order(orderPayload);
        await newOrder.save();

        console.log(`[ORDER] ✅ Created: ${newOrder._id} | ₹${newOrder.totalAmount} | ${newOrder.paymentMethod} | User: ${userId}`);

        // ⚡ SPEED GAIN: Respond to client IMMEDIATELY with full order data
        res.status(201).json({
            success: true,
            _id: newOrder._id,        // ✅ Direct _id for navigate()
            orderId: newOrder._id,    // ✅ Alias used by some frontend paths
            status: newOrder.orderStatus,
            totalAmount: newOrder.totalAmount,  // ✅ Always include amount
            order: newOrder           // ✅ Full order object
        });

        // 📢 OFFLOAD ALL SECONDARY LOGIC (Non-blocking — runs after response sent)
        setImmediate(async () => {
            try {
                // 1. Record coupon usage
                if (couponCode && couponCode.trim() && couponDiscount > 0) {
                    try {
                        const Coupon = require('../models/Coupon');
                        const CouponUsage = require('../models/CouponUsage');
                        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
                        if (coupon) {
                            const usage = new CouponUsage({
                                couponId: coupon._id,
                                userId: userId,
                                orderId: newOrder._id,
                                discountAmount: couponDiscount,
                                orderAmount: finalTotalAmount
                            });
                            await usage.save();
                            coupon.timesUsed += 1;
                            coupon.totalDiscountGiven += couponDiscount;
                            await coupon.save();
                        }
                    } catch (cErr) { console.error('[COUPON_LOG] Error:', cErr); }
                }

                // 2. Real-time Notifications
                const { emitAdminOrderAlert, emitUserNotification, getIO } = require('../socket');
                const { onOrderCreated } = require('../utils/orderReminders');

                // Instant siren + popup on admin dashboard
                if (newOrder.paymentMethod !== 'RAZORPAY') {
                    emitAdminOrderAlert(newOrder);
                }

                // 3. ✅ SMS — fires immediately after order saved (not after reminder engine)
                try {
                    if (newOrder.paymentMethod !== 'RAZORPAY') {
                        const { sendSMS } = require('../utils/sms');
                        const SystemSettings = require('../models/SystemSettings');
                        const smsSettings = await SystemSettings.findOne();
                        const adminPhones = (smsSettings?.notificationAlerts?.adminPhone || process.env.ADMIN_PHONES || '9380801462').split(',');
                        const itemSummary = newOrder.items.map(i => `${i.name} x${i.quantity}`).join(', ');
                        const smsBody = `🔔 NEW ORDER #${newOrder._id.toString().slice(-6).toUpperCase()}\n${itemSummary}\nTotal: ₹${newOrder.totalAmount}\nPay: ${newOrder.paymentMethod}\nAddr: ${newOrder.userDetails?.address || 'N/A'}`;
                        for (const phone of adminPhones) {
                            await sendSMS(phone.trim(), smsBody).catch(e => console.error('[SMS]', e.message));
                        }
                        // Mark SMS as sent to prevent duplicate from reminder engine
                        await Order.findByIdAndUpdate(newOrder._id, { smsSent: true });
                        console.log(`[SMS] ✅ Admin notified for order ${newOrder._id}`);
                    }
                } catch (smsErr) { console.error('[SMS_ERROR]', smsErr.message); }

                // 4. Reminder Engine (ongoing reminders)
                if (newOrder.paymentMethod !== 'RAZORPAY') {
                    onOrderCreated(newOrder);
                }

                // 5. Notify user via socket
                if (userId && userId !== 'guest') {
                    emitUserNotification(userId, {
                        type: 'ORDER_PLACED',
                        orderId: newOrder._id,
                        message: 'Your order has been placed successfully!',
                        order: newOrder
                    });

                    // 6. User Email
                    const { sendUserOrderEmail } = require('../utils/email');
                    await sendUserOrderEmail(newOrder, 'ORDER_CONFIRMED');
                }
            } catch (asyncErr) {
                console.error('🔥 [ASYNC_POST_ORDER_ERROR]', asyncErr);
            }
        });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Mark Order as Seen
router.post('/:id/seen', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { isAdminSeen: true }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get all orders (for Admin Dashboard)
router.get('/all', async (req, res) => {
    try {
        const { liveOnly } = req.query;
        let query = {};
        if (liveOnly === 'true') {
            query.isHiddenFromLive = { $ne: true };
        }

        // Use lean() for performance
        const allOrders = await Order.find(query)
            .populate('deliveryBoyId', 'fullName mobile')
            .sort({ createdAt: -1 })
            .lean();

        // Fetch all active restaurants once to avoid N+1 queries in the loop
        const restaurants = await Restaurant.find().select('name address phone whatsappEnabled').lean();
        const restMap = {};
        restaurants.forEach(r => restMap[r.name] = r);

        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;

        const processedOrders = allOrders.map(order => {
            if (!order.restaurantName && order.items && order.items.length > 0) {
                order.restaurantName = order.items[0].restaurant;
            }

            // Fill missing restaurant info from cache
            if (!order.restaurantAddress && order.restaurantName) {
                const rest = restMap[order.restaurantName];
                if (rest) {
                    order.restaurantAddress = rest.address;
                    order.restaurantPhone = rest.phone;
                    order.restaurantWaEnabled = rest.whatsappEnabled;
                }
            }

            if (order.userDetails && order.userDetails.name) {
                order.customerName = order.userDetails.name;
            }

            if (order.paymentScreenshot && !order.paymentScreenshot.startsWith('data:')) {
                order.paymentScreenshot = order.paymentScreenshot.startsWith('http') ?
                    order.paymentScreenshot :
                    `${baseUrl}${order.paymentScreenshot.startsWith('/') ? '' : '/'}${order.paymentScreenshot}`;
            }
            return order;
        });
        res.json(processedOrders);
    } catch (err) {
        console.error('Fetch orders error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Clear Completed/Cancelled Orders from Live View
router.post('/admin/clear-live', async (req, res) => {
    try {
        const { orderIds } = req.body;
        let query = {};

        // If specific IDs provided, use them (Frontend knows best what to clear)
        if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
            query = { _id: { $in: orderIds } };
        } else {
            // Fallback to status-based clearing
            query = { status: { $in: ['DELIVERED', 'CANCELLED', 'REJECTED'] } };
        }

        const result = await Order.updateMany(
            query,
            { $set: { isHiddenFromLive: true } }
        );
        res.json({ success: true, message: "Live orders cleared", count: result.modifiedCount });
    } catch (err) {
        console.error("Clear live error:", err);
        res.status(500).json({ success: false, message: "Failed to clear live orders" });
    }
});

// Admin: Get Orders (with optional liveOnly filter)
router.get('/admin', async (req, res) => {
    try {
        const { liveOnly } = req.query;
        let query = {};
        if (liveOnly === 'true') {
            query.isHiddenFromLive = { $ne: true };
        }

        const allOrders = await Order.find(query)
            .populate('deliveryBoyId', 'fullName mobile')
            .sort({ createdAt: -1 })
            .lean();

        // 🧠 In-Memory Cache to prevent redundant DB calls
        let restMap = global.restaurant_cache_data;
        const now = Date.now();
        if (!restMap || !global.restaurant_cache_time || (now - global.restaurant_cache_time > 60000)) {
            const restaurants = await Restaurant.find().select('name address phone whatsappEnabled').lean();
            restMap = {};
            restaurants.forEach(r => restMap[r.name] = r);
            global.restaurant_cache_data = restMap;
            global.restaurant_cache_time = now;
        }

        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;

        const processedOrders = allOrders.map(order => {
            if (!order.restaurantName && order.items && order.items.length > 0) {
                order.restaurantName = order.items[0].restaurant;
            }

            if (!order.restaurantAddress && order.restaurantName) {
                const rest = restMap[order.restaurantName];
                if (rest) {
                    order.restaurantAddress = rest.address;
                    order.restaurantPhone = rest.phone;
                    order.restaurantWaEnabled = rest.whatsappEnabled;
                }
            }

            if (order.userDetails && order.userDetails.name) {
                order.customerName = order.userDetails.name;
            }

            if (order.paymentScreenshot && !order.paymentScreenshot.startsWith('data:')) {
                order.paymentScreenshot = order.paymentScreenshot.startsWith('http') ?
                    order.paymentScreenshot :
                    `${baseUrl}${order.paymentScreenshot.startsWith('/') ? '' : '/'}${order.paymentScreenshot}`;
            }
            return order;
        });
        res.json({ success: true, orders: processedOrders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get a specific order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('deliveryBoyId', 'fullName mobile');
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const obj = order.toObject();
        if (!obj.restaurantName && obj.items && obj.items.length > 0) {
            obj.restaurantName = obj.items[0].restaurant;
        }
        if (!obj.restaurantAddress && (obj.restaurantId || obj.restaurantName)) {
            const query = obj.restaurantId ? { _id: obj.restaurantId } : { name: obj.restaurantName };
            const rest = await Restaurant.findOne(query).select('address');
            if (rest) obj.restaurantAddress = rest.address;
        }
        if (obj.paymentScreenshot && !obj.paymentScreenshot.startsWith('data:')) {
            const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
            obj.paymentScreenshot = obj.paymentScreenshot.startsWith('http') ? obj.paymentScreenshot : `${baseUrl}${obj.paymentScreenshot.startsWith('/') ? '' : '/'}${obj.paymentScreenshot}`;
        }
        res.json(obj);
    } catch (err) {
        res.status(400).json({ error: 'Invalid ID or order not found' });
    }
});

// Update Order Status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, deliveryBoyId, reason } = req.body;

        // Validate status is from allowed enum
        // Rule 2 & Target 2: Standardized status list
        const validStatuses = [
            "PENDING_ACCEPTANCE",
            "ACCEPTED",
            "PREPARING",
            "READY_FOR_PICKUP",
            "ASSIGNED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const updatedOrder = await updateOrderStatusInternal(req.params.id, status, {
            io: req.io,
            deliveryBoyId,
            reason
        });
        return res.json({ success: true, order: updatedOrder });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});


// Assign Delivery Partner (Rule 4 & 5)
router.put('/:id/assign', async (req, res) => {
    try {
        const { deliveryBoyId } = req.body;
        const Order = require('../models/Order');

        if (!deliveryBoyId) {
            return res.status(400).json({ success: false, message: 'Delivery partner ID required' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Rule 4: Lock Rider Assignment
        if (order.orderStatus === "ASSIGNED") {
            return res.status(400).json({ success: false, message: "Rider already assigned" });
        }

        // Rule 4: Frontend logic should only allow this if READY_FOR_PICKUP
        // But for safety, we allow it if it's currently READY_FOR_PICKUP or higher (unless already assigned)
        if (order.orderStatus !== "READY_FOR_PICKUP" && order.orderStatus !== "ACCEPTED" && order.orderStatus !== "PREPARING") {
            return res.status(400).json({ success: false, message: "Order not ready for rider assignment" });
        }

        order.deliveryBoyId = deliveryBoyId;
        order.status = 'ASSIGNED';
        order.orderStatus = 'ASSIGNED';
        order.assignedAt = new Date();
        order.updatedAt = new Date();
        await order.save();

        const populatedOrder = await Order.findById(order._id).populate('deliveryBoyId', 'fullName mobile');

        // Emit real-time updates (Rule 5 & 7)
        if (req.io) {
            const { emitOrderStatusUpdate, emitDeliveryAssignment } = require('../socket');
            // Rule 7: Admin gets status update, User gets status update
            emitOrderStatusUpdate(populatedOrder);
            // Rule 5: Rider gets specific assignment event
            emitDeliveryAssignment(populatedOrder, deliveryBoyId);
        }

        res.json({ success: true, message: 'Delivery partner assigned', order: populatedOrder });
    } catch (err) {
        console.error('Assign delivery partner error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Send Payment Instructions
router.post('/:id/send-payment-instructions', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Here you could send SMS/notification with payment QR code
        // For now, just return success
        res.json({ success: true, message: 'Payment instructions sent to customer' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Confirm Payment (Admin Action)
router.put('/:id/confirm-payment', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update payment and order status
        order.paymentStatus = 'PAID';
        order.status = 'ACCEPTED';
        order.orderStatus = 'ACCEPTED';
        order.acceptedAt = new Date();
        order.updatedAt = new Date();
        await order.save();

        // Emit socket events for real-time updates
        if (req.io) {
            const { emitOrderStatusUpdate } = require('../socket');
            emitOrderStatusUpdate(order);
            // Stop siren immediately on payment confirmation
            req.io.to('adminRoom').emit('stopSiren', { orderId: order._id.toString() });
        }

        res.json({ success: true, message: 'Payment confirmed', order });
    } catch (err) {
        console.error('Payment confirmation error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// User marks as paid (UPI Manual) - Now with Screenshot Upload
router.put('/:id/mark-paid', paymentUpload.single('paymentScreenshot'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.paymentStatus = 'PENDING'; // Still pending admin verification

        // Save screenshot path if uploaded
        if (req.file) {
            order.paymentScreenshot = `/uploads/payment-screenshots/${req.file.filename}`;
        }

        // DO NOT change order status (remain PENDING_PAYMENT)
        await order.save();

        if (req.io) {
            const { emitOrderStatusUpdate, emitAdminOrderAlert } = require('../socket');
            emitOrderStatusUpdate(order);
            emitAdminOrderAlert(order);
        }

        // ALERT ADMIN NOW - Payment proof submitted, admin should be notified
        try {
            const { emitAdminOrderAlert } = require('../socket');
            emitAdminOrderAlert(order);

            // Send Email for Payment Proof
            const { sendAdminOrderEmail } = require('../utils/email');
            await sendAdminOrderEmail(order, null, 'NEW_ORDER');
        } catch (alertErr) {
            console.error('Admin alert error (non-critical):', alertErr);
        }

        res.json({ msg: 'Waiting for admin confirmation', order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin rejects payment
router.put('/:id/reject-payment', async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.paymentStatus = 'FAILED';
        // DO NOT automatically cancel the order, allow re-upload
        order.rejectReason = reason || 'Payment verification failed';
        await order.save();

        if (req.io) {
            const { emitOrderStatusUpdate, emitAdminOrderAlert } = require('../socket');
            emitOrderStatusUpdate(order);
            emitAdminOrderAlert(order);
        }

        res.json({ success: true, message: 'Payment rejected. User can re-upload.', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }

});


// Admin Mark Cash Collected (COD)
router.put('/:id/mark-cash-collected', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.paymentStatus = 'PAID';
        await order.save();

        if (req.io) {
            const { emitOrderStatusUpdate, emitAdminOrderAlert } = require('../socket');
            emitOrderStatusUpdate(order);
            emitAdminOrderAlert(order);
        }

        res.json({ success: true, message: 'Cash collection confirmed', order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Chat Messaging
router.post('/:id/message', async (req, res) => {
    try {
        const { sender, senderName, senderImage, text } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const newMessage = { sender, senderName, senderImage, text, timestamp: new Date() };
        order.messages.push(newMessage);
        await order.save();

        if (req.io) {
            req.io.to(order._id.toString()).emit('newMessage', {
                orderId: order._id,
                message: newMessage
            });
            // Also emit update to lists so unread indicators/timers update
            req.io.to(order._id.toString()).emit('orderUpdate', order);
            req.io.to('adminRoom').emit('adminOrderUpdate', order);

            // Notify specific user room for message
            const userId = order.userId?._id || order.userId;
            if (userId) {
                req.io.to(`user_${userId}`).emit('userOrderUpdate', order);
            }
        }

        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Rider Location
router.put('/:id/location', async (req, res) => {
    try {
        const { lat, lng } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { riderLocation: { lat, lng } },
            { new: true }
        );
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        res.json({ msg: 'Location updated', riderLocation: order.riderLocation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Active Orders for User (Floating Tracker)
router.get('/active/:userId', async (req, res) => {
    try {
        const activeOrders = await Order.find({
            userId: req.params.userId,
            status: { $nin: ['DELIVERED', 'CANCELLED', 'REJECTED'] }
        })
            .populate('deliveryBoyId', 'fullName mobile')
            .populate('restaurantId', 'image name address phone whatsappEnabled')
            .sort({ createdAt: -1 })
            .limit(1);
        res.json(activeOrders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Optional: Get User's Orders
router.get('/user/:userId', async (req, res) => {
    try {
        const userOrders = await Order.find({ userId: req.params.userId })
            .populate('deliveryBoyId', 'fullName mobile')
            .populate('restaurantId', 'image name')
            .sort({ createdAt: -1 });
        res.json(userOrders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
