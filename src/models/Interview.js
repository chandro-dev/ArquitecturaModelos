const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    audioUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    technicalScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    softSkillsScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    generalComment: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      index: true,
    },
    mode: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    feedback: {
      type: feedbackSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

interviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Interview", interviewSchema, "interviews");
