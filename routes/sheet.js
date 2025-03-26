const express = require('express');
const path = require('path');

const { verifyToken, adminOnly } = require('../middlewares/authMiddleware');
const { exportBookingData, exportPaymentData } = require('../controllers/SheetController');

const router = express.Router();

// ➕ Add Slot (Admin Only)
router.post('/bookingsData', verifyToken,adminOnly,exportBookingData,express.static(path.join(__dirname, 'exports')) );
router.post('/paymentData', verifyToken,adminOnly,exportPaymentData,express.static(path.join(__dirname, 'exports')) );


module.exports = router;
