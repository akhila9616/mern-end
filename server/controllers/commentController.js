const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { logActivity } = require('./activityController');

/**
 * @desc    Get all comments for a task (populate user name and avatar)
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private
 */
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to a task
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private
 */
const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const comment = await Comment.create({
      text: text.trim(),
      task: task._id,
      user: req.user._id,
    });

    await comment.populate('user', 'name avatar');

    // Log activity: comment_added
    await logActivity({
      action: 'comment_added',
      description: `Comment added to task "${task.title}"`,
      task: task._id,
      user: req.user._id,
      metadata: {
        commentId: comment._id,
        commentText: comment.text.length > 50 ? `${comment.text.substring(0, 50)}...` : comment.text,
      },
    });

    return res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete own comment
 * @route   DELETE /api/tasks/:taskId/comments/:commentId
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      user: req.user._id,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or not authorized to delete',
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment,
};
