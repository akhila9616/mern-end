# 🚀 TaskFlow — Modern Task & Project Management App

A full-stack task and project management application built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). Features a beautiful Kanban board with drag-and-drop, project organization, calendar view, activity timeline, Pomodoro timer, dark mode, and a clean modern UI with smooth animations.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 🌐 Live Application & Demo Access
DEMO VIDEO URL : https://drive.google.com/file/d/15pnoe7YkzlDP_Ld2RjFEsrd2syrHKtAL/view?usp=sharing
> **🔗 Permanent Live URL:** [https://task-flow-jlo4.onrender.com](https://task-flow-jlo4.onrender.com)  
> **👤 Demo Email:** `demo@taskflow.com`  
> **🔑 Demo Password:** `password123`  
> *(One-click demo login button available directly on the login page)*
> 

---

## ✨ Features

### Core Task Management
- **📋 Kanban Board** — Drag-and-drop task management across To Do, In Progress, and Done columns
- **📝 List View** — Toggle between Kanban board and sortable table list view
- **✅ Subtasks/Checklists** — Add checklist items within tasks with visual progress tracking
- **🎯 Priority System** — Categorize tasks as Low, Medium, or High priority with color coding
- **🏷️ Tags** — Organize tasks with custom color-coded tags
- **📅 Due Dates** — Set and track task deadlines with overdue alerts
- **🔍 Advanced Filters** — Filter by status, priority, project, and search terms

### Project Organization
- **🗂️ Projects** — Group related tasks into color-coded projects
- **🎨 Custom Colors & Icons** — Personalize each project with 8 color themes and icons
- **📊 Task Counts** — See how many tasks each project contains at a glance

### Views & Analytics
- **📊 Dashboard** — Visual analytics with doughnut and bar charts showing task distribution
- **📅 Calendar View** — Monthly calendar showing tasks on their due dates with day detail panel
- **📋 Activity Timeline** — Color-coded chronological log of all task actions
- **⏰ Overdue Alerts** — Dashboard section and card indicators for overdue tasks

### Productivity Tools
- **🍅 Pomodoro Timer** — Built-in floating focus timer (25/5/15 min modes) with audio notifications
- **💬 Task Comments** — Discussion threads on tasks with timestamps
- **📥 Export CSV** — Download all tasks as a CSV spreadsheet
- **🌙 Dark Mode** — Toggle between light and dark themes (persisted in localStorage)

### User Management
- **🔐 JWT Authentication** — Secure login & registration with hashed passwords
- **👤 User Profile** — Edit name, email, and avatar
- **🔑 Change Password** — Secure password update with current password verification
- **📱 Responsive Design** — Works beautifully on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI Library |
| Vite | Build Tool |
| Tailwind CSS 3 | Styling (with Dark Mode) |
| React Router v6 | Client-side Routing |
| @hello-pangea/dnd | Drag & Drop (Kanban) |
| Chart.js + react-chartjs-2 | Dashboard Charts |
| Framer Motion | Animations |
| Axios | HTTP Client |
| React Icons (MD) | Material Design Icons |
| date-fns | Date Formatting |
| react-hot-toast | Toast Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password Hashing |
| express-validator | Input Validation |
| mongodb-memory-server | In-memory DB (dev) |

---

## 📁 Project Structure

```
taskflow/
├── package.json              # Root scripts (concurrent dev)
├── README.md
│
├── client/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # LoadingSpinner, EmptyState, PomodoroTimer
│   │   │   ├── layout/       # Navbar, Sidebar, Layout
│   │   │   ├── projects/     # ProjectModal
│   │   │   └── tasks/        # TaskCard, TaskModal, TaskFilters
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── pages/            # Dashboard, TaskBoard, Calendar, Projects,
│   │   │                     # ActivityLog, Profile, Login, Register
│   │   ├── utils/            # api.js (Axios instance)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                   # Express Backend
│   ├── config/               # db.js (MongoDB connection)
│   ├── controllers/          # auth, task, project, comment, activity
│   ├── middleware/            # auth.js, errorHandler.js
│   ├── models/               # User, Task, Project, Comment, Activity
│   ├── routes/               # auth, task, project, comment, activity
│   ├── server.js
│   ├── .env
│   └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- No MongoDB installation needed — uses in-memory MongoDB for development!

### Quick Start (One Command)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd taskflow
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Start both servers**
   ```bash
   npm run dev
   ```

4. **Open your browser** → `http://localhost:3000`

### Manual Start (Two Terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile (name, email, avatar) |
| PUT | `/api/auth/password` | Change password |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (with filters) |
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/stats` | Get task statistics |
| GET | `/api/tasks/export` | Export tasks as CSV |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/status` | Update task status |

### Subtasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:id/subtasks` | Add a subtask |
| PATCH | `/api/tasks/:id/subtasks/:subtaskId` | Toggle subtask completion |
| DELETE | `/api/tasks/:id/subtasks/:subtaskId` | Delete a subtask |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId/comments` | Get task comments |
| POST | `/api/tasks/:taskId/comments` | Add a comment |
| DELETE | `/api/tasks/:taskId/comments/:commentId` | Delete a comment |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects (with task counts) |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | Get recent activity log |

---

## 🧪 Key Workflows

1. **User Registration & Login** → JWT token stored in localStorage → protected routes
2. **Project Creation** → Color-coded projects to organize tasks
3. **Task Management** → Create tasks with title, description, priority, due date, tags, project
4. **Kanban Drag & Drop** → Move tasks between columns to update status instantly
5. **Subtask Checklists** → Break tasks into smaller items with progress tracking
6. **Task Discussion** → Add comments with timestamps on any task
7. **Calendar Planning** → View tasks by due date on a monthly calendar grid
8. **Dashboard Analytics** → Charts and stats for productivity insights
9. **Activity Tracking** → Full audit trail of all task changes
10. **Focus Sessions** → Pomodoro timer for time-boxed productivity
11. **Data Export** → Download tasks as CSV for external use
12. **Dark Mode** → Toggle theme preference (persisted)

---

## 🎨 Design Highlights

- **Indigo/Purple gradient theme** with clean white cards
- **Tailwind CSS** with full dark mode support
- **Framer Motion** animations for smooth page transitions
- **Responsive layout** — works on all screen sizes
- **Inter font** for modern typography
- **Material Design icons** throughout

---

## 📝 Environment Variables

### Server (`server/.env`)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

> **Note:** If no MongoDB is installed, the app automatically uses an in-memory database for development.

---

## 👤 Author

**Akhila**

## 📄 License

This project is licensed under the MIT License.
