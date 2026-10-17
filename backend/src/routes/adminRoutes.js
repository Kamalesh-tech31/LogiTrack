const express = require("express");
const authenticateAdmin = require("../middleware/authenticateAdmin");

const {
    getPendingUsers,
    getApprovedUsers,
    getRejectedUsers,
    approveUser,
    rejectUser,
    updateDocumentStatus,
    updateLocationStatus,
    getDashboardStats,
} = require("../controllers/adminController");

const router = express.Router();

// Protect all admin routes with admin authorization
router.use(authenticateAdmin);

router.get("/pending", getPendingUsers);

router.get("/approved", getApprovedUsers);

router.get("/rejected", getRejectedUsers);

router.patch("/approve/:id", approveUser);

router.patch("/reject/:id", rejectUser);

router.patch("/:id/document", updateDocumentStatus);

router.patch("/:id/location", updateLocationStatus);

router.get("/stats", getDashboardStats);

module.exports = router;