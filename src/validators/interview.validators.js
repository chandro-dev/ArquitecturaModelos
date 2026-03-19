const { z } = require("zod");

const startInterviewSchema = z.object({
  body: z.object({
    roleId: z.string().length(24),
    mode: z.enum(["text", "voice"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const sendMessageSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(4000),
  }),
  params: z.object({
    interviewId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

const completeInterviewSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    interviewId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

const interviewIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    interviewId: z.string().length(24),
  }),
  query: z.object({}).optional(),
});

const listInterviewsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.enum(["in_progress", "completed"]).optional(),
  }),
});

module.exports = {
  startInterviewSchema,
  sendMessageSchema,
  completeInterviewSchema,
  interviewIdParamSchema,
  listInterviewsSchema,
};
