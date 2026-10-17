const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const upload = require("../config/multer");

const {
	register,
	login,
	deleteAccount,
	requestRegistrationOtp,
	verifyRegistrationOtp,
	getCurrentUser,
	updateCurrentUser,
	updateCurrentPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post(
	"/register",
	upload.fields([
		{ name: "aadhaar", maxCount: 1 },
		{ name: "drivingLicense", maxCount: 1 },
		{ name: "gstCertificate", maxCount: 1 },
		{ name: "shopLicense", maxCount: 1 },
	]),
	register
  );
router.post("/register/request-otp", requestRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/login", login);
router.get("/me", authenticateToken, getCurrentUser);
router.put("/me", authenticateToken, updateCurrentUser);
router.put("/me/password", authenticateToken, updateCurrentPassword);
router.delete("/account", authenticateToken, deleteAccount);

module.exports = router;
