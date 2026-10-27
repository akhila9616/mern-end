const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Please provide comment text'],
    trim: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Comment must belong to a task'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must belong to a user'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

commentSchema.index({ task: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
