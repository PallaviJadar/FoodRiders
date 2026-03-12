const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth'); // Assuming admin authentication for adding/editing
const multer = require('multer');
const path = require('path');

// Multer setup for menu item image upload using memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add a menu item to a specific restaurant (Admin only)
router.post('/:restaurantId', auth, upload.single('image'), async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  const { name, description, price, category, sizeOptions } = req.body;
  const restaurant = req.params.restaurantId;

  let image = req.body.image; // Case where image is already a string (e.g. Base64 from frontend)

  if (req.file) {
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    image = `data:${mimeType};base64,${base64Image}`;
  }

  let parsedSizeOptions;
  if (sizeOptions) {
    try {
      parsedSizeOptions = JSON.parse(sizeOptions);
    } catch (e) {
      console.error('Invalid sizeOptions format:', e);
      return res.status(400).json({ msg: 'Invalid sizeOptions format' });
    }
  }

  try {
    const menuItem = new MenuItem({
      restaurant,
      name,
      description,
      price,
      image,
      category,
      sizeOptions: parsedSizeOptions
    });
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (err) {
    console.error('Error adding menu item:', err);
    res.status(400).json({ msg: 'Error adding menu item', error: err.message });
  }
});

// Update a menu item (Admin only)
router.put('/:menuItemId', auth, upload.single('image'), async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  const { name, description, price, category, sizeOptions } = req.body;

  let updateData = { name, description, price, category };

  if (req.file) {
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    updateData.image = `data:${mimeType};base64,${base64Image}`;
  }

  if (sizeOptions) {
    try {
      updateData.sizeOptions = JSON.parse(sizeOptions);
    } catch (e) {
      console.error('Invalid sizeOptions format:', e);
      return res.status(400).json({ msg: 'Invalid sizeOptions format' });
    }
  }

  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.menuItemId, updateData, { new: true });
    if (!menuItem) return res.status(404).json({ msg: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    console.error('Error updating menu item:', err);
    res.status(400).json({ msg: 'Error updating menu item', error: err.message });
  }
});


// Get all menu items for a specific restaurant (Publicly accessible)
router.get('/:restaurantId', async (req, res) => {
  const restaurant = req.params.restaurantId;
  try {
    let menuItems = await MenuItem.find({ restaurant }).sort('category').sort('name').lean();

    // Backward compatibility for old image paths
    menuItems = menuItems.map(item => {
      if (item.image && !item.image.startsWith('data:')) {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        // If it's a legacy relative path, prepend base URL
        if (item.image.startsWith('/uploads')) {
          item.image = `${baseUrl}${item.image}`;
        } else if (!item.image.startsWith('http')) {
          item.image = `${baseUrl}/uploads/menu_items/${item.image}`;
        }
      }
      return item;
    });

    res.json(menuItems);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ msg: 'Server error fetching menu items' });
  }
});


// Delete a menu item (Admin only)
router.delete('/:menuItemId', auth, async (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.menuItemId);
    if (!menuItem) return res.status(404).json({ msg: 'Menu item not found' });
    res.json({ msg: 'Menu item deleted' });
  } catch (err) {
    console.error('Error deleting menu item:', err);
    res.status(500).json({ msg: 'Server error deleting menu item' });
  }
});

// Add routes for editing menu items later if needed

module.exports = router; 