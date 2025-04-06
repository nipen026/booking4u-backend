const express = require('express');
const { 
    addSlot, 
    getAllSlots, 
    getSlotById, 
    updateSlot, 
    deleteSlot, 
    getSlotByBoxId,
    getPendingSlotsByDate
} = require('../controllers/slotController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// ➕ Add Slot (Admin Only)
router.post('/addSlot', verifyToken, addSlot);

// 📋 Get All Slots
router.get('/', getAllSlots);

// 🔎 Get Slot by ID
router.get('/:id',verifyToken, getSlotById);
router.get('/getSlots/:id/:date/:turfId', getSlotByBoxId);
router.get('/getPendingSlots/:boxId/:turfId/:date', getPendingSlotsByDate);

// ✏️ Update Slot (Admin Only)
router.patch('/update/:id', verifyToken, updateSlot);

// ❌ Delete Slot (Admin Only)
router.delete('/:id', verifyToken, deleteSlot);

module.exports = router;
