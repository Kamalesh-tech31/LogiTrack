const MIN_MAGIC_BYTES_LENGTH = 12;

const DOCUMENT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const PRODUCT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const TYPE_LABELS = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "application/pdf": "PDF",
};

const DOCUMENT_FIELD_ALLOWED_TYPES = {
  aadhaar: DOCUMENT_ALLOWED_TYPES,
  drivingLicense: DOCUMENT_ALLOWED_TYPES,
  gstCertificate: DOCUMENT_ALLOWED_TYPES,
  shopLicense: DOCUMENT_ALLOWED_TYPES,
};

const PRODUCT_IMAGE_FIELD_ALLOWED_TYPES = {
  image: PRODUCT_IMAGE_ALLOWED_TYPES,
};

/**
 * Inspect leading file bytes to detect supported file types without trusting MIME or filename.
 */
function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < MIN_MAGIC_BYTES_LENGTH) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  // PDF: %PDF-
  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

function collectUploadedFiles(req) {
  const collected = [];
  if (req.file) {
    collected.push(req.file);
  }
  if (Array.isArray(req.files)) {
    collected.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    for (const fileList of Object.values(req.files)) {
      if (Array.isArray(fileList)) {
        collected.push(...fileList);
      }
    }
  }
  return collected;
}

function formatAllowedTypes(allowedTypes) {
  return allowedTypes.map((type) => TYPE_LABELS[type] || type).join(", ");
}

/**
 * Validate uploaded file buffers using magic bytes against per-field allowed file types.
 */
function validateUploadedFiles(fieldAllowedTypes) {
  return (req, res, next) => {
    const files = collectUploadedFiles(req);
    if (!files.length) {
      return next();
    }

    for (const file of files) {
      const allowedTypes = fieldAllowedTypes[file.fieldname];
      if (!allowedTypes) {
        return res.status(400).json({
          success: false,
          message: "Unexpected file field in upload.",
        });
      }

      if (!Buffer.isBuffer(file.buffer) || file.buffer.length < MIN_MAGIC_BYTES_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Uploaded file for '${file.fieldname}' is empty or invalid.`,
        });
      }

      const detectedType = detectFileType(file.buffer);
      if (!detectedType || !allowedTypes.includes(detectedType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file content for '${file.fieldname}'. Allowed formats: ${formatAllowedTypes(allowedTypes)}.`,
        });
      }

      file.detectedMimeType = detectedType;
    }

    return next();
  };
}

module.exports = {
  MIN_MAGIC_BYTES_LENGTH,
  DOCUMENT_ALLOWED_TYPES,
  PRODUCT_IMAGE_ALLOWED_TYPES,
  DOCUMENT_FIELD_ALLOWED_TYPES,
  PRODUCT_IMAGE_FIELD_ALLOWED_TYPES,
  detectFileType,
  validateUploadedFiles,
};
