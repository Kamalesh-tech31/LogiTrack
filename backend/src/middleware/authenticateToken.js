const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Attach full user object (without password) to req.user
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded should contain { id: user._id } per authController
    const userId = decoded?.id || decoded?._id || decoded?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    if (user.isActive === false) {
      return res.status(401).json({ message: "Account has been deleted" });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid token",
    });
  }
};

module.exports = authenticateToken;
