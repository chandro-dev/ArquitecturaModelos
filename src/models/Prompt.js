const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      unique: true,
      index: true,
    },
    systemInstruction: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    firstMessage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  }
);

module.exports = mongoose.model("Prompt", promptSchema, "prompts");
