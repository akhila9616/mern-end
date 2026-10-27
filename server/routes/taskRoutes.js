const express = require('express');
const {
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
} = require('../controllers/taskController');
const commentRoutes = require('./commentRoutes');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all task routes
router.use(protect);

// Re-route into nested comment routes
router.use('/:taskId/comments', commentRoutes);

// Task export endpoint to CSV (must be before /:id)
router.get('/export', exportTasks);

// Task statistics endpoint (must be before /:id)
router.get('/stats', getTaskStats);

// Task collection routes
router.route('/')
  .get(getTasks)
  .post(createTask);

// Task status update route
router.patch('/:id/status', updateTaskStatus);

// Subtask checklist routes
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId', toggleSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

// Single task item routes
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
