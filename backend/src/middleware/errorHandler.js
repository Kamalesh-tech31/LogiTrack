const multer = require("multer");
const { ERROR_MESSAGES } = require("../utils/constants");

const MULTER_BAD_REQUEST_MESSAGES = {
  LIMIT_FILE_COUNT: "Too many files uploaded.",
  LIMIT_UNEXPECTED_FILE: "Unexpected file field in upload.",
  LIMIT_PART_COUNT: "Too many multipart parts in request.",
  LIMIT_FIELD_COUNT: "Too many form fields in request.",
  LIMIT_FIELD_KEY: "Form field name is too long.",
  LIMIT_FIELD_VALUE: "Form field value exceeds maximum allowed size.",
  LIMIT_FIELD_NESTING: "Form field nesting is too deep.",
};

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  /* =========================
     Multer Upload Errors
  ========================= */
  if (err instanceof multer.MulterError || err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Uploaded file exceeds the maximum allowed size.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        MULTER_BAD_REQUEST_MESSAGES[err.code] || "Invalid file upload request.",
    });
  }

  /* =========================
     Body Parser Limits & JSON
  ========================= */
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body exceeds the maximum allowed size.",
    });
  }

  if (
    err.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err.status === 400 && "body" in err)
  ) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON in request body.",
    });
  }

  /* =========================
     Mongoose Validation Error
  ========================= */
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  /* =========================
     Invalid MongoDB ObjectId
  ========================= */
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  /* =========================
     Duplicate Key Error
  ========================= */
  if (err.message && err.message.toLowerCase().includes("duplicate key")) {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry detected",
    });
  }

  /* =========================
     Default Server Error
  ========================= */
  const statusCode = err.status || err.statusCode || 500;
  const safeMessage =
    statusCode >= 500
      ? ERROR_MESSAGES?.INTERNAL_ERROR || "Internal Server Error"
      : err.message || "Request failed";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};

module.exports = errorHandler;
