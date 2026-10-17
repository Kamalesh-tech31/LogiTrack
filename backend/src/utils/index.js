const mongoose = require('mongoose');

exports.isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Simple async wrapper — controllers already use try/catch but exported for future use
exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
