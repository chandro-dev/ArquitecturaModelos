const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { signAccessToken } = require("../utils/jwt");
const { generateDailyTasks, toggleStudyMission } = require("../services/task.service");

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
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      createdAt: user.createdAt,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const normalizedEmail = email.toLowerCase();
  
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  
  if (!user) {
    console.log(`[AUTH] User not found: ${normalizedEmail}`);
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    console.log(`[AUTH] Invalid password for: ${normalizedEmail}`);
    throw new AppError("Invalid credentials", 401);
  }

  // Generate tasks if missing or incomplete
  const hasDailyTasks = user.dailyTasks && user.dailyTasks.length > 0;
  const hasStudyMissions = user.studyMissions && user.studyMissions.length > 0;
  
  if (!hasDailyTasks || !hasStudyMissions) {
    console.log(`[TASKS] Generating/Fixing missions for: ${user.email}`);
    await generateDailyTasks(user._id);
    // Refresh user to get the new tasks in the response
    const updatedUser = await User.findById(user._id);
    Object.assign(user, updatedUser);
  }

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
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      dailyTasks: user.dailyTasks,
      studyMissions: user.studyMissions,
      createdAt: user.createdAt,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ 
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      isAdmin: user.isAdmin,
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      dailyTasks: user.dailyTasks,
      studyMissions: user.studyMissions
    }
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { preferredMode, theme } = req.validated.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (!user.preferences) {
    user.preferences = {
      preferredMode: 'text',
      theme: 'system'
    };
  }

  if (preferredMode) user.preferences.preferredMode = preferredMode;
  if (theme) user.preferences.theme = theme;

  user.markModified("preferences");
  await user.save();

  res.status(200).json({
    message: "Preferences updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      isAdmin: user.isAdmin,
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      dailyTasks: user.dailyTasks,
      studyMissions: user.studyMissions
    },
  });
});

const toggleMission = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const user = await toggleStudyMission(req.user._id, missionId);
  
  if (!user) throw new AppError("Mission not found", 404);

  res.status(200).json({
    message: "Mission status updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      isAdmin: user.isAdmin,
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      dailyTasks: user.dailyTasks,
      studyMissions: user.studyMissions
    }
  });
});

const refreshMissions = asyncHandler(async (req, res) => {
  await generateDailyTasks(req.user._id);
  const user = await User.findById(req.user._id);

  res.status(200).json({
    message: "Missions regenerated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      isAdmin: user.isAdmin,
      xp: user.xp,
      level: user.level,
      achievements: user.achievements,
      dailyTasks: user.dailyTasks,
      studyMissions: user.studyMissions
    }
  });
});

module.exports = {
  register,
  login,
  me,
  updatePreferences,
  toggleMission,
  refreshMissions
};
