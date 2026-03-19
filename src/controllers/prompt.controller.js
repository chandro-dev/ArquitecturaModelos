const Prompt = require("../models/Prompt");
const Role = require("../models/Role");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getPromptByRole = asyncHandler(async (req, res) => {
  const { roleId } = req.validated.params;
  const prompt = await Prompt.findOne({ roleId }).populate("roleId", "title difficulty");
  if (!prompt) throw new AppError("Prompt not found for this role", 404);

  res.status(200).json(prompt);
});

const upsertPromptByRole = asyncHandler(async (req, res) => {
  const { roleId } = req.validated.params;
  const role = await Role.findById(roleId);
  if (!role) throw new AppError("Role not found", 404);

  const prompt = await Prompt.findOneAndUpdate(
    { roleId },
    {
      roleId,
      systemInstruction: req.validated.body.systemInstruction,
      firstMessage: req.validated.body.firstMessage,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  res.status(200).json(prompt);
});

module.exports = {
  getPromptByRole,
  upsertPromptByRole,
};
