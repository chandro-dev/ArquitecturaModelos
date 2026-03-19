const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Fácil", "Intermedio", "Difícil"],
      required: true,
      default: "Intermedio",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

module.exports = mongoose.model("Role", roleSchema, "roles");
