const express = require('express');
const {
    getDashboardData,
    getAllUsers,
    deleteUser,
    getAllBookings,
    getAllBoxes,
    deleteBox
} = require('../controllers/adminController');
const { verifyToken, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔹 Dashboard Data
router.get('/dashboard', verifyToken, adminOnly, getDashboardData);

// 🔹 User Management
router.get('/users', verifyToken, adminOnly, getAllUsers);
router.delete('/users/:id', verifyToken, adminOnly, deleteUser);

// 🔹 Booking Management
router.get('/bookings', verifyToken, adminOnly, getAllBookings);

// 🔹 Box Management
router.get('/boxes', verifyToken, adminOnly, getAllBoxes);
router.delete('/boxes/:id', verifyToken, adminOnly, deleteBox);

module.exports = router;
