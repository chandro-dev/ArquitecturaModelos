const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { signAccessToken } = require("../utils/jwt");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  const user = await User.create({ name, email, password });
  const token = signAccessToken({ sub: user._id.toString(), email: user.email });

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid credentials", 401);

  const valid = await user.comparePassword(password);
  if (!valid) throw new AppError("Invalid credentials", 401);

  const token = signAccessToken({ sub: user._id.toString(), email: user.email });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { preferredMode, theme } = req.validated.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (preferredMode) user.preferences.preferredMode = preferredMode;
  if (theme) user.preferences.theme = theme;

  await user.save();
  res.status(200).json({
    message: "Preferences updated",
    preferences: user.preferences,
  });
});

module.exports = {
  register,
  login,
  me,
  updatePreferences,
};
