const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.email(),
    password: z.string().min(8).max(72),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updatePreferencesSchema = z.object({
  body: z.object({
    preferredMode: z.enum(["text", "voice"]).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updatePreferencesSchema,
};
