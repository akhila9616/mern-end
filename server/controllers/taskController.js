const mongoose = require('mongoose');
const Task = require('../models/Task');
const { logActivity } = require('./activityController');

/**
 * @desc    Get all tasks for current authenticated user
 * @route   GET /api/tasks
 * @access  Private
 * @query   status, priority, search, tag, project
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, tag, project } = req.query;

    // Base query scoping strictly to current user
    const query = { user: req.user._id };

    // Apply optional status filter
    if (status) {
      query.status = status;
    }

    // Apply optional priority filter
    if (priority) {
      query.priority = priority;
    }

    // Apply optional tag filter
    if (tag) {
      query.tags = tag;
    }

    // Apply optional project filter
    if (project) {
      query.project = project;
    }

    // Apply optional title search filter
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Sort by createdAt descending (newest first)
    const tasks = await Task.find(query)
      .populate('project', 'name color icon')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id })
      .populate('project', 'name color icon');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags, project, subtasks } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (status && !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: todo, in-progress, done',
      });
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Allowed values: low, medium, high',
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: Array.isArray(tags) ? tags : [],
      project: project || null,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      user: req.user._id,
    });

    // Log activity: created
    await logActivity({
      action: 'created',
      description: `Task "${task.title}" was created`,
      task: task._id,
      user: req.user._id,
      metadata: { title: task.title, status: task.status, priority: task.priority },
    });

    return res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const { title, description, status, priority, dueDate, tags, project, subtasks } = req.body;

    if (status && !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: todo, in-progress, done',
      });
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority. Allowed values: low, medium, high',
      });
    }

    const prevStatus = task.status;
    const statusChanged = status !== undefined && status !== prevStatus;

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : task.tags;
    if (project !== undefined) task.project = project || null;
    if (subtasks !== undefined && Array.isArray(subtasks)) task.subtasks = subtasks;

    const updatedTask = await task.save();

    if (statusChanged) {
      const action = updatedTask.status === 'done' ? 'completed' : 'status_changed';
      const description = updatedTask.status === 'done'
        ? `Task "${updatedTask.title}" was completed`
        : `Task "${updatedTask.title}" status changed to ${updatedTask.status}`;

      await logActivity({
        action,
        description,
        task: updatedTask._id,
        user: req.user._id,
        metadata: { prevStatus, newStatus: updatedTask.status },
      });
    } else {
      await logActivity({
        action: 'updated',
        description: `Task "${updatedTask.title}" was updated`,
        task: updatedTask._id,
        user: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const taskTitle = task.title;
    const taskId = task._id;

    await task.deleteOne();

    // Log activity: deleted
    await logActivity({
      action: 'deleted',
      description: `Task "${taskTitle}" was deleted`,
      task: taskId,
      user: req.user._id,
      metadata: { title: taskTitle },
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update only the status of a task
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status is required and must be one of: ${validStatuses.join(', ')}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const prevStatus = task.status;
    task.status = status;
    const updatedTask = await task.save();

    const action = status === 'done' ? 'completed' : 'status_changed';
    const description = status === 'done'
      ? `Task "${task.title}" was completed`
      : `Task "${task.title}" status changed to ${status}`;

    await logActivity({
      action,
      description,
      task: updatedTask._id,
      user: req.user._id,
      metadata: { prevStatus, newStatus: status },
    });

    return res.status(200).json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task statistics for authenticated user using MongoDB aggregation
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Calculate start of current week (Sunday midnight)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const aggregateResult = await Task.aggregate([
      {
        $match: { user: userId },
      },
      {
        $facet: {
          totalTasks: [
            { $count: 'count' },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
          ],
          completedThisWeek: [
            {
              $match: {
                status: 'done',
                updatedAt: { $gte: startOfWeek },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const stats = aggregateResult[0] || {};

    const totalTasks =
      stats.totalTasks && stats.totalTasks[0] ? stats.totalTasks[0].count : 0;

    const byStatus = {
      todo: 0,
      'in-progress': 0,
      done: 0,
    };
    if (Array.isArray(stats.byStatus)) {
      stats.byStatus.forEach((item) => {
        if (byStatus.hasOwnProperty(item._id)) {
          byStatus[item._id] = item.count;
        }
      });
    }

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
    };
    if (Array.isArray(stats.byPriority)) {
      stats.byPriority.forEach((item) => {
        if (byPriority.hasOwnProperty(item._id)) {
          byPriority[item._id] = item.count;
        }
      });
    }

    const completedThisWeek =
      stats.completedThisWeek && stats.completedThisWeek[0]
        ? stats.completedThisWeek[0].count
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalTasks,
        byStatus,
        byPriority,
        completedThisWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a subtask to a task
 * @route   POST /api/tasks/:id/subtasks
 * @access  Private
 */
const addSubtask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subtask title is required',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.subtasks.push({
      title: title.trim(),
      completed: false,
    });

    const updatedTask = await task.save();
    const newSubtask = updatedTask.subtasks[updatedTask.subtasks.length - 1];

    return res.status(201).json({
      success: true,
      subtask: newSubtask,
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle completed status of a subtask
 * @route   PATCH /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
const toggleSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(subtaskId)) {
      return res.status(404).json({
        success: false,
        message: 'Task or subtask not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    if (typeof req.body.completed === 'boolean') {
      subtask.completed = req.body.completed;
    } else {
      subtask.completed = !subtask.completed;
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      subtask: updatedTask.subtasks.id(subtaskId),
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a subtask from a task
 * @route   DELETE /api/tasks/:id/subtasks/:subtaskId
 * @access  Private
 */
const deleteSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(subtaskId)) {
      return res.status(404).json({
        success: false,
        message: 'Task or subtask not found',
      });
    }

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    task.subtasks.pull(subtaskId);
    const updatedTask = await task.save();

    return res.status(200).json({
      success: true,
      message: 'Subtask deleted successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to escape CSV field values (RFC 4180 standard)
 */
const escapeCSV = (field) => {
  if (field === null || field === undefined) return '""';
  const stringVal = String(field);
  return `"${stringVal.replace(/"/g, '""')}"`;
};

/**
 * @desc    Export all user's tasks to CSV
 * @route   GET /api/tasks/export
 * @access  Private
 */
const exportTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });

    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Created At'];
    const rows = tasks.map((t) => {
      let dueDateStr = '';
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        dueDateStr = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
      let createdAtStr = '';
      if (t.createdAt) {
        const c = new Date(t.createdAt);
        createdAtStr = isNaN(c.getTime()) ? '' : c.toISOString();
      }

      return [
        escapeCSV(t.title),
        escapeCSV(t.description || ''),
        escapeCSV(t.status),
        escapeCSV(t.priority),
        escapeCSV(dueDateStr),
        escapeCSV(Array.isArray(t.tags) ? t.tags.join(', ') : ''),
        escapeCSV(createdAtStr),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');

    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  exportTasks,
};

