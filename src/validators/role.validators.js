const { z } = require("zod");

const roleBody = z.object({
  title: z.string().min(2).max(140),
  description: z.string().min(10).max(1200),
  tags: z.array(z.string().min(1).max(40)).default([]),
  difficulty: z.enum(["Fácil", "Intermedio", "Difícil"]),
  systemInstruction: z.string().min(10).max(5000).optional(),
  firstMessage: z.string().min(5).max(1000).optional(),
});

const createRoleSchema = z.object({
  body: roleBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateRoleSchema = z.object({
  body: roleBody.partial(),
  params: z.object({
    roleId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

const roleIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    roleId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
};
