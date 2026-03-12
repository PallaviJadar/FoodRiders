const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const CategoryGroup = require('../models/CategoryGroup');

router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const regex = new RegExp(q, 'i');
        let results = [];
        const seenRestaurantIds = new Set(); // Prevent duplicates

        // 1. Search Active Coupons/Offers
        const Coupon = require('../models/Coupon');
        const coupons = await Coupon.find({
            code: regex,
            isActive: true
        }).lean();

        if (coupons.length > 0) {
            for (const coupon of coupons) {
                let restaurantQuery = { isActive: { $ne: false } };

                // If coupon has specific restaurants, only show those
                if (coupon.applicableRestaurantIds && coupon.applicableRestaurantIds.length > 0) {
                    restaurantQuery._id = { $in: coupon.applicableRestaurantIds };
                }

                const validRestaurants = await Restaurant.find(restaurantQuery)
                    .select('name _id image rating deliveryTime tags')
                    .limit(10)
                    .lean();

                validRestaurants.forEach(r => {
                    if (!seenRestaurantIds.has(r._id.toString())) {
                        results.push({
                            id: r._id,
                            name: r.name,
                            type: 'restaurant',
                            image: r.image,
                            rating: r.rating,
                            deliveryTime: r.deliveryTime,
                            tags: r.tags,
                            badge: coupon.code, // Show the coupon code as a badge
                            parentId: null,
                            slug: null
                        });
                        seenRestaurantIds.add(r._id.toString());
                    }
                });
            }
        }

        // 2. Search Restaurants (Standard match)
        const restaurants = await Restaurant.find({
            $or: [{ name: regex }, { tags: regex }],
            isActive: true
        }).select('name _id image rating deliveryTime tags').lean();

        restaurants.forEach(r => {
            if (!seenRestaurantIds.has(r._id.toString())) {
                results.push({
                    id: r._id,
                    name: r.name,
                    type: 'restaurant',
                    image: r.image,
                    rating: r.rating,
                    deliveryTime: r.deliveryTime,
                    tags: r.tags,
                    parentId: null,
                    slug: null
                });
                seenRestaurantIds.add(r._id.toString());
            }
        });

        // 3. Search Category Groups
        const groups = await CategoryGroup.find({
            name: regex
        }).select('name _id image').lean();

        results.push(...groups.map(g => ({
            id: g._id,
            name: g.name,
            type: 'category',
            image: g.image,
            parentId: null,
            slug: g.name
        })));

        // 4. Search Menu Items (Deep search in Restaurants)
        const menuRestaurants = await Restaurant.find({
            "categories.items.name": regex,
            isActive: true
        }).select('name _id categories image rating deliveryTime').lean();

        menuRestaurants.forEach(r => {
            (r.categories || []).forEach(cat => {
                (cat.items || []).forEach(item => {
                    if (regex.test(item.name)) {
                        results.push({
                            id: item._id || item.name,
                            name: item.name,
                            type: 'menu_item',
                            parentName: r.name,
                            parentId: r._id,
                            image: item.image || r.image,
                            slug: null
                        });
                    }
                });
            });
        });

        // Limit results
        res.json(results.slice(0, 30));

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
