// Placeholder auth middleware: structural JWT verification and role-based guard
// Real implementation should verify tokens with `jsonwebtoken` and fetch user from DB

exports.protect = (req, res, next) => {
  // Expect header Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (!auth) {
    // For now allow through but mark as anonymous; in production block access
    req.user = null;
    return next();
  }

  const parts = auth.split(' ');
  if (parts.length !== 2) {
    req.user = null;
    return next();
  }

  const token = parts[1];
  // Placeholder decode: do not trust in production
  try {
    // If you add jsonwebtoken, replace this with jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: null, tokenProvided: true };
  } catch (err) {
    req.user = null;
  }
  return next();
};

// role-based guard: pass array of allowed roles
exports.authorize = (roles = []) => (req, res, next) => {
  if (!roles || roles.length === 0) return next();
  const user = req.user;
  if (!user) return res.status(403).json({ success: false, message: 'Unauthorized' });
  // real implementation should check user.role
  if (roles.includes(user.role)) return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
};
