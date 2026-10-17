const { ERROR_MESSAGES } = require("../utils/constants");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  /* =========================
     Mongoose Validation Error
  ========================= */
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  /* =========================
     Invalid MongoDB ObjectId
  ========================= */
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format",
    });
  }

  /* =========================
     Duplicate Key Error
  ========================= */
  if (err.message && err.message.toLowerCase().includes("duplicate key")) {
    return res.status(400).json({
      success: false,
      error: "Duplicate entry detected",
    });
  }

  /* =========================
     Default Server Error
  ========================= */
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error:
      err.message || ERROR_MESSAGES?.INTERNAL_ERROR || "Internal Server Error",

    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
