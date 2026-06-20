const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Attach full user object (without password) to req.user
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    console.log("ALL HEADERS:");
    console.log(req.headers);

    console.log("AUTH HEADER:");
    console.log(authHeader);
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    console.log("TOKEN RECEIVED:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("DECODED:", decoded);

    // decoded should contain { id: user._id } per authController
    const userId = decoded?.id || decoded?._id || decoded?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    console.log("USER ID:", userId);

    const user = await User.findById(userId);

    console.log("USER FOUND:", user);

    console.log("MONGOOSE CONNECTION STATE:", require("mongoose").connection.readyState);

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
    console.log("FULL ERROR:");
    console.log(error);

    return res.status(403).json({
      message: "Invalid token",
    });
  }
};

module.exports = authenticateToken;
