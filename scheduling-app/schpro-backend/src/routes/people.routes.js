const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const peopleController = require('../controllers/people.controller');

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', peopleController.getAll);
router.post('/', peopleController.create);
router.get('/:id', peopleController.getOne);
router.put('/:id', peopleController.update);
router.delete('/:id', peopleController.softDelete);

// Restore deleted person (admin only for now)
router.post('/:id/restore', peopleController.restore);

module.exports = router;
