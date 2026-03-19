const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Prompt = require("../models/Prompt");
const Role = require("../models/Role");
const AppError = require("../utils/AppError");
const { generateInterviewReply, generateInterviewFeedback } = require("./ai.service");

const startInterview = async ({ userId, roleId, mode }) => {
  const [role, prompt] = await Promise.all([
    Role.findById(roleId),
    Prompt.findOne({ roleId }),
  ]);

  if (!role) throw new AppError("Role not found", 404);
  if (!prompt) throw new AppError("Prompt not found for this role", 404);

  const interview = await Interview.create({
    userId,
    roleId,
    mode: mode || "text",
    status: "in_progress",
    messages: [
      {
        sender: "ai",
        text: prompt.firstMessage,
        timestamp: new Date(),
      },
    ],
  });

  return Interview.findById(interview._id).populate("roleId", "title description tags difficulty");
};

const addUserMessageAndReply = async ({ interviewId, userId, text }) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).populate("roleId");
  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.status !== "in_progress") {
    throw new AppError("Interview is already completed", 400);
  }

  const prompt = await Prompt.findOne({ roleId: interview.roleId._id });
  if (!prompt) throw new AppError("Prompt not found for this role", 404);

  interview.messages.push({
    sender: "user",
    text,
    timestamp: new Date(),
  });

  const history = interview.messages.slice(-20).map((message) => ({
    sender: message.sender,
    text: message.text,
  }));

  const aiText = await generateInterviewReply({
    systemInstruction: prompt.systemInstruction,
    history,
    roleTitle: interview.roleId.title,
    difficulty: interview.roleId.difficulty,
  });

  interview.messages.push({
    sender: "ai",
    text: aiText,
    timestamp: new Date(),
  });

  await interview.save();

  return {
    interview,
    aiMessage: aiText,
  };
};

const completeInterview = async ({ interviewId, userId }) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).populate("roleId");
  if (!interview) throw new AppError("Interview not found", 404);

  if (interview.status === "completed" && interview.feedback) {
    return interview;
  }

  const prompt = await Prompt.findOne({ roleId: interview.roleId._id });
  if (!prompt) throw new AppError("Prompt not found for this role", 404);

  const history = interview.messages.map((message) => ({
    sender: message.sender,
    text: message.text,
  }));

  const feedback = await generateInterviewFeedback({
    systemInstruction: prompt.systemInstruction,
    history,
    roleTitle: interview.roleId.title,
    difficulty: interview.roleId.difficulty,
  });

  interview.feedback = feedback;
  interview.status = "completed";
  await interview.save();

  return interview;
};

const getInterviewById = async ({ interviewId, userId }) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).populate(
    "roleId",
    "title description tags difficulty"
  );
  if (!interview) throw new AppError("Interview not found", 404);
  return interview;
};

const listUserInterviews = async ({ userId, page = 1, limit = 10, status }) => {
  const filter = { userId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Interview.find(filter)
      .populate("roleId", "title tags difficulty")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Interview.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserProgress = async ({ userId }) => {
  const objectUserId = new mongoose.Types.ObjectId(userId);

  const [aggregated] = await Interview.aggregate([
    {
      $match: {
        userId: objectUserId,
        status: "completed",
        feedback: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalInterviews: { $sum: 1 },
        avgTechnicalScore: { $avg: "$feedback.technicalScore" },
        avgSoftSkillsScore: { $avg: "$feedback.softSkillsScore" },
        avgOverallScore: { $avg: "$feedback.overallScore" },
      },
    },
  ]);

  const recentCompleted = await Interview.find({
    userId,
    status: "completed",
    feedback: { $ne: null },
  })
    .populate("roleId", "title")
    .sort({ createdAt: -1 })
    .limit(6);

  return {
    summary: aggregated
      ? {
          totalInterviews: aggregated.totalInterviews,
          avgTechnicalScore: Math.round(aggregated.avgTechnicalScore),
          avgSoftSkillsScore: Math.round(aggregated.avgSoftSkillsScore),
          avgOverallScore: Math.round(aggregated.avgOverallScore),
        }
      : {
          totalInterviews: 0,
          avgTechnicalScore: 0,
          avgSoftSkillsScore: 0,
          avgOverallScore: 0,
        },
    recent: recentCompleted.map((item) => ({
      interviewId: item._id,
      roleTitle: item.roleId?.title || "Sin rol",
      technicalScore: item.feedback?.technicalScore ?? null,
      softSkillsScore: item.feedback?.softSkillsScore ?? null,
      overallScore: item.feedback?.overallScore ?? null,
      completedAt: item.updatedAt,
    })),
  };
};

module.exports = {
  startInterview,
  addUserMessageAndReply,
  completeInterview,
  getInterviewById,
  listUserInterviews,
  getUserProgress,
};
