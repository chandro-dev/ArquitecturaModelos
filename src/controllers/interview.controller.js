const asyncHandler = require("../utils/asyncHandler");
const {
  startInterview,
  addUserMessageAndReply,
  completeInterview,
  getInterviewById,
  listUserInterviews,
  getUserProgress,
} = require("../services/interview.service");

const start = asyncHandler(async (req, res) => {
  const interview = await startInterview({
    userId: req.user._id,
    roleId: req.validated.body.roleId,
    mode: req.validated.body.mode || req.user.preferences?.preferredMode || "text",
  });
  res.status(201).json(interview);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { interview, aiMessage } = await addUserMessageAndReply({
    interviewId: req.validated.params.interviewId,
    userId: req.user._id,
    text: req.validated.body.text,
  });

  res.status(200).json({
    interviewId: interview._id,
    status: interview.status,
    aiMessage,
    messagesCount: interview.messages.length,
    updatedAt: interview.updatedAt,
  });
});

const complete = asyncHandler(async (req, res) => {
  const interview = await completeInterview({
    interviewId: req.validated.params.interviewId,
    userId: req.user._id,
  });

  res.status(200).json(interview);
});

const byId = asyncHandler(async (req, res) => {
  const interview = await getInterviewById({
    interviewId: req.validated.params.interviewId,
    userId: req.user._id,
  });
  res.status(200).json(interview);
});

const myInterviews = asyncHandler(async (req, res) => {
  const result = await listUserInterviews({
    userId: req.user._id,
    page: req.validated.query.page,
    limit: req.validated.query.limit,
    status: req.validated.query.status,
  });
  res.status(200).json(result);
});

const myProgress = asyncHandler(async (req, res) => {
  const result = await getUserProgress({ userId: req.user._id });
  res.status(200).json(result);
});

module.exports = {
  start,
  sendMessage,
  complete,
  byId,
  myInterviews,
  myProgress,
};
