const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Prompt = require("../models/Prompt");
const Role = require("../models/Role");
const AppError = require("../utils/AppError");
const { 
  generateInterviewReply, 
  generateInterviewFeedback,
  generateSystemInstructionForJD,
  generateInitialMessageForJD,
  generateSentimentAnalysis,
  generateSentimentSummary
} = require("./ai.service");
const User = require("../models/User");
const { calculateLevel } = require("../utils/gamification");
const { updateTaskProgress } = require("./task.service");

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

const startCustomInterview = async ({ userId, customJD, companyName, mode }) => {
  if (!customJD) throw new AppError("Job Description is required", 400);

  const firstMessage = await generateInitialMessageForJD(customJD, companyName);

  const interview = await Interview.create({
    userId,
    customJD,
    companyName,
    mode: mode || "text",
    status: "in_progress",
    messages: [
      {
        sender: "ai",
        text: firstMessage,
        timestamp: new Date(),
      },
    ],
  });

  return interview;
};

const addUserMessageAndReply = async ({ interviewId, userId, text }) => {
  const interview = await Interview.findOne({ _id: interviewId, userId }).populate("roleId");
  if (!interview) throw new AppError("Interview not found", 404);
  if (interview.status !== "in_progress") {
    throw new AppError("Interview is already completed", 400);
  }

  let systemInstruction;
  let roleTitle;
  let difficulty;

  if (interview.roleId) {
    const prompt = await Prompt.findOne({ roleId: interview.roleId._id });
    if (!prompt) throw new AppError("Prompt not found for this role", 404);
    systemInstruction = prompt.systemInstruction;
    roleTitle = interview.roleId.title;
    difficulty = interview.roleId.difficulty;
  } else {
    systemInstruction = generateSystemInstructionForJD(interview.customJD, interview.companyName);
    roleTitle = `Candidato para ${interview.companyName || "Empresa"}`;
    difficulty = "Adaptativa (basada en JD)";
  }

  const userMessage = {
    sender: "user",
    text,
    timestamp: new Date(),
  };

  interview.messages.push(userMessage);

  const history = interview.messages.slice(-20).map((message) => ({
    sender: message.sender,
    text: message.text,
  }));

  // Limit logic: If more than 10 messages (5 exchanges), tell AI to wrap up
  const isWrappingUp = interview.messages.length >= 10;
  if (isWrappingUp) {
    systemInstruction += "\nIMPORTANTE: Hemos llegado al límite de preguntas. Por favor, realiza una última pregunta de cierre o despídete y dile al usuario que ya puede presionar el botón 'Finalizar' para ver su evaluación.";
  }

  // Run AI Reply and Sentiment Analysis in parallel
  const [aiText, sentiment] = await Promise.all([
    generateInterviewReply({
      systemInstruction,
      history,
      roleTitle,
      difficulty,
    }),
    generateSentimentAnalysis(text)
  ]);

  // Update user message with sentiment
  userMessage.sentiment = sentiment;

  interview.messages.push({
    sender: "ai",
    text: aiText,
    timestamp: new Date(),
  });

  // Award XP for the message (10 XP per message)
  await User.findByIdAndUpdate(userId, {
    $inc: { xp: 10 }
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

  let systemInstruction;
  let roleTitle;
  let difficulty;

  if (interview.roleId) {
    const prompt = await Prompt.findOne({ roleId: interview.roleId._id });
    if (!prompt) throw new AppError("Prompt not found for this role", 404);
    systemInstruction = prompt.systemInstruction;
    roleTitle = interview.roleId.title;
    difficulty = interview.roleId.difficulty;
  } else {
    systemInstruction = generateSystemInstructionForJD(interview.customJD, interview.companyName);
    roleTitle = `Candidato para ${interview.companyName || "Empresa"}`;
    difficulty = "Adaptativa";
  }

  const history = interview.messages.map((message) => ({
    sender: message.sender,
    text: message.text,
  }));

  const [feedback, sentimentSummary] = await Promise.all([
    generateInterviewFeedback({
      systemInstruction,
      history,
      roleTitle,
      difficulty,
    }),
    generateSentimentSummary(history)
  ]);

  interview.feedback = {
    ...feedback,
    sentimentSummary
  };
  interview.status = "completed";
  
  // Award completion XP (200 base + performance bonus)
  const bonusXp = 200 + (feedback.overallScore * 2);
  const user = await User.findById(userId);
  if (user) {
    user.xp += bonusXp;
    user.level = calculateLevel(user.xp);
    await user.save();
  }

  // Update Daily Tasks Progress
  await updateTaskProgress(userId, {
    technicalScore: feedback.technicalScore,
    softSkillsScore: feedback.softSkillsScore,
    overallScore: feedback.overallScore,
    confidenceAverage: sentimentSummary?.confidenceAverage || 0
  });

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
      roleTitle: item.roleId?.title || (item.customJD ? "Vacante Personalizada" : "Sin rol"),
      technicalScore: item.feedback?.technicalScore ?? null,
      softSkillsScore: item.feedback?.softSkillsScore ?? null,
      overallScore: item.feedback?.overallScore ?? null,
      completedAt: item.updatedAt,
    })),
    history: await Interview.find({
      userId,
      status: "completed",
      feedback: { $ne: null },
    })
      .sort({ createdAt: 1 }) // Chronological order
      .limit(20)
      .select("createdAt feedback.overallScore feedback.technicalScore feedback.softSkillsScore"),
  };
};

module.exports = {
  startInterview,
  startCustomInterview,
  addUserMessageAndReply,
  completeInterview,
  getInterviewById,
  listUserInterviews,
  getUserProgress,
};
