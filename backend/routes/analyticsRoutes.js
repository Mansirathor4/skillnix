// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controller/analyticsController');

router.get('/dashboard-stats', getAnalytics);

module.exports = router;