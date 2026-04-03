const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Protect: verify JWT token ────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please log in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid token. Not authorized." });
  }
};

// ─── Authorize: restrict to specific roles ────────────────────────────────────
// Usage: authorize("admin") or authorize("admin", "analyst")
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: [${roles.join(", ")}]. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

// ─── Permission-based guard ───────────────────────────────────────────────────
// Usage: requirePermission("create:records")
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    const hasPermission = User.hasPermission(req.user.role, permission);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action: [${permission}]`,
      });
    }
    next();
  };
};
