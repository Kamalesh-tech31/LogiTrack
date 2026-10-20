const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Admin authorization middleware.
 * Verifies admin access via Authorization Bearer token (JWT).
 * Requires valid signature, active approved user in database, and role === "Admin".
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authorization token required. Access denied.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id || decoded?._id || decoded?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Account has been deleted.",
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin access required.",
      });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin account is not approved.",
      });
    }

    req.user = user;
    req.user.id = user._id.toString();

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization failed or token expired.",
    });
  }
};

module.exports = authenticateAdmin;
