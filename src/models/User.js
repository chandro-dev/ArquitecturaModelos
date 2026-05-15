const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    preferences: {
      preferredMode: {
        type: String,
        enum: ["text", "voice"],
        default: "text",
      },
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    achievements: {
      type: [String],
      default: [],
    },
    dailyTasks: {
      type: [{
        description: String,
        type: { type: String }, // "score", "count", "mode"
        targetValue: Number,
        currentValue: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        xpReward: { type: Number, default: 150 },
        category: String // "técnico", "soft-skills", "confianza"
      }],
      default: [],
    },
    studyMissions: {
      type: [{
        topic: String,
        description: String,
        completed: { type: Boolean, default: false },
        xpReward: { type: Number, default: 100 }
      }],
      default: [],
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema, "users");
