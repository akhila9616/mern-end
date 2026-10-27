const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: {
      values: [
        'created',
        'updated',
        'deleted',
        'status_changed',
        'comment_added',
        'completed',
      ],
      message: '{VALUE} is not a valid activity action',
    },
    required: [true, 'Activity action is required'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Activity must belong to a user'],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
