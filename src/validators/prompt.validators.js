const { z } = require("zod");

const upsertPromptSchema = z.object({
  body: z.object({
    systemInstruction: z.string().min(30).max(8000),
    firstMessage: z.string().min(10).max(1500),
  }),
  params: z.object({
    roleId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

const rolePromptParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    roleId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

module.exports = {
  upsertPromptSchema,
  rolePromptParamSchema,
};
