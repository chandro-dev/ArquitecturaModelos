const express = require("express");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const { register, login, me, updatePreferences } = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  updatePreferencesSchema,
} = require("../validators/auth.validators");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", auth, me);
router.patch("/me/preferences", auth, validate(updatePreferencesSchema), updatePreferences);

module.exports = router;
