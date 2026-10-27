const Activity = require('../models/Activity');

/**
 * Helper function to create an activity log entry
 * @param {Object} data - { action, description, task, user, metadata }
 * @returns {Promise<Object|null>} Created activity document or null on error
 */
const logActivity = async ({ action, description, task, user, metadata }) => {
  try {
    const activity = await Activity.create({
      action,
      description: description || '',
      task: task || null,
      user,
      metadata: metadata || {},
    });
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error.message);
    return null;
  }
};

/**
 * @desc    Get recent activities for current user (limit 50, sorted by createdAt desc)
 * @route   GET /api/activities
 * @access  Private
 */
const getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('task', 'title status priority');

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  logActivity,
};
