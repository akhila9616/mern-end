# TaskFlow Server API

Express.js and MongoDB REST backend for the **TaskFlow** task management application.

## Tech Stack
- **Node.js & Express.js**: REST API server
- **MongoDB & Mongoose**: Object Data Modeling (ODM)
- **JWT (jsonwebtoken)**: Authentication & authorization
- **bcryptjs**: Password hashing
- **express-validator**: Request validation
- **cors & dotenv**: Cross-origin requests & environment configuration

## Directory Structure
```
server/
├── .env                       # Environment variables
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── server.js                  # Main server entry point
├── config/
│   └── db.js                  # MongoDB database connection
├── controllers/
│   ├── authController.js      # Authentication business logic
│   └── taskController.js      # Task CRUD and aggregation statistics
├── middleware/
│   ├── auth.js                # JWT verification middleware
│   └── errorHandler.js        # Global error handling middleware
├── models/
│   ├── Task.js                # Task Mongoose schema & indexes
│   └── User.js                # User Mongoose schema & methods
└── routes/
    ├── authRoutes.js          # /api/auth routes
    └── taskRoutes.js          # /api/tasks routes
```

## Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=taskflow_jwt_secret_key_2024
NODE_ENV=development
```

## Running the Server
```bash
# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Start in production mode
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and obtain JWT token |
| `GET` | `/api/auth/me` | Bearer Token | Get authenticated user profile |

### Tasks (`/api/tasks`)
All task routes require the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks for current user (supports `?status=`, `?priority=`, `?search=`) |
| `GET` | `/api/tasks/stats` | Aggregated statistics (total, status breakdown, priority breakdown, completed this week) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get single task by ID |
| `PUT` | `/api/tasks/:id` | Update task details |
| `PATCH` | `/api/tasks/:id/status` | Update only task status (`todo`, `in-progress`, `done`) |
| `DELETE` | `/api/tasks/:id` | Delete task by ID |
