const User = require("../models/User");
const Interview = require("../models/Interview");
const { generateMissionsWithAI } = require("./ai.service");

/**
 * Generates personalized daily tasks for a user using AI
 */
const generateDailyTasks = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  // Fetch last interview to provide context to AI
  const lastInterview = await Interview.findOne({ userId, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(1);

  const history = lastInterview ? lastInterview.messages : [];
  
  const { dailyTasks, studyPlan } = await generateMissionsWithAI(history, user.preferences);

  user.dailyTasks = dailyTasks;
  user.studyMissions = studyPlan;
  await user.save();
  return { dailyTasks, studyMissions: studyPlan };
};

/**
 * Toggles a manual study mission
 */
const toggleStudyMission = async (userId, missionId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const mission = user.studyMissions.id(missionId);
  if (!mission) return null;

  if (!mission.completed) {
    mission.completed = true;
    user.xp += mission.xpReward;
  } else {
    mission.completed = false;
    user.xp -= mission.xpReward;
  }

  await user.save();
  return user;
};

/**
 * Updates task progress based on interview results
 */
const updateTaskProgress = async (userId, interviewResults) => {
  const user = await User.findById(userId);
  if (!user || !user.dailyTasks.length) return;

  let changed = false;

  user.dailyTasks.forEach(task => {
    if (task.completed) return;

    if (task.type === "score_technical" && interviewResults.technicalScore >= task.targetValue) {
      task.completed = true;
      user.xp += task.xpReward;
      changed = true;
    }
    
    if (task.type === "score_confidence" && interviewResults.confidenceAverage >= task.targetValue) {
      task.completed = true;
      user.xp += task.xpReward;
      changed = true;
    }

    if (task.type === "count") {
      task.currentValue += 1;
      if (task.currentValue >= task.targetValue) {
        task.completed = true;
        user.xp += task.xpReward;
      }
      changed = true;
    }
  });

  if (changed) {
    await user.save();
  }
};

module.exports = {
  generateDailyTasks,
  updateTaskProgress,
  toggleStudyMission
};
