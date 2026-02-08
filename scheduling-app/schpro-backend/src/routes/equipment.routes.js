const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const equipmentController = require('../controllers/equipment.controller');

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', equipmentController.getAll);
router.post('/', equipmentController.create);
router.get('/:id', equipmentController.getOne);
router.put('/:id', equipmentController.update);
router.delete('/:id', equipmentController.softDelete);

// Restore deleted equipment (admin only for now)
router.post('/:id/restore', equipmentController.restore);

module.exports = router;
