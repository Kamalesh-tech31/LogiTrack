const User = require("../models/User");
const nodemailer = require("nodemailer");
const {
    buildAccountApprovedEmail,
    buildAccountRejectedEmail,
} = require("../utils/emailTemplate");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
});





const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({
            status: "approved",
            isActive: true,
        });

        const pendingUsers = await User.countDocuments({
            role: { $in: ["Business Owner", "Delivery Agent"] },
            status: "pending",
            isActive: true,
        });

        const approvedUsers = await User.countDocuments({
            status: "approved",
            isActive: true,
        });

        const rejectedUsers = await User.countDocuments({
            status: "rejected",
            isActive: true,
        });

        res.status(200).json({
            totalUsers,
            pendingUsers,
            approvedUsers,
            rejectedUsers,
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to load dashboard stats",
        });
    }
};
// GET all pending users
const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ["Business Owner", "Delivery Agent"] },
            status: "pending",
            isActive: true,
        })
            .select("-password")
        .lean();
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch pending users",
        });
    }
};

// GET all approved users
const getApprovedUsers = async (req, res) => {
    try {
        const users = await User.find({
            status: "approved",
            isActive: true,
        })
            .select("-password")
        .lean();

        res.status(200).json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch approved users",
        });
    }
};

// GET all rejected users
const getRejectedUsers = async (req, res) => {
    try {
        const users = await User.find({
            status: "rejected",
            isActive: true,
        })
            .select("-password")
        .lean();

        res.status(200).json(users);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch rejected users",
        });
    }
};

// APPROVE a user
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        let docs = [];

        if (user.role === "Business Owner") {
            docs = [
                user.documents.gstCertificate,
                user.documents.shopLicense,
            ];
        }
        else if (user.role === "Delivery Agent") {
            docs = [
                user.documents.aadhaar,
                user.documents.drivingLicense,
            ];
        }

        if (user.role === "Business Owner" && user.warehouseAddress && (user.warehouseAddress.latitude != null || user.warehouseAddress.fullAddress)) {
            if (user.warehouseAddress.status === "rejected") {
                return res.status(400).json({
                    message: "Cannot approve account: Business location has been rejected. Please resolve location first.",
                });
            }
            if (user.warehouseAddress.status === "pending") {
                return res.status(400).json({
                    message: "Please review and accept or reject the business location before approving the user.",
                });
            }
        }

        user.status = "approved";
        if (user.warehouseAddress && user.warehouseAddress.status === "approved") {
            user.warehouseAddress.isVerified = true;
        }

        await user.save();

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        try {
            await transporter.sendMail({
                from: "LogiTrack <logitrack862@gmail.com>",
                to: user.email,
                subject: "LogiTrack Account Approved",
                html: buildAccountApprovedEmail(user),
            });
        } catch (emailError) {
            console.warn("Approval notification email could not be sent:", emailError.message);
        }

        res.status(200).json({
            message: "User approved successfully",
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to approve user",
        });
    }
};

// REJECT a user
const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

       

        let docs = [];

        if (user.role === "Business Owner") {
            docs = [
                user.documents.gstCertificate,
                user.documents.shopLicense,
            ];
        }
        else if (user.role === "Delivery Agent") {
            docs = [
                user.documents.aadhaar,
                user.documents.drivingLicense,
            ];
        }

        // Every document must be reviewed first
        const allReviewed = docs.every(
            (doc) => doc.status === "approved" || doc.status === "rejected"
        );

        if (!allReviewed) {
            return res.status(400).json({
                message: "Review all documents before rejecting the user",
            });
        }


        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({
                message: "Rejection reason is required",
            });
        }

        user.status = "rejected";
        user.applicationRejectionReason = rejectionReason;

        await user.save();



        try {
            await transporter.sendMail({
                from: "LogiTrack <logitrack862@gmail.com>",
                to: user.email,
                subject: "LogiTrack Account Rejected",
                html: buildAccountRejectedEmail(user, rejectionReason),
            });
        } catch (emailError) {
            console.warn("Rejection notification email could not be sent:", emailError.message);
        }

        res.status(200).json({
            message: "User rejected successfully",
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to reject user",
        });
    }
};

// APPROVE / REJECT A SINGLE DOCUMENT
const updateDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentName, status, rejectionReason } = req.body;

        const allowedDocuments = [
            "aadhaar",
            "gstCertificate",
            "shopLicense",
            "drivingLicense",
        ];

        if (!allowedDocuments.includes(documentName)) {
            return res.status(400).json({
                message: "Invalid document name",
            });
        }

        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (!existingUser.documents[documentName].path) {
            return res.status(400).json({
                message: `${documentName} was not uploaded`,
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status",
            });
        }

        if (
            status === "rejected" &&
            (!rejectionReason || !rejectionReason.trim())
        ) {
            return res.status(400).json({
                message: "Rejection reason is required",
            });
        }

        const updateObject = {
            [`documents.${documentName}.status`]: status,
            [`documents.${documentName}.rejectionReason`]:
                status === "rejected"
                    ? rejectionReason || ""
                    : "",
        };

        const user = await User.findByIdAndUpdate(
            id,
            updateObject,
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            message: `${documentName} ${status}`,
            user,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update document",
        });
    }
};

// APPROVE / REJECT BUSINESS LOCATION INDEPENDENTLY
const updateLocationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be approved or rejected.",
            });
        }

        if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
            return res.status(400).json({
                message: "Rejection reason is required when rejecting a location",
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (!user.warehouseAddress || (!user.warehouseAddress.latitude && !user.warehouseAddress.fullAddress)) {
            return res.status(400).json({
                message: "User has no business location record to review",
            });
        }

        user.warehouseAddress.status = status;
        user.warehouseAddress.isVerified = (status === "approved");
        user.warehouseAddress.rejectionReason = status === "rejected" ? rejectionReason.trim() : "";
        user.warehouseAddress.verifiedAt = new Date();

        await user.save();

        res.status(200).json({
            message: `Business location marked as ${status}`,
            user,
        });
    } catch (error) {
        console.error("Location status update error:", error);
        res.status(500).json({
            message: "Failed to update location status",
        });
    }
};

module.exports = {
    getPendingUsers,
    getApprovedUsers,
    getRejectedUsers,
    approveUser,
    rejectUser,
    updateDocumentStatus,
    updateLocationStatus,
    getDashboardStats,
};