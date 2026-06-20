const User = require("../models/User");
const nodemailer = require("nodemailer");



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

        const allReviewed = docs.every(
            (doc) => doc.status === "approved" || doc.status === "rejected"
        );

        if (!allReviewed) {
            return res.status(400).json({
                message: "Review all documents before approving the user",
            });
        }

        user.status = "approved";

        await user.save();

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        await transporter.sendMail({
            from: "LogiTrack <logitrack862@gmail.com>",
            to: user.email,
            subject: "LogiTrack Account Approved",
            html: `
                <div style="font-family: Arial, sans-serif; background:#0b0b0b; color:#ffffff; padding:32px;">
                    <div style="max-width:560px; margin:0 auto; background:#111111; border:1px solid #27272a; border-radius:24px; padding:32px;">
                        <h1 style="margin:0 0 16px; font-size:32px;">
                            Logi<span style="color:#7F1D1D;">Track</span>
                        </h1>
        
                        <h2 style="color:#22c55e;">
                            Account Approved ✅
                        </h2>
        
                        <p>
                            Dear ${user.fullName},
                        </p>
        
                        <p>
                            Your LogiTrack account has been verified and approved by the administrator.
                        </p>
        
                        <p>
                            You can now log in and access your dashboard.
                        </p>
        
                        <br>
        
                        <p>
                            Regards,<br>
                            LogiTrack Team
                        </p>
                    </div>
                </div>
            `,
        });

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



        await transporter.sendMail({
            from: "LogiTrack <logitrack862@gmail.com>",
            to: user.email,
            subject: "LogiTrack Account Rejected",
            html: `
            <div style="font-family: Arial, sans-serif; background:#0b0b0b; color:#ffffff; padding:32px;">
                <div style="max-width:560px; margin:0 auto; background:#111111; border:1px solid #27272a; border-radius:24px; padding:32px;">
            
                    <h1 style="margin:0 0 16px; font-size:32px;">
                        Logi<span style="color:#7F1D1D;">Track</span>
                    </h1>
            
                    <h2 style="color:#ef4444;">
                        Account Rejected ❌
                    </h2>
            
                    <p>Dear ${user.fullName},</p>
            
                    <p>
                        Your registration request has been rejected by the administrator.
                    </p>
            
                    <hr>
            
                    <h3>Document Verification Status</h3>
            
                    ${user.documents.gstCertificate.path
                    ?
                    `
                        <p>
                            <b>GST Certificate</b><br>
                            Status : ${user.documents.gstCertificate.status}<br>
                            ${user.documents.gstCertificate.status === "rejected"
                        ? `Reason : ${user.documents.gstCertificate.rejectionReason}`
                        : ""
                    }
                        </p>
                        `
                    : ""
                }
            
                    ${user.documents.shopLicense.path
                    ?
                    `
                        <p>
                            <b>Shop License</b><br>
                            Status : ${user.documents.shopLicense.status}<br>
                            ${user.documents.shopLicense.status === "rejected"
                        ? `Reason : ${user.documents.shopLicense.rejectionReason}`
                        : ""
                    }
                        </p>
                        `
                    : ""
                }
            
                    ${user.documents.aadhaar.path
                    ?
                    `
                        <p>
                            <b>Aadhaar Card</b><br>
                            Status : ${user.documents.aadhaar.status}<br>
                            ${user.documents.aadhaar.status === "rejected"
                        ? `Reason : ${user.documents.aadhaar.rejectionReason}`
                        : ""
                    }
                        </p>
                        `
                    : ""
                }
            
                    ${user.documents.drivingLicense.path
                    ?
                    `
                        <p>
                            <b>Driving License</b><br>
                            Status : ${user.documents.drivingLicense.status}<br>
                            ${user.documents.drivingLicense.status === "rejected"
                        ? `Reason : ${user.documents.drivingLicense.rejectionReason}`
                        : ""
                    }
                        </p>
                        `
                    : ""
                }
            
                    <hr>
            
                    <h3 style="color:#ef4444;">
                        Main Rejection Reason
                    </h3>
            
                    <p>
                        ${user.applicationRejectionReason}
                    </p>
            
                    <br>
            
                    <p>
                        Please review the rejected documents and register again with corrected information.
                    </p>
            
                    <br>
            
                    <p>
                        Regards,<br>
                        LogiTrack Team
                    </p>
            
                </div>
            </div>
            `,
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
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

module.exports = {
    getPendingUsers,
    getApprovedUsers,
    getRejectedUsers,
    approveUser,
    rejectUser,
    updateDocumentStatus,
    getDashboardStats,
};