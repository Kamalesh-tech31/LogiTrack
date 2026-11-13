const crypto = require("crypto");
const cloudinary = require("../config/cloudinary");

/**
 * Upload an in-memory file buffer (via upload_stream) or a remote HTTP(S) URL to Cloudinary.
 */
const uploadBufferToCloudinary = (buffer, folderName) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        public_id: crypto.randomUUID(),
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result || !result.secure_url) {
          return reject(new Error("Cloudinary upload did not return a secure URL"));
        }
        return resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });

const uploadToCloudinary = async (source, folderName = "logitrack/products") => {
  const buffer = Buffer.isBuffer(source)
    ? source
    : source && Buffer.isBuffer(source.buffer)
      ? source.buffer
      : null;

  if (buffer) {
    return uploadBufferToCloudinary(buffer, folderName);
  }

  if (
    typeof source === "string" &&
    (source.startsWith("http://") || source.startsWith("https://"))
  ) {
    const result = await cloudinary.uploader.upload(source, {
      folder: folderName,
      public_id: crypto.randomUUID(),
      resource_type: "auto",
    });
    return result.secure_url;
  }

  throw new Error("Invalid upload source: expected file buffer or HTTP(S) URL");
};

module.exports = uploadToCloudinary;
