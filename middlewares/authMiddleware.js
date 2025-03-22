const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Access denied, token missing' });
    }

    try {
        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user exists in the database
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) {
            return res.status(403).json({ message: 'User not found, access denied' });
        }

        // Attach user data to `req.user`
        req.user = user;

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// 🔐 Superuser Only Access
exports.superuserOnly = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'superuser') {
            return res.status(403).json({ error: 'Unauthorized. Superuser access required.' });
        }

        req.user = decoded;  // Attach user details to request object
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
// 🔐 Admin Only Access
exports.adminOnly = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Decode the Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the Admin Exists in the Database
        const admin = await User.findOne({ where: { id: decoded.id, role: 'admin' } });

        if (!admin) {
            return res.status(403).json({ message: 'Admin not found or access denied.' });
        }

        req.user = admin; // Attach user details to the request
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
