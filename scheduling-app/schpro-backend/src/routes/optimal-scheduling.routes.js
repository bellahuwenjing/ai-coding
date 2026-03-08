const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { scheduleOptimal } = require('../controllers/optimal-scheduling.controller');

// POST /api/ai/schedule-optimal
router.post('/schedule-optimal', verifyToken, scheduleOptimal);

module.exports = router;
