const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to TaskFlow API',
    version: '1.0.0',
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile',
        password: 'PUT /api/auth/password',
      },
      tasks: {
        getAll: 'GET /api/tasks',
        getStats: 'GET /api/tasks/stats',
        exportCSV: 'GET /api/tasks/export',
        create: 'POST /api/tasks',
        getById: 'GET /api/tasks/:id',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
        updateStatus: 'PATCH /api/tasks/:id/status',
        addSubtask: 'POST /api/tasks/:id/subtasks',
        toggleSubtask: 'PATCH /api/tasks/:id/subtasks/:subtaskId',
        deleteSubtask: 'DELETE /api/tasks/:id/subtasks/:subtaskId',
        comments: {
          getAll: 'GET /api/tasks/:taskId/comments',
          add: 'POST /api/tasks/:taskId/comments',
          delete: 'DELETE /api/tasks/:taskId/comments/:commentId',
        },
      },
      projects: {
        getAll: 'GET /api/projects',
        getById: 'GET /api/projects/:id',
        create: 'POST /api/projects',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id',
      },
      activities: {
        getAll: 'GET /api/activities',
      },
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'taskflow-server',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/activities', activityRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`TaskFlow Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
