const express = require("express");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const {
  start,
  sendMessage,
  complete,
  byId,
  myInterviews,
  myProgress,
} = require("../controllers/interview.controller");
const {
  startInterviewSchema,
  sendMessageSchema,
  completeInterviewSchema,
  interviewIdParamSchema,
  listInterviewsSchema,
} = require("../validators/interview.validators");

const router = express.Router();

router.use(auth);

router.post("/start", validate(startInterviewSchema), start);
router.get("/me/history", validate(listInterviewsSchema), myInterviews);
router.get("/me/progress", myProgress);
router.get("/:interviewId", validate(interviewIdParamSchema), byId);
router.post("/:interviewId/message", validate(sendMessageSchema), sendMessage);
router.post("/:interviewId/complete", validate(completeInterviewSchema), complete);

module.exports = router;
