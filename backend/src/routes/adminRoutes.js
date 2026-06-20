const express = require("express");

const {
    getPendingUsers,
    getApprovedUsers,
    getRejectedUsers,
    approveUser,
    rejectUser,
    updateDocumentStatus,
    getDashboardStats,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/pending", getPendingUsers);

router.get("/approved", getApprovedUsers);

router.get("/rejected", getRejectedUsers);

router.patch("/approve/:id", approveUser);

router.patch("/reject/:id", rejectUser);

router.patch("/:id/document", updateDocumentStatus);

router.get("/stats", getDashboardStats);

module.exports = router;