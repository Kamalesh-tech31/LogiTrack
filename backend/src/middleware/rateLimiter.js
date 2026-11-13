const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const jwt = require("jsonwebtoken");

/**
 * Standard 429 error response handler.
 * Identical across all routes and emails to prevent user enumeration.
 */
const rateLimitResponseHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  });
};

/**
 * Extracts and normalizes an email address from req.body if present and a string.
 */
function getNormalizedEmail(req) {
  if (typeof req.body?.email === "string") {
    return req.body.email.trim().toLowerCase();
  }
  return "";
}

/**
 * Global limiter:
 * Keys on a VERIFIED user id if a valid Bearer token is present in the Authorization header.
 * If signature verification fails, token is missing, or user id is not present, falls back to IP.
 * Skips GET /health.
 */
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.originalUrl === "/health",
  keyGenerator: (req) => {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded?.id || decoded?._id || decoded?.userId;
          if (userId) {
            return `user:${userId}`;
          }
        } catch {
          // Token signature invalid or expired - fall back to IP
        }
      }
    }
    return ipKeyGenerator(req.ip);
  },
  handler: rateLimitResponseHandler,
});

/**
 * Login limiters:
 * 1. IP limiter: 30 attempts per 15 minutes.
 * 2. IP + email limiter: 10 attempts per 15 minutes.
 * Both set skipSuccessfulRequests: true so legitimate sign-ins do not consume the quota.
 */
const loginIpLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_IP_MAX) || 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: rateLimitResponseHandler,
});

const loginAccountLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_ACCOUNT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = getNormalizedEmail(req);
    const clientIp = ipKeyGenerator(req.ip);
    return email ? `login:${clientIp}:${email}` : clientIp;
  },
  handler: rateLimitResponseHandler,
});

/**
 * Registration OTP request limiters:
 * 1. IP limiter: 10 per 15 minutes.
 * 2. Email limiter: 5 per 15 minutes.
 */
const requestOtpIpLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REQUEST_OTP_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REQUEST_OTP_IP_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: rateLimitResponseHandler,
});

const requestOtpEmailLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REQUEST_OTP_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REQUEST_OTP_EMAIL_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = getNormalizedEmail(req);
    return email ? `otp_req:${email}` : ipKeyGenerator(req.ip);
  },
  handler: rateLimitResponseHandler,
});

/**
 * Registration / Admin OTP verification limiters:
 * 1. IP limiter: 20 per 15 minutes.
 * 2. Email limiter: 10 per 15 minutes.
 */
const verifyOtpIpLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_VERIFY_OTP_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_VERIFY_OTP_IP_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: rateLimitResponseHandler,
});

const verifyOtpEmailLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_VERIFY_OTP_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_VERIFY_OTP_EMAIL_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = getNormalizedEmail(req);
    return email ? `otp_verify:${email}` : ipKeyGenerator(req.ip);
  },
  handler: rateLimitResponseHandler,
});

/**
 * Registration upload limiter:
 * 5 per hour per IP (protects heavy multipart upload routes before file handling).
 */
const registerUploadLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_REGISTER_UPLOADS_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_REGISTER_UPLOADS_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: rateLimitResponseHandler,
});

/**
 * Returns the verified user id from req.user (set by authenticateToken middleware).
 * Falls back to IP via ipKeyGenerator when req.user is not populated.
 */
function getVerifiedUserId(req) {
  return req.user?.id || req.user?._id?.toString() || ipKeyGenerator(req.ip);
}

/**
 * Account-sensitive limiter (password change, account delete):
 * 10 per 15 minutes, keyed by the authenticated user ID.
 * Runs after authenticateToken so req.user is always verified.
 */
const accountSensitiveLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_ACCOUNT_SENSITIVE_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ACCOUNT_SENSITIVE_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `acct:${getVerifiedUserId(req)}`,
  handler: rateLimitResponseHandler,
});

/**
 * Delivery OTP generation limiter:
 * 6 per 15 minutes, keyed by authenticated user ID + orderId.
 * Per-order isolation so a driver completing a batch of deliveries is not blocked.
 */
const deliveryOtpGenerateLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_DELIVERY_OTP_GEN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_DELIVERY_OTP_GEN_MAX) || 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `del_gen:${getVerifiedUserId(req)}:${req.params.orderId || "unknown"}`,
  handler: rateLimitResponseHandler,
});

/**
 * Delivery OTP verification limiter (wrong-code guessing protection):
 * 10 per 15 minutes, keyed by authenticated user ID + orderId.
 */
const deliveryOtpVerifyLimiter = rateLimit({
  windowMs:
    Number(process.env.RATE_LIMIT_DELIVERY_OTP_VERIFY_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_DELIVERY_OTP_VERIFY_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `del_verify:${getVerifiedUserId(req)}:${req.params.orderId || "unknown"}`,
  handler: rateLimitResponseHandler,
});

module.exports = {
  globalLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  requestOtpIpLimiter,
  requestOtpEmailLimiter,
  verifyOtpIpLimiter,
  verifyOtpEmailLimiter,
  registerUploadLimiter,
  accountSensitiveLimiter,
  deliveryOtpGenerateLimiter,
  deliveryOtpVerifyLimiter,
};
