const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Interview = require("../models/Interview");
const Role = require("../models/Role");

/**
 * Obtener estadísticas globales de la plataforma
 */
const getGlobalStats = asyncHandler(async (req, res) => {
  const [userCount, interviewCount, roleCount, averageScores] = await Promise.all([
    User.countDocuments(),
    Interview.countDocuments(),
    Role.countDocuments(),
    Interview.aggregate([
      { $match: { status: "completed", feedback: { $ne: null } } },
      {
        $group: {
          _id: null,
          avgTechnical: { $avg: "$feedback.technicalScore" },
          avgSoftSkills: { $avg: "$feedback.softSkillsScore" },
          avgOverall: { $avg: "$feedback.overallScore" },
        },
      },
    ]),
  ]);

  res.status(200).json({
    users: userCount,
    interviews: interviewCount,
    roles: roleCount,
    averages: averageScores[0] || { avgTechnical: 0, avgSoftSkills: 0, avgOverall: 0 },
  });
});

/**
 * Listar todos los usuarios
 */
const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.status(200).json({
    items: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * Listar todas las entrevistas (global)
 */
const listAllInterviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [interviews, total] = await Promise.all([
    Interview.find()
      .populate("userId", "name email")
      .populate("roleId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Interview.countDocuments(),
  ]);

  res.status(200).json({
    items: interviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

module.exports = {
  getGlobalStats,
  listUsers,
  listAllInterviews,
};
