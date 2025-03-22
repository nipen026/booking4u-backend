const User = require('../models/User');
const Booking = require('../models/Booking');
const Box = require('../models/Box');

// ➤ Dashboard Overview
exports.getDashboardData = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalBookings = await Booking.count();
        const totalBoxes = await Box.count();

        res.status(200).json({
            totalUsers,
            totalBookings,
            totalBoxes
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
};

// ➤ Manage Users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await User.destroy({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
};

// ➤ Manage Bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.findAll({ include: [Box, User] });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings.' });
    }
};

// ➤ Manage Boxes
exports.getAllBoxes = async (req, res) => {
    try {
        const boxes = await Box.findAll();
        res.json(boxes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch boxes.' });
    }
};

exports.deleteBox = async (req, res) => {
    const { id } = req.params;
    try {
        await Box.destroy({ where: { id } });
        res.json({ message: 'Box deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete box.' });
    }
};
