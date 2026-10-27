import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  MdAssignment,
  MdPendingActions,
  MdAutorenew,
  MdCheckCircle,
  MdArrowForward,
  MdAdd,
  MdCalendarToday,
  MdFileDownload,
  MdWarning,
  MdTimeline,
  MdFolderOpen,
  MdChecklist,
} from 'react-icons/md';
import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import TaskModal from '../components/tasks/TaskModal';
import toast from 'react-hot-toast';

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes, actRes, projRes] = await Promise.allSettled([
        api.get('/tasks/stats'),
        api.get('/tasks'),
        api.get('/activities'),
        api.get('/projects'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (tasksRes.status === 'fulfilled') {
        const rawTasks = tasksRes.value.data;
        const taskList = Array.isArray(rawTasks)
          ? rawTasks
          : Array.isArray(rawTasks?.tasks)
          ? rawTasks.tasks
          : [];
        setTasks(taskList);
      }

      if (actRes.status === 'fulfilled') {
        const rawActs = actRes.value.data;
        const actList = Array.isArray(rawActs)
          ? rawActs
          : Array.isArray(rawActs?.activities)
          ? rawActs.activities
          : Array.isArray(rawActs?.data)
          ? rawActs.data
          : [];
        setActivities(actList);
      }

      if (projRes.status === 'fulfilled') {
        const rawProjs = projRes.value.data;
        const projList = Array.isArray(rawProjs)
          ? rawProjs
          : Array.isArray(rawProjs?.projects)
          ? rawProjs.projects
          : Array.isArray(rawProjs?.data)
          ? rawProjs.data
          : [];
        setProjects(projList);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('taskflow:refresh-tasks', handleRefresh);
    return () => {
      window.removeEventListener('taskflow:refresh-tasks', handleRefresh);
    };
  }, []);

  // Compute stats
  const totalCount = stats?.total ?? tasks.length;

  const todoCount =
    stats?.byStatus?.todo ??
    stats?.byStatus?.['To Do'] ??
    tasks.filter((t) => t.status === 'todo').length;

  const inProgressCount =
    stats?.byStatus?.in_progress ??
    stats?.byStatus?.['in-progress'] ??
    stats?.byStatus?.['In Progress'] ??
    tasks.filter((t) => t.status === 'in_progress' || t.status === 'in-progress').length;

  const doneCount =
    stats?.byStatus?.done ??
    stats?.byStatus?.completed ??
    stats?.byStatus?.['Done'] ??
    tasks.filter((t) => t.status === 'done' || t.status === 'completed').length;

  const lowPriority =
    stats?.byPriority?.low ??
    tasks.filter((t) => (t.priority || '').toLowerCase() === 'low').length;

  const mediumPriority =
    stats?.byPriority?.medium ??
    tasks.filter((t) => (t.priority || '').toLowerCase() === 'medium').length;

  const highPriority =
    stats?.byPriority?.high ??
    tasks.filter((t) => (t.priority || '').toLowerCase() === 'high').length;

  // Overdue Tasks calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    const isCompleted = t.status === 'done' || t.status === 'completed';
    if (isCompleted || !t.dueDate) return false;
    try {
      const d = typeof t.dueDate === 'string' ? parseISO(t.dueDate) : new Date(t.dueDate);
      return isValid(d) && d < today;
    } catch {
      return false;
    }
  });

  // Recent 5 tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      let csvContent = '';

      try {
        const res = await api.get('/tasks/export', { responseType: 'blob' });
        const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Tasks exported successfully!');
        return;
      } catch (apiErr) {
        // Fallback to client-side CSV generation
        console.warn('Backend export failed, falling back to local generation:', apiErr);
      }

      // Client-side CSV generation
      const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Tags'];
      const rows = tasks.map((t) => [
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${t.status || 'todo'}"`,
        `"${t.priority || 'medium'}"`,
        `"${t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : ''}"`,
        `"${Array.isArray(t.tags) ? t.tags.join(';') : ''}"`,
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Tasks exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export tasks');
    } finally {
      setExporting(false);
    }
  };

  // Charts Config
  const doughnutData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [todoCount, inProgressCount, doneCount],
        backgroundColor: ['#94a3b8', '#f59e0b', '#10b981'],
        hoverBackgroundColor: ['#64748b', '#d97706', '#059669'],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: 'Inter', size: 12, weight: '500' },
          color: isDark ? '#cbd5e1' : '#475569',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    cutout: '70%',
  };

  const barData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        label: 'Tasks',
        data: [lowPriority, mediumPriority, highPriority],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 8,
        barThickness: 36,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { family: 'Inter', size: 11 },
          color: isDark ? '#94a3b8' : '#94a3b8',
        },
        grid: { color: isDark ? '#334155' : '#f1f5f9' },
      },
      x: {
        ticks: {
          font: { family: 'Inter', size: 11, weight: '500' },
          color: isDark ? '#cbd5e1' : '#475569',
        },
        grid: { display: false },
      },
    },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
      if (isValid(d)) return format(d, 'MMM d');
    } catch {
      return null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard metrics..." />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Explorer'}! 👋
          </h1>
          <p className="text-indigo-100 text-sm md:text-base mt-1.5 max-w-xl">
            Here's what is happening across your projects and workflows today.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20 transition-all active:scale-95 disabled:opacity-60"
            title="Download tasks as CSV spreadsheet"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MdFileDownload className="w-4 h-4" />
            )}
            <span>Export CSV</span>
          </button>

          {/* New Task Button */}
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm transition-all active:scale-95"
          >
            <MdAdd className="w-5 h-5" />
            <span>New Task</span>
          </button>

          {/* Board Link */}
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
          >
            <span>Board</span>
            <MdArrowForward className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards Grid (5 Cards: Total, To Do, In Progress, Done, Overdue) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Total Tasks
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {totalCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdAssignment className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400">
            <span>All tasks</span>
          </div>
        </div>

        {/* To Do */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                To Do
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {todoCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdPendingActions className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Pending execution</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                In Progress
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {inProgressCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdAutorenew className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 text-xs text-orange-600 dark:text-orange-400 font-medium">
            <span>Currently active</span>
          </div>
        </div>

        {/* Done */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Completed
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {doneCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>
              {totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}% done` : '0% done'}
            </span>
          </div>
        </div>

        {/* Overdue Tasks Stat Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-rose-200/80 dark:border-rose-900/50 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                Overdue
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {overdueTasks.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MdWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <span>Past due date</span>
          </div>
        </div>
      </motion.div>

      {/* OVERDUE TASKS ALERT SECTION (if any overdue) */}
      {overdueTasks.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <MdWarning className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-sm font-bold">
                Attention Required: {overdueTasks.length} Overdue{' '}
                {overdueTasks.length === 1 ? 'Task' : 'Tasks'}
              </h3>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline"
            >
              Resolve on Board →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueTasks.slice(0, 3).map((task) => (
              <div
                key={task._id || task.id}
                onClick={() => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-200/80 dark:border-rose-900/50 shadow-xs cursor-pointer hover:shadow transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                    Due {formatDate(task.dueDate)}
                  </span>
                </div>
                {task.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Visual Analytics Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution (Doughnut) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Task Status Distribution
            </h3>
            <span className="text-xs text-slate-400">By workflow stage</span>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            {totalCount === 0 ? (
              <p className="text-sm text-slate-400">No tasks created yet</p>
            ) : (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
          </div>
        </div>

        {/* Task Priorities Distribution (Bar Chart) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Tasks by Priority</h3>
            <span className="text-xs text-slate-400">Low, Medium, High</span>
          </div>
          <div className="h-64 relative">
            {totalCount === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No tasks to analyze
              </div>
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Two Widgets Grid: Projects Overview & Activity Feed */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Overview Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <MdFolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Projects Overview
                  </h3>
                  <p className="text-xs text-slate-400">Active workspaces</p>
                </div>
              </div>
              <Link
                to="/projects"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <MdArrowForward className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No projects created yet.{' '}
                <Link to="/projects" className="text-indigo-600 dark:text-indigo-400 underline">
                  Create one now
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 4).map((proj) => {
                  const tCount =
                    proj.taskCount ??
                    proj.tasksCount ??
                    (Array.isArray(proj.tasks) ? proj.tasks.length : 0);

                  return (
                    <Link
                      key={proj._id || proj.id}
                      to={`/tasks?project=${proj._id || proj.id}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between border-l-4 group"
                      style={{ borderLeftColor: proj.color || '#6366f1' }}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {proj.name}
                        </h4>
                        {proj.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                            {proj.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs">
                        {tCount} {tCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed Widget */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <MdTimeline className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Activity Feed</h3>
                  <p className="text-xs text-slate-400">Latest actions</p>
                </div>
              </div>
              <Link
                to="/activity"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full history</span>
                <MdArrowForward className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((act, idx) => {
                  let timeAgo = '';
                  const raw = act.createdAt || act.timestamp;
                  if (raw) {
                    try {
                      const d = parseISO(raw);
                      if (isValid(d)) timeAgo = formatDistanceToNow(d, { addSuffix: true });
                    } catch {
                      timeAgo = '';
                    }
                  }

                  return (
                    <div
                      key={act._id || act.id || idx}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-slate-700 dark:text-slate-200 line-clamp-1 font-medium">
                            {act.description || act.message || 'Task updated'}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            by {act.user?.name || act.userName || 'User'}
                          </span>
                        </div>
                      </div>
                      {timeAgo && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                          {timeAgo}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Tasks List */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Tasks</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest tasks added or modified</p>
          </div>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View all tasks</span>
            <MdArrowForward className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <EmptyState
            title="No recent tasks"
            description="You don't have any tasks right now. Create one to kick things off!"
            onAction={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/80">
            {recentTasks.map((task) => {
              const priorityClass =
                task.priority === 'high'
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  : task.priority === 'low'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300';

              const statusClass =
                task.status === 'done' || task.status === 'completed'
                  ? 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : task.status === 'in_progress' || task.status === 'in-progress'
                  ? 'bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

              const statusLabel =
                task.status === 'done' || task.status === 'completed'
                  ? 'Done'
                  : task.status === 'in_progress' || task.status === 'in-progress'
                  ? 'In Progress'
                  : 'To Do';

              const due = formatDate(task.dueDate);

              return (
                <div
                  key={task._id || task.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-750 px-2 -mx-2 rounded-xl transition-colors cursor-pointer"
                  onClick={() => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-lg">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {due && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <MdCalendarToday className="w-3 h-3" />
                        {due}
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full capitalize ${priorityClass}`}
                    >
                      {task.priority || 'medium'}
                    </span>

                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={() => fetchDashboardData()}
      />
    </motion.div>
  );
};

export default Dashboard;
