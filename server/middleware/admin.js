module.exports = function (req, res, next) {
    // Requires 'auth' middleware to run first
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
    }
};
