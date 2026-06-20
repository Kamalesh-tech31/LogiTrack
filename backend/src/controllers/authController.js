const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/product");
const Delivery = require("../models/Delivery");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const {
  isGmailAddress,
  normalizeEmail,
  upsertOtpDocument,
  verifyOtpCode,
  completeRegistration: completeRegistrationFlow,
} = require("../services/registrationOtpService");

const PASSWORD_RULES = [
  {
    test: (p) => p.length >= 8,
    message: "Password must be at least 8 characters",
  },
  {
    test: (p) => /[A-Z]/.test(p),
    message: "Password must include an uppercase letter",
  },
  {
    test: (p) => /[a-z]/.test(p),
    message: "Password must include a lowercase letter",
  },
  { test: (p) => /\d/.test(p), message: "Password must include a number" },
  {
    test: (p) => /[!@#$%^&*]/.test(p),
    message: "Password must include a special character (!@#$%^&*)",
  },
];

function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return "Password is required";
  }

  const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failedRule ? failedRule.message : null;
}

const ALLOWED_ROLES = ["Business Owner", "Delivery Agent", "Customer"];

const normalizeUserResponse = (user) => {
  if (!user) {
    return null;
  }

  const payload = user.toObject ? user.toObject() : { ...user };
  delete payload.password;
  return payload;
};

function applyProfileUpdates(targetUser, payload) {
  const fields = [
    "fullName",
    "phone",
    "businessName",
    "gstNumber",
    "businessAddress",
  ];

  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      targetUser[field] = payload[field];
    }
  });
}

const DELETION_CONFIRMATION = "DELETE MY ACCOUNT";

async function markRelatedDeliveriesInactive(orderIds, reason) {
  if (!orderIds.length) {
    return;
  }

  await Delivery.updateMany(
    { order: { $in: orderIds } },
    {
      $set: {
        assignedAgent: null,
        status: "Returned",
        lastUpdated: reason,
      },
      $push: {
        tracking: {
          status: "Account deleted",
          message: reason,
          timestamp: new Date(),
        },
      },
    },
  ).catch(() => null);
}

async function cancelOpenOrders(filter, reason) {
  const openOrders = await Order.find({
    ...filter,
    status: { $nin: ["completed", "delivered"] },
  });

  if (!openOrders.length) {
    return [];
  }

  const cancelledAt = new Date();
  const orderIds = openOrders.map((order) => order._id);

  await Order.updateMany(
    { _id: { $in: orderIds } },
    {
      $set: {
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt,
        assignedAgent: null,
      },
    },
  );

  await markRelatedDeliveriesInactive(orderIds, reason);

  return openOrders;
}

async function softDeleteUser(user) {
  const deletedAt = new Date();
  const deletedEmail = `deleted-${user._id.toString()}@logitrack.local`;

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        isActive: false,
        deletedAt,
        email: deletedEmail,
      },
    },
  );
}

// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const {
      registrationToken,
      fullName,
      email,
      password,
      confirmPassword,
      role,
    } = req.body;

    const files = req.files || {};

    const aadhaarUrl = files.aadhaar?.[0]
      ? await uploadToCloudinary(files.aadhaar[0].path, "aadhaar")
      : "";

    const drivingLicenseUrl = files.drivingLicense?.[0]
      ? await uploadToCloudinary(files.drivingLicense[0].path, "driving-license")
      : "";

    const gstCertificateUrl = files.gstCertificate?.[0]
      ? await uploadToCloudinary(files.gstCertificate[0].path, "gst-certificate")
      : "";

    const shopLicenseUrl = files.shopLicense?.[0]
      ? await uploadToCloudinary(files.shopLicense[0].path, "shop-license")
      : "";

    const user = await completeRegistrationFlow({
      registrationToken,
      fullName,
      email,
      password,
      confirmPassword,
      role,
      passwordValidator: validatePassword,

      documents: {
        aadhaar: aadhaarUrl,
        drivingLicense: drivingLicenseUrl,
        gstCertificate: gstCertificateUrl,
        shopLicense: shopLicenseUrl,
    },
    });

    // CREATE TOKEN
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User Registered Successfully",
      token,
      user: normalizeUserResponse(user),
    });
  } catch (error) {
    console.log(error);

    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // FIND USER
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account has been deleted",
      });
    }

    if (user.role !== role) {
      return res.status(400).json({
        message: "Invalid role selected",
      });
    }

    if (user.status === "pending") {
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(403).json({
        message: "Your account is awaiting approval",
        status: "pending",
        token,
        user: normalizeUserResponse(user),
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Your account has been rejected",
        status: "rejected",
      });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Credentials",
      });
    }

    // TOKEN
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login Successful",
      token,
      user: normalizeUserResponse(user),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const requestRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isGmailAddress(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid Gmail address",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      isActive: { $ne: false },
    });

    if (existingUser) {

      if (existingUser.status === "pending") {
        return res.status(403).json({
          message: "Your account is awaiting approval",
          status: "pending",
        });
      }

      if (existingUser.status === "approved") {
        return res.status(400).json({
          message: "An account with this email already exists",
        });
      }

      if (existingUser.status === "rejected") {

        await User.deleteOne({
          _id: existingUser._id,
        });

      
    } 
  }

    
    const result = await upsertOtpDocument(normalizedEmail);

    res.status(200).json({
      message: "OTP sent to your Gmail address",
      email: result.email,
      resendAfterSeconds: result.resendAfterSeconds,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("requestRegistrationOtp error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to send OTP",
      ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
    });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isGmailAddress(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid Gmail address",
      });
    }

    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({
        message: "Enter the 6-digit OTP",
      });
    }

    const result = await verifyOtpCode(normalizedEmail, otp);

    return res.status(200).json({
      message: "Email verified successfully",
      email: result.email,
      registrationToken: result.registrationToken,
    });
  } catch (error) {
    console.error("verifyRegistrationOtp error:", error);
    return res.status(error.statusCode || 500).json({
      message: error.message || "Failed to verify OTP",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, confirmText } = req.body || {};

    if (!currentPassword || typeof currentPassword !== "string") {
      return res.status(400).json({
        message: "Current password is required",
      });
    }

    if (confirmText !== DELETION_CONFIRMATION) {
      return res.status(400).json({
        message: `Type ${DELETION_CONFIRMATION} to confirm account deletion`,
      });
    }

    const freshUser = await User.findById(user._id);
    if (!freshUser || freshUser.isActive === false) {
      return res
        .status(401)
        .json({ message: "Account has already been deleted" });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      freshUser.password,
    );
    if (!passwordMatches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const now = new Date();

    if (freshUser.role === "Business Owner") {
      await Product.updateMany(
        { ownerId: freshUser._id },
        {
          $set: {
            isActive: false,
            deletedAt: now,
          },
        },
      );

      await cancelOpenOrders(
        { ownerId: freshUser._id },
        "Business owner account deleted.",
      );
    }

    if (freshUser.role === "Customer") {
      await cancelOpenOrders(
        { customerId: freshUser._id },
        "Customer account deleted.",
      );
    }

    if (freshUser.role === "Delivery Agent") {
      await Order.updateMany(
        {
          assignedAgent: freshUser._id,
          status: { $nin: ["completed", "delivered", "cancelled"] },
        },
        {
          $set: {
            assignedAgent: null,
          },
        },
      );

      await Delivery.updateMany(
        { assignedAgent: freshUser._id },
        {
          $set: {
            assignedAgent: null,
            lastUpdated: "Delivery agent account deleted.",
          },
          $push: {
            tracking: {
              status: "Account deleted",
              message: "Delivery agent account deleted.",
              timestamp: now,
            },
          },
        },
      ).catch(() => null);
    }

    await softDeleteUser(freshUser);

    return res.status(200).json({
      message: `${freshUser.role} account deleted successfully`,
      role: freshUser.role,
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      success: true,
      data: normalizeUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id || req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    applyProfileUpdates(user, req.body || {});
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: normalizeUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCurrentPassword = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Current password, new password, and confirmation are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  deleteAccount,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentPassword,
};
