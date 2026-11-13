const multer = require("multer");

function parsePositiveInt(envValue, fallback) {
  const parsed = Number.parseInt(envValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const UPLOAD_LIMITS = {
  documentFileSizeBytes: parsePositiveInt(
    process.env.UPLOAD_DOC_MAX_FILE_SIZE_BYTES,
    5 * 1024 * 1024
  ),
  documentMaxFiles: parsePositiveInt(process.env.UPLOAD_DOC_MAX_FILES, 4),
  productImageFileSizeBytes: parsePositiveInt(
    process.env.UPLOAD_PRODUCT_MAX_FILE_SIZE_BYTES,
    3 * 1024 * 1024
  ),
  productImageMaxFiles: parsePositiveInt(
    process.env.UPLOAD_PRODUCT_MAX_FILES,
    1
  ),
  maxFields: parsePositiveInt(process.env.UPLOAD_MAX_FIELDS, 60),
  maxFieldSizeBytes: parsePositiveInt(
    process.env.UPLOAD_MAX_FIELD_SIZE_BYTES,
    100 * 1024
  ),
};

UPLOAD_LIMITS.documentMaxParts = parsePositiveInt(
  process.env.UPLOAD_DOC_MAX_PARTS,
  UPLOAD_LIMITS.maxFields + UPLOAD_LIMITS.documentMaxFiles
);
UPLOAD_LIMITS.productImageMaxParts = parsePositiveInt(
  process.env.UPLOAD_PRODUCT_MAX_PARTS,
  UPLOAD_LIMITS.maxFields + UPLOAD_LIMITS.productImageMaxFiles
);

const storage = multer.memoryStorage();

/**
 * Create a memory-backed Multer instance with hardened size, count, field, and part limits.
 */
function createUpload({ fileSize, files, parts }) {
  return multer({
    storage,
    limits: {
      fileSize,
      files,
      fields: UPLOAD_LIMITS.maxFields,
      fieldSize: UPLOAD_LIMITS.maxFieldSizeBytes,
      parts,
    },
  });
}

const documentUpload = createUpload({
  fileSize: UPLOAD_LIMITS.documentFileSizeBytes,
  files: UPLOAD_LIMITS.documentMaxFiles,
  parts: UPLOAD_LIMITS.documentMaxParts,
});

const productImageUpload = createUpload({
  fileSize: UPLOAD_LIMITS.productImageFileSizeBytes,
  files: UPLOAD_LIMITS.productImageMaxFiles,
  parts: UPLOAD_LIMITS.productImageMaxParts,
});

module.exports = {
  UPLOAD_LIMITS,
  createUpload,
  documentUpload,
  productImageUpload,
};
