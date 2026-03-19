const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/jwt");

const auth = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Missing authorization token", 401));
  }

  const token = header.split(" ")[1];
  if (!token) return next(new AppError("Invalid authorization token", 401));

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-password");
    if (!user) return next(new AppError("User not found", 401));

    req.user = user;
    return next();
  } catch (_error) {
    return next(new AppError("Unauthorized", 401));
  }
};

const requireAdmin = (req, _res, next) => {
  if (!req.user?.isAdmin) return next(new AppError("Admin access required", 403));
  return next();
};

module.exports = {
  auth,
  requireAdmin,
};
