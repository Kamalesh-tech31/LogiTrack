const express = require('express');
const {
  createLocationUpdate,
  getLatestLocationUpdate,
  getLocationUpdates,
} = require('../controllers/locationController.js');

const router = express.Router();

// Create location update
router.post('/', createLocationUpdate);

// Get latest location update
router.get('/latest', getLatestLocationUpdate);

// Get all location updates for a delivery
router.get('/', getLocationUpdates);

module.exports = router;
