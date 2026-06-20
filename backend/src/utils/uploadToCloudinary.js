const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const uploadToCloudinary = async (filePath, folderName) => {
    try {

        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName,
        });

        // delete local file
        fs.unlinkSync(filePath);

        return result.secure_url;

    } catch (error) {

        // delete local file even if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        throw error;
    }
};

module.exports = uploadToCloudinary;