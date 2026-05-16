const express = require("express");
const authRoutes = require("./auth.routes");
const roleRoutes = require("./role.routes");
const promptRoutes = require("./prompt.routes");
const interviewRoutes = require("./interview.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "interview-backend" });
});

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/prompts", promptRoutes);
router.use("/interviews", interviewRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
