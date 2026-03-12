const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');
const cache = require('../utils/cache');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Helper to handle legacy image paths for backward compatibility
const ensureFullImagePath = (obj, req) => {
  if (!obj) return obj;
  // FORCE WWW for all image links to prevent CDN blocks
  const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;

  // Handle main image
  if (obj.image) {
    if (obj.image.startsWith('data:')) {
      obj.image = ''; // Strip massive base64 strings to prevent freeze
    } else if (!obj.image.startsWith('http')) {
      obj.image = `${baseUrl}/uploads/${obj.image}`;
    }
  }

  // Handle nested menu items if they exist
  if (obj.categories) {
    obj.categories.forEach(cat => {
      if (cat.items) {
        cat.items.forEach(item => {
          if (item.image) {
            if (item.image.startsWith('data:')) {
              item.image = ''; // Strip massive base64 strings to prevent 30-sec load times
            } else if (!item.image.startsWith('http') && !item.image.startsWith('/uploads/')) {
              item.image = `${baseUrl}/uploads/${item.image}`;
            }
          }
        });
      }
    });
  }
  return obj;
};

// Multer setup for image upload using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });


// Add a restaurant
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  const { name, address, rating, deliveryTime, tags, categoryGroups, bridgeCategories, displayOrder, phone, whatsappEnabled } = req.body;
  let image = req.body.image;
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.png';
    image = `rest_${Date.now()}${ext}`;
    const rootUploads = path.join(__dirname, '../../uploads');
    const serverUploads = path.join(__dirname, '../uploads');
    if (fs.existsSync(rootUploads)) fs.writeFileSync(path.join(rootUploads, image), req.file.buffer);
    if (fs.existsSync(serverUploads)) fs.writeFileSync(path.join(serverUploads, image), req.file.buffer);
  }
  try {
    const restaurant = new Restaurant({
      name, address, rating, deliveryTime, image,
      phone: phone || '',
      whatsappEnabled: whatsappEnabled === 'true' || whatsappEnabled === true,
      displayOrder: Number(displayOrder) || 0,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      categoryGroups: categoryGroups ? (typeof categoryGroups === 'string' ? JSON.parse(categoryGroups) : categoryGroups) : [],
      bridgeCategories: bridgeCategories ? (typeof bridgeCategories === 'string' ? JSON.parse(bridgeCategories) : bridgeCategories) : [],
      categories: []
    });
    await restaurant.save();

    // 🧹 Purge ALL caches to ensure total consistency
    cache.purgeAll();

    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ msg: 'Error adding restaurant', error: err.message });
  }
});

// List active restaurants (Public)
router.get('/', async (req, res) => {
  try {
    const { tag, categoryGroup } = req.query;
    const cacheKey = `public_list_${tag || 'none'}_${categoryGroup || 'none'}`;
    const fetcher = async () => {
      let query = { isActive: { $ne: false } };
      if (tag) query.tags = { $regex: new RegExp(tag.trim(), 'i') };
      if (categoryGroup && !categoryGroup.toLowerCase().includes('all')) {
        const target = categoryGroup.trim();
        const fuzzyTarget = target.replace(/\s+/g, '.*');
        const regex = new RegExp(fuzzyTarget, 'i');
        query.$or = [{ categoryGroups: regex }, { bridgeCategories: regex }, { tags: regex }];
      }
      const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
      return await Restaurant.aggregate([
        { $match: query },
        { $sort: { displayOrder: -1, _id: 1 } },
        { $project: { "categories.items": 0 } },
        {
          $addFields: {
            image: {
              $cond: [
                { $or: [{ $not: ["$image"] }, { $regexMatch: { input: "$image", regex: "^http|^data:" } }] },
                "$image",
                { $concat: [baseUrl, "/uploads/", "$image"] }
              ]
            }
          }
        }
      ]);
    };
    const results = await cache.getOrSet(cacheKey, 30000, fetcher);
    res.json(results);
  } catch (err) {
    console.error('Restaurant Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// List ALL restaurants (Admin)
router.get('/all', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const cacheKey = 'all_restaurants_admin';
    const fetcher = async () => {
      const baseUrl = process.env.BASE_URL || `https://www.foodriders.in`;
      return await Restaurant.aggregate([
        { $sort: { displayOrder: -1, _id: 1 } },
        {
          $project: {
            name: 1, address: 1, rating: 1, deliveryTime: 1,
            phone: 1, whatsappEnabled: 1, image: 1, isActive: 1,
            displayOrder: 1, tags: 1, categoryGroups: 1, bridgeCategories: 1,
            categoryCount: { $size: { $ifNull: ["$categories", []] } },
            itemCount: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$categories", []] },
                  as: "cat",
                  in: { $size: { $ifNull: ["$$cat.items", []] } }
                }
              }
            }
          }
        },
        {
          $addFields: {
            image: {
              $cond: [
                { $or: [{ $not: ["$image"] }, { $regexMatch: { input: "$image", regex: "^http|^data:" } }] },
                "$image",
                { $concat: [baseUrl, "/uploads/", "$image"] }
              ]
            }
          }
        }
      ]);
    };

    const results = await cache.getOrSet(cacheKey, 30000, fetcher);
    res.json(results);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Toggle Restaurant Status
router.patch('/:id/toggle-status', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ msg: 'Not found' });

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    // 🧹 Purge ALL caches to ensure total consistency
    cache.purgeAll();

    // 📢 Real-time pulse for users
    const { emitRestaurantUpdate } = require('../socket');
    emitRestaurantUpdate(req.params.id, { isActive: restaurant.isActive });

    res.json({ msg: `Restaurant ${restaurant.isActive ? 'Enabled' : 'Disabled'}`, isActive: restaurant.isActive });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Search API
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q.trim(), 'i');

    const restaurants = await Restaurant.find({
      isActive: { $ne: false }, // Only search active
      $or: [
        { name: regex },
        { tags: regex },
        { categoryGroups: regex },
        { bridgeCategories: regex },
        { "categories.items.name": regex }
      ]
    }).lean();

    const results = restaurants.map(r => {
      const categoryCount = (r.categories || []).length;
      let itemCount = 0;
      let matchedItems = [];

      (r.categories || []).forEach(cat => {
        itemCount += (cat.items || []).length;
        const hits = cat.items.filter(i => regex.test(i.name));
        if (hits.length > 0) {
          matchedItems.push(...hits.map(h => h.name));
        }
      });

      const { categories, ...rest } = r;
      return {
        ...rest,
        categoryCount,
        itemCount,
        matchedItems: matchedItems.slice(0, 3)
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Search Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get single restaurant by slug (For Restaurant Page)
router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    // 🧠 FAST-CACHE: Serve public restaurant pages from RAM
    const cacheKey = `rest_slug_${slug}`;
    const now = Date.now();
    if (global[cacheKey] && global[`${cacheKey}_time`] && (now - global[`${cacheKey}_time`] < 30000)) {
      return res.json(global[cacheKey]);
    }

    let restaurant;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      restaurant = await Restaurant.findById(slug).lean();
    }

    if (restaurant) {
      const result = ensureFullImagePath(restaurant.toObject(), req);
      global[cacheKey] = result;
      global[`${cacheKey}_time`] = now;
      return res.json(result);
    }

    const formattedName = slug.replace(/-/g, ' ');
    restaurant = await Restaurant.findOne({
      name: { $regex: new RegExp('^' + formattedName + '$', 'i') }
    });

    if (!restaurant) {
      restaurant = await Restaurant.findOne({
        name: { $regex: new RegExp('^' + slug + '$', 'i') }
      });
    }

    if (!restaurant) {
      const allRest = await Restaurant.find({}, 'name').lean();
      const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const target = normalize(slug);

      const found = allRest.find(r => normalize(r.name) === target);
      if (found) {
        restaurant = await Restaurant.findById(found._id).lean();
      }
    }

    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant not found' });
    }

    const result = ensureFullImagePath(restaurant, req);

    // Save to Cache (30 sec)
    global[cacheKey] = result;
    global[`${cacheKey}_time`] = now;

    res.json(result);

  } catch (err) {
    res.status(400).json({ msg: 'Error fetching restaurant', error: err.message });
  }
});

// Get single restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    // 🧠 FAST-CACHE: Return immediately if we fetched this restaurant recently
    const cacheKey = `rest_cache_${req.params.id}`;
    const now = Date.now();
    if (global[cacheKey] && global[`${cacheKey}_time`] && (now - global[`${cacheKey}_time`] < 30000)) {
      return res.json(global[cacheKey]);
    }

    const restaurant = await Restaurant.findById(req.params.id).lean();
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });
    const result = ensureFullImagePath(restaurant, req);

    // Save to Cache (30 sec)
    global[cacheKey] = result;
    global[`${cacheKey}_time`] = now;

    res.json(result);

  } catch (err) {
    res.status(400).json({ msg: 'Error fetching restaurant', error: err.message });
  }
});

// Edit a restaurant (Basic Info)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  const { name, address, rating, deliveryTime, tags, categoryGroups, bridgeCategories, displayOrder, phone, whatsappEnabled } = req.body;
  const update = {
    name, address, rating, deliveryTime,
    displayOrder: Number(displayOrder) || 0,
    phone: phone || '',
    whatsappEnabled: whatsappEnabled === 'true' || whatsappEnabled === true
  };
  if (tags) update.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
  if (categoryGroups) update.categoryGroups = typeof categoryGroups === 'string' ? JSON.parse(categoryGroups) : categoryGroups;
  if (bridgeCategories) update.bridgeCategories = typeof bridgeCategories === 'string' ? JSON.parse(bridgeCategories) : bridgeCategories;

  try {
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.png';
      const filename = `rest_${Date.now()}${ext}`;
      const rootUploads = path.join(__dirname, '../../uploads');
      const serverUploads = path.join(__dirname, '../uploads');
      if (fs.existsSync(rootUploads)) fs.writeFileSync(path.join(rootUploads, filename), req.file.buffer);
      if (fs.existsSync(serverUploads)) fs.writeFileSync(path.join(serverUploads, filename), req.file.buffer);
      update.image = filename;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true });

    // 🧹 Purge ALL caches for consistency
    cache.purgeAll();

    // 📢 Real-time pulse
    const { emitRestaurantUpdate } = require('../socket');
    emitRestaurantUpdate(req.params.id, { name: restaurant.name, image: restaurant.image });

    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating restaurant', error: err.message });
  }
});

// Update Menu Structure (Categories and Items)
router.put('/:id/menu', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  const { categories } = req.body;
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { categories },
      { new: true }
    );

    // 🧹 Purge ALL caches for consistency
    cache.purgeAll();

    // 📢 Real-time pulse
    const { emitRestaurantUpdate } = require('../socket');
    emitRestaurantUpdate(req.params.id, { menuUpdate: true });

    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating menu', error: err.message });
  }
});

// Update Price Adjustment Settings
router.put('/:id/price-adjustment', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const { enabled, type, value, applyTo, targetCategories } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });

    const oldValue = restaurant.priceAdjustment?.value || 0;

    restaurant.priceAdjustment = {
      enabled,
      type,
      value,
      applyTo,
      targetCategories,
      lastModified: {
        by: req.user.fullName || 'Admin',
        at: new Date(),
        oldValue,
        newValue: value,
        adjustmentType: type
      }
    };

    await restaurant.save();

    // 🧹 Purge ALL caches to ensure total consistency
    cache.purgeAll();

    console.log(`[Price Adjustment] ${restaurant.name} updated: ${oldValue} -> ${value} (${type}) by ${req.user.fullName}`);
    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ msg: 'Error updating price adjustment', error: err.message });
  }
});

// Get restaurant categories (Utility)
router.get('/:id/categories', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id, 'categories.name');
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });
    const categories = restaurant.categories.map(c => c.name);
    res.json(categories);
  } catch (err) {
    res.status(400).json({ msg: 'Error fetching categories', error: err.message });
  }
});

// Upload item image (Convert to Base64)
router.post('/upload-item-image', auth, upload.single('image'), async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

  try {
    const ext = path.extname(req.file.originalname) || '.png';
    const filename = `item_${Date.now()}${ext}`;

    // Save to both possible locations
    const rootUploads = path.join(__dirname, '../../uploads');
    const serverUploads = path.join(__dirname, '../uploads');

    if (fs.existsSync(rootUploads)) fs.writeFileSync(path.join(rootUploads, filename), req.file.buffer);
    if (fs.existsSync(serverUploads)) fs.writeFileSync(path.join(serverUploads, filename), req.file.buffer);

    res.json({ filename: filename });
  } catch (err) {
    res.status(500).json({ msg: 'Upload failed', error: err.message });
  }
});


// Delete a restaurant
router.delete('/:id', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (restaurant && restaurant.image) {
      const imgPath = path.join(__dirname, '../uploads/', restaurant.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await Restaurant.findByIdAndDelete(req.params.id);

    // 🧹 Purge ALL caches to ensure total consistency
    cache.purgeAll();

    res.json({ msg: 'Restaurant deleted' });
  } catch (err) {
    res.status(400).json({ msg: 'Error deleting restaurant', error: err.message });
  }
});

module.exports = router; 