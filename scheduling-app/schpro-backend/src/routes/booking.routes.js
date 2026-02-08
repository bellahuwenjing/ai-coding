const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', bookingController.getAll);
router.post('/', bookingController.create);
router.get('/:id', bookingController.getOne);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.softDelete);

// Restore deleted booking (admin only for now)
router.post('/:id/restore', bookingController.restore);

module.exports = router;
