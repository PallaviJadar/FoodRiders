const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userAuth = async function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ msg: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ msg: 'Account blocked' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const adminAuth = function (req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
  }
};

// Hybrid Export: Function (default) + Properties (named)
userAuth.userAuth = userAuth; // Alias for destructuring { userAuth }
userAuth.adminAuth = adminAuth; // Named export for { adminAuth }

module.exports = userAuth; 