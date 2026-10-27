const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'in-progress', 'done'],
      message: '{VALUE} is not a valid status',
    },
    default: 'todo',
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: '{VALUE} is not a valid priority',
    },
    default: 'medium',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  subtasks: [
    {
      title: {
        type: String,
        required: [true, 'Subtask title is required'],
        trim: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must belong to a user'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
taskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Compound index on user and status for performant queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, project: 1 });

module.exports = mongoose.model('Task', taskSchema);
