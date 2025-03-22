const express = require('express');
const { 
    register, 
    login, 
    getAllUsers, 
    updateUser, 
    deleteUser, 
    adminRegister,
    getUserProfile
} = require('../controllers/userController');
const { verifyToken, superuserOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// Auth Routes
router.post('/register', register);
router.post('/login', login);

// Admin/Superuser Routes
router.get('/', verifyToken, getAllUsers);
router.get('/profile', verifyToken, getUserProfile);
router.patch('/update/:id', verifyToken, updateUser);
router.delete('/:id', verifyToken, superuserOnly, deleteUser);

module.exports = router;
