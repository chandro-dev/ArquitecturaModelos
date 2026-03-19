const Role = require("../models/Role");
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
  res.status(200).json(role);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create(req.validated.body);
  res.status(201).json(role);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.validated.params.roleId, req.validated.body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!role) throw new AppError("Role not found", 404);
  res.status(200).json(role);
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByIdAndDelete(req.params.roleId);
  if (!role) throw new AppError("Role not found", 404);
  res.status(204).send();
});

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
