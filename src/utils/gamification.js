/**
 * Gamification utility to calculate XP and levels
 */

const XP_PER_LEVEL = 1000;

/**
 * Calculates how much XP is needed for a specific level
 */
const getXpForLevel = (level) => level * XP_PER_LEVEL;

/**
 * Calculates current level based on total XP
 */
const calculateLevel = (xp) => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

/**
 * Calculates XP progress within the current level (0-100)
 */
const getLevelProgress = (xp) => {
  const level = calculateLevel(xp);
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  return Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
};

module.exports = {
  XP_PER_LEVEL,
  getXpForLevel,
  calculateLevel,
  getLevelProgress
};
