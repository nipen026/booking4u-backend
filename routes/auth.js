const express = require('express');
const { createSuperuser, superuserLogin, registerAdmin, loginAdmin } = require('../controllers/authController');
const {  superuserOnly } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/registeradmin',superuserOnly, registerAdmin);
router.post('/createSuperuser',createSuperuser );
router.post('/superuserlogin',superuserLogin );
router.post('/adminlogin', loginAdmin);

module.exports = router;
 