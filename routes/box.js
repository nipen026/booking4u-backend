const express = require('express');
const { 
    addBox, 
    getAllBoxes, 
    updateBox, 
    deleteBox, 
    getBoxesByUserId,
    getBoxById,
    getFilteredBoxes
} = require('../controllers/boxController');
const upload = require('../middlewares/imageUpload');
const { verifyToken, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// ➕ Add Box (Admin Only)
router.post('/add', verifyToken, adminOnly, upload.array('images', 5), addBox);

// 📋 Get All Boxes
router.get('/get', getAllBoxes);

// 🔎 Get Box by ID
router.get('/getByUser', verifyToken , getBoxesByUserId);
router.get('/getBoxById/:id' , getBoxById);
router.get('/filter', getFilteredBoxes);
// ✏️ Update Box (Admin Only)
router.patch('/update/:id', verifyToken, adminOnly, upload.array('images', 5), updateBox);

// ❌ Delete Box (Admin Only)
router.delete('/delete/:id', verifyToken, adminOnly, deleteBox);

module.exports = router;
