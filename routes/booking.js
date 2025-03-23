const express = require('express');
const {
    addBooking,
    getAllBookings,
    getBookingById,
    updateBooking,
    cancelBooking,
    getConfirmedBookings,
    getAllBookingsForAdmin
} = require('../controllers/bookingController');
const { verifyToken, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// ➕ Add Booking
router.post('/addBooking', verifyToken, addBooking);

// ❌ Cancel Booking (With Email Notification)
router.patch('/cancel', verifyToken, cancelBooking);

// 📋 Get All Bookings
router.get('/', verifyToken, getAllBookings);

// 🔎 Get Booking by ID
router.get('/bookingId/:id', verifyToken, getBookingById);
router.get('/confirmBooking', verifyToken, getConfirmedBookings);
router.get('/getAllBookingsForAdmin', verifyToken,adminOnly, getAllBookingsForAdmin);

// ✏️ Update Booking (Admin Only)
router.patch('/:id', verifyToken, adminOnly, updateBooking);

module.exports = router;
