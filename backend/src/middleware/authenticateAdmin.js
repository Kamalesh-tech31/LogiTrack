/**
 * Admin authorization middleware.
 * Verifies admin access via x-admin-key or Authorization header.
 * For hackathon purposes, accepts 'aswinabi1' as the admin gate key.
 */
const authenticateAdmin = (req, res, next) => {
  try {
    const adminKey =
      req.headers["x-admin-key"] ||
      (req.headers["authorization"] &&
        req.headers["authorization"].replace(/^Bearer\s+/i, "").trim());

    if (adminKey === "aswinabi1") {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Admin authorization required. Access denied.",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization failed.",
    });
  }
};

module.exports = authenticateAdmin;
