const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const vehiclesController = require('../controllers/vehicles.controller');

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', vehiclesController.getAll);
router.post('/', vehiclesController.create);
router.get('/:id', vehiclesController.getOne);
router.put('/:id', vehiclesController.update);
router.delete('/:id', vehiclesController.softDelete);

// Restore deleted vehicle (admin only for now)
router.post('/:id/restore', vehiclesController.restore);

module.exports = router;
