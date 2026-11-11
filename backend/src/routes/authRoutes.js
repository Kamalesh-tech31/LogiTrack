const express = require("express");
const authenticateToken = require("../middleware/authenticateToken");
const upload = require("../config/multer");
const {
  loginIpLimiter,
  loginAccountLimiter,
  requestOtpIpLimiter,
  requestOtpEmailLimiter,
  verifyOtpIpLimiter,
  verifyOtpEmailLimiter,
  registerUploadLimiter,
  accountSensitiveLimiter,
} = require("../middleware/rateLimiter");

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
	registerUploadLimiter,
	upload.fields([
		{ name: "aadhaar", maxCount: 1 },
		{ name: "drivingLicense", maxCount: 1 },
		{ name: "gstCertificate", maxCount: 1 },
		{ name: "shopLicense", maxCount: 1 },
	]),
	register
  );
router.post(
	"/register/request-otp",
	requestOtpIpLimiter,
	requestOtpEmailLimiter,
	requestRegistrationOtp
);
router.post(
	"/register/verify-otp",
	verifyOtpIpLimiter,
	verifyOtpEmailLimiter,
	verifyRegistrationOtp
);
router.post("/login", loginIpLimiter, loginAccountLimiter, login);
router.get("/me", authenticateToken, getCurrentUser);
router.put("/me", authenticateToken, updateCurrentUser);
router.put(
	"/me/password",
	authenticateToken,
	accountSensitiveLimiter,
	updateCurrentPassword
);
router.delete("/account", authenticateToken, accountSensitiveLimiter, deleteAccount);

module.exports = router;
