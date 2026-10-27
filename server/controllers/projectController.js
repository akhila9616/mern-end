const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

/**
 * @desc    Get all projects for current user with task count aggregation
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const projects = await Project.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'project',
          as: 'tasks',
        },
      },
      {
        $addFields: {
          taskCount: { $size: '$tasks' },
        },
      },
      {
        $project: {
          tasks: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID with task count
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.findOne({ _id: id, user: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const taskCount = await Task.countDocuments({
      project: project._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      project: {
        ...project.toObject(),
        taskCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#6366f1',
      icon: icon || 'folder',
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      project: {
        ...project.toObject(),
        taskCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project (verify ownership)
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.findOne({ _id: id, user: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const { name, description, color, icon } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Project name cannot be empty',
        });
      }
      project.name = name.trim();
    }
    if (description !== undefined) project.description = description.trim();
    if (color !== undefined) project.color = color;
    if (icon !== undefined) project.icon = icon;

    const updatedProject = await project.save();
    const taskCount = await Task.countDocuments({
      project: updatedProject._id,
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      project: {
        ...updatedProject.toObject(),
        taskCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project and set all tasks in that project's project field to null
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const project = await Project.findOne({ _id: id, user: req.user._id });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Set all tasks in that project's project field to null
    await Task.updateMany(
      { project: project._id, user: req.user._id },
      { $set: { project: null } }
    );

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
