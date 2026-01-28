const express = require('express');
const router = express.Router();
const jobController = require('../controller/jobController');

// Routes mapping
router.post('/', jobController.createJob);
router.get('/', jobController.getJobs);
router.delete('/:id', jobController.deleteJob);

module.exports = router;