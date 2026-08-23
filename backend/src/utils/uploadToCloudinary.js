const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadToCloudinary = async (filePathOrUrl, folderName = "logitrack/products") => {
    try {
        const result = await cloudinary.uploader.upload(filePathOrUrl, {
            folder: folderName,
            resource_type: "auto",
        });

        // delete local file if it exists on disk
        if (typeof filePathOrUrl === "string" && fs.existsSync(filePathOrUrl)) {
            try {
                fs.unlinkSync(filePathOrUrl);
            } catch (err) {
                console.warn("Could not remove temp file:", err.message);
            }
        }

        return result.secure_url;
    } catch (error) {
        // delete local file even if upload fails
        if (typeof filePathOrUrl === "string" && fs.existsSync(filePathOrUrl)) {
            try {
                fs.unlinkSync(filePathOrUrl);
            } catch (err) {
                console.warn("Could not remove temp file after failure:", err.message);
            }
        }

        throw error;
    }
};

module.exports = uploadToCloudinary;