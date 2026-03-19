const express = require("express");
const validate = require("../middlewares/validate");
const { auth, requireAdmin } = require("../middlewares/auth");
const { getPromptByRole, upsertPromptByRole } = require("../controllers/prompt.controller");
const { rolePromptParamSchema, upsertPromptSchema } = require("../validators/prompt.validators");

const router = express.Router();

router.get("/:roleId", auth, requireAdmin, validate(rolePromptParamSchema), getPromptByRole);
router.put("/:roleId", auth, requireAdmin, validate(upsertPromptSchema), upsertPromptByRole);

module.exports = router;
