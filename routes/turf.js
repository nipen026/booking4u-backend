const express = require('express');
const router = express.Router();
const turfController = require('../controllers/turfController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/add', verifyToken, turfController.addTurf);
router.get('/all', turfController.getAllTurfs);
router.get('/:id', turfController.getTurfById);
router.put('/:id', verifyToken, turfController.updateTurf);
router.delete('/:id', verifyToken, turfController.deleteTurf);

module.exports = router;
