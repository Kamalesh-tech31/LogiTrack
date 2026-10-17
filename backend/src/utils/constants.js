const VALID_STATUSES = ['Pending', 'Out for Delivery', 'Delivered', 'Failed Attempt', 'Returned'];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];

const ERROR_MESSAGES = {
  INVALID_STATUS: 'Please provide a valid delivery status.',
  MISSING_DELIVERY_ID: 'Delivery ID is required.',
  MISSING_LOCATION_DETAILS: 'Missing location details.',
  DELIVERY_NOT_FOUND: 'Delivery not found.',
  NO_LOCATION_UPDATE: 'No location update found.',
  INTERNAL_ERROR: 'Internal server error',
};

module.exports = {
  VALID_STATUSES,
  PRIORITY_LEVELS,
  ERROR_MESSAGES,
};
