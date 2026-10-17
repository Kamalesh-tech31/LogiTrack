const LocationUpdate = require("../models/LocationUpdate");
const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const { ERROR_MESSAGES } = require("../utils/constants");

// Create location update
const createLocationUpdate = async (req, res, next) => {
  try {
    const payload = req.body;

    if (
      !payload.deliveryId ||
      payload.latitude === undefined ||
      payload.longitude === undefined ||
      !payload.displayName ||
      !payload.formattedAddress
    ) {
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.MISSING_LOCATION_DETAILS });
    }

    // Check if delivery exists in legacy Delivery collection
    let delivery = await Delivery.findOne({ id: payload.deliveryId });

    // If not found, check if it's a current Order _id
    if (!delivery) {
      const order = await Order.findById(payload.deliveryId);
      if (!order) {
        return res
          .status(404)
          .json({ error: ERROR_MESSAGES.DELIVERY_NOT_FOUND });
      }
    }

    // Create location update
    const locationUpdate = new LocationUpdate({
      deliveryId: payload.deliveryId,
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      source: payload.source || "manual",
      displayName: payload.displayName,
      formattedAddress: payload.formattedAddress,
      city: payload.city || "Unknown city",
      state: payload.state || "Unknown state",
      country: payload.country || "Unknown country",
      postalCode: payload.postalCode || "N/A",
      timestamp: payload.timestamp || new Date().toLocaleString(),
    });

    await locationUpdate.save();
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Get latest location update for delivery
const getLatestLocationUpdate = async (req, res, next) => {
  try {
    const { deliveryId } = req.query;

    if (!deliveryId) {
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.MISSING_DELIVERY_ID });
    }

    const latest = await LocationUpdate.findOne({ deliveryId })
      .sort({ _id: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({ error: ERROR_MESSAGES.NO_LOCATION_UPDATE });
    }

    res.json(latest);
  } catch (error) {
    next(error);
  }
};

// Get all location updates for a delivery
const getLocationUpdates = async (req, res, next) => {
  try {
    const { deliveryId } = req.query;

    if (!deliveryId) {
      return res
        .status(400)
        .json({ error: ERROR_MESSAGES.MISSING_DELIVERY_ID });
    }

    const updates = await LocationUpdate.find({ deliveryId })
      .sort({ _id: -1 })
      .lean();

    res.json(updates);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLocationUpdate,
  getLatestLocationUpdate,
  getLocationUpdates,
};
