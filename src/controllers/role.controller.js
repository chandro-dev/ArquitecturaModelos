const Role = require("../models/Role");
const Prompt = require("../models/Prompt");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const listRoles = asyncHandler(async (req, res) => {
  const { search, tag, difficulty } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (tag) filter.tags = tag;
  if (difficulty) filter.difficulty = difficulty;

  const roles = await Role.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ items: roles });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.roleId);
  if (!role) throw new AppError("Role not found", 404);
  
  // Incluir el prompt si existe
  const prompt = await Prompt.findOne({ roleId: role._id });
  
  res.status(200).json({
    ...role.toObject(),
    prompt: prompt ? { systemInstruction: prompt.systemInstruction, firstMessage: prompt.firstMessage } : null
  });
});

const createRole = asyncHandler(async (req, res) => {
  const { title, description, tags, difficulty, systemInstruction, firstMessage } = req.validated.body;
  
  const role = await Role.create({ title, description, tags, difficulty });
  
  // Crear el prompt asociado
  const prompt = await Prompt.create({
    roleId: role._id,
    systemInstruction: systemInstruction || "Eres un entrevistador experto.",
    firstMessage: firstMessage || `Hola, bienvenido a la entrevista para ${title}.`
  });

  res.status(201).json({ ...role.toObject(), prompt });
});

const updateRole = asyncHandler(async (req, res) => {
  const { title, description, tags, difficulty, systemInstruction, firstMessage } = req.validated.body;
  
  const role = await Role.findByIdAndUpdate(req.validated.params.roleId, 
    { title, description, tags, difficulty }, 
    { returnDocument: "after", runValidators: true }
  );
  
  if (!role) throw new AppError("Role not found", 404);

  // Actualizar el prompt si se envió
  if (systemInstruction || firstMessage) {
    await Prompt.findOneAndUpdate(
      { roleId: role._id },
      { systemInstruction, firstMessage },
      { upsert: true }
    );
  }

  res.status(200).json(role);
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndDelete(req.params.roleId);
  if (!role) throw new AppError("Role not found", 404);
  
  // Eliminar el prompt asociado
  await Prompt.deleteMany({ roleId: req.params.roleId });
  
  res.status(204).send();
});

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
