import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdSave,
  MdCheckCircleOutline,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdDeleteOutline,
  MdAdd,
  MdChatBubbleOutline,
  MdPlaylistAddCheck,
  MdSend,
  MdFolderOpen,
} from 'react-icons/md';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const initialFormState = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: '',
  project: '',
};

const TaskModal = ({ isOpen, onClose, task = null, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'subtasks' | 'comments'
  const [formData, setFormData] = useState(initialFormState);
  const [projects, setProjects] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSubtask, setLoadingSubtask] = useState(false);
  const [errors, setErrors] = useState({});

  const commentsEndRef = useRef(null);
  const isEdit = Boolean(task && (task._id || task.id));
  const taskId = task?._id || task?.id;

  // Fetch projects list when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.projects)
          ? data.projects
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setProjects(list);
      } catch (err) {
        // Soft fail if projects endpoint returns error
        console.error('Failed to load projects for dropdown:', err);
      }
    };

    fetchProjects();
  }, [isOpen]);

  // Load task details, subtasks and comments
  useEffect(() => {
    if (task) {
      let formattedDate = '';
      if (task.dueDate) {
        try {
          formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
        } catch {
          formattedDate = '';
        }
      }

      const tagsString = Array.isArray(task.tags)
        ? task.tags.join(', ')
        : typeof task.tags === 'string'
        ? task.tags
        : '';

      const projectId = task.project?._id || task.project || '';

      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: formattedDate,
        tags: tagsString,
        project: projectId,
      });

      setSubtasks(Array.isArray(task.subtasks) ? task.subtasks : []);
    } else {
      setFormData(initialFormState);
      setSubtasks([]);
    }

    setComments([]);
    setNewSubtaskTitle('');
    setNewCommentText('');
    setActiveTab('details');
    setErrors({});
  }, [task, isOpen]);

  // Fetch comments when switching to comments tab
  useEffect(() => {
    if (isOpen && isEdit && activeTab === 'comments' && taskId) {
      fetchComments();
    }
  }, [isOpen, isEdit, activeTab, taskId]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/tasks/${taskId}/comments`);
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.comments)
        ? data.comments
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setComments(list);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        tags: tagsArray,
        project: formData.project || null,
      };

      // If creating new task and there are local subtasks added
      if (!isEdit && subtasks.length > 0) {
        payload.subtasks = subtasks;
      }

      let response;
      if (isEdit) {
        response = await api.put(`/tasks/${taskId}`, payload);
        toast.success('Task updated successfully!');
      } else {
        response = await api.post('/tasks', payload);
        toast.success('Task created successfully!');
      }

      const savedTask = response.data?.task || response.data;
      if (onSuccess) {
        onSuccess(savedTask);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      const msg = error.response?.data?.message || 'Failed to save task. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Subtask Handlers ---
  const handleAddSubtask = async (e) => {
    if (e) e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title) return;

    if (isEdit) {
      setLoadingSubtask(true);
      try {
        const res = await api.post(`/tasks/${taskId}/subtasks`, { title });
        const updatedTask = res.data?.task || res.data;
        if (Array.isArray(updatedTask?.subtasks)) {
          setSubtasks(updatedTask.subtasks);
        } else if (res.data?.subtask) {
          setSubtasks((prev) => [...prev, res.data.subtask]);
        } else {
          setSubtasks((prev) => [...prev, { _id: Date.now().toString(), title, completed: false }]);
        }
        setNewSubtaskTitle('');
        toast.success('Subtask added');
      } catch (err) {
        console.error('Failed to add subtask:', err);
        // Fallback optimistic
        setSubtasks((prev) => [...prev, { _id: Date.now().toString(), title, completed: false }]);
        setNewSubtaskTitle('');
      } finally {
        setLoadingSubtask(false);
      }
    } else {
      // Local state for draft task
      setSubtasks((prev) => [...prev, { _id: Date.now().toString(), title, completed: false }]);
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    const updatedStatus = !currentStatus;
    setSubtasks((prev) =>
      prev.map((s) => (s._id === subtaskId ? { ...s, completed: updatedStatus } : s))
    );

    if (isEdit) {
      try {
        await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, {
          completed: updatedStatus,
        });
      } catch (err) {
        console.error('Failed to toggle subtask:', err);
        toast.error('Failed to update subtask');
        // Revert
        setSubtasks((prev) =>
          prev.map((s) => (s._id === subtaskId ? { ...s, completed: currentStatus } : s))
        );
      }
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    const previous = [...subtasks];
    setSubtasks((prev) => prev.filter((s) => s._id !== subtaskId));

    if (isEdit) {
      try {
        await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
        toast.success('Subtask removed');
      } catch (err) {
        console.error('Failed to delete subtask:', err);
        toast.error('Failed to remove subtask');
        setSubtasks(previous);
      }
    }
  };

  // --- Comment Handlers ---
  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    const text = newCommentText.trim();
    if (!text || !isEdit) return;

    try {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        text,
        content: text,
      });
      const newComment =
        res.data?.comment ||
        (typeof res.data === 'object' && res.data._id ? res.data : null);

      if (newComment) {
        setComments((prev) => [...prev, newComment]);
      } else {
        // Fallback mock entry
        setComments((prev) => [
          ...prev,
          {
            _id: Date.now().toString(),
            text,
            content: text,
            user: { _id: user?._id || user?.id, name: user?.name, email: user?.email },
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setNewCommentText('');
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      toast.success('Comment added');
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const previous = [...comments];
    setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));

    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      toast.success('Comment deleted');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Failed to delete comment');
      setComments(previous);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtaskProgressPercent =
    subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-10 my-8 transition-colors duration-200"
          >
            {/* Header with Tabs */}
            <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80">
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    <MdCheckCircleOutline className="w-5 h-5" />
                  </span>
                  {isEdit ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center px-6 gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'details'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('subtasks')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'subtasks'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MdPlaylistAddCheck className="w-4 h-4" />
                  <span>Subtasks</span>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {completedSubtasksCount}/{subtasks.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <MdChatBubbleOutline className="w-4 h-4" />
                  <span>Comments</span>
                  {comments.length > 0 && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {comments.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: DETAILS */}
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Design the landing page mockups"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 dark:text-white dark:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      errors.title
                        ? 'border-rose-300 dark:border-rose-500 bg-rose-50/30'
                        : 'border-slate-200 dark:border-slate-600 bg-white hover:border-slate-300 dark:hover:border-slate-500 focus:border-indigo-500'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add details, notes, or acceptance criteria..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>

                {/* Project Selection Dropdown */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <MdFolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Project</span>
                  </label>
                  <select
                    name="project"
                    value={formData.project}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                  >
                    <option value="">No Project (General)</option>
                    {projects.map((proj) => {
                      const id = proj._id || proj.id;
                      return (
                        <option key={id} value={id}>
                          {proj.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Status and Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                {/* Due Date and Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="e.g. Design, UI, v1.0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MdSave className="w-4 h-4" />
                    )}
                    <span>{isEdit ? 'Update Task' : 'Save Task'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SUBTASKS */}
            {activeTab === 'subtasks' && (
              <div className="p-6 space-y-4 max-h-[70vh] flex flex-col justify-between">
                <div>
                  {/* Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="mb-4 bg-slate-50 dark:bg-slate-700/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        <span>Checklist Progress</span>
                        <span>
                          {completedSubtasksCount} of {subtasks.length} completed (
                          {subtaskProgressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${subtaskProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Subtask Input */}
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a new checklist item (press Enter)..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="submit"
                      disabled={loadingSubtask || !newSubtaskTitle.trim()}
                      className="px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      <MdAdd className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Subtasks List */}
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                    {subtasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                        No subtasks added yet. Type above to break down this task!
                      </div>
                    ) : (
                      subtasks.map((subtask) => {
                        const sId = subtask._id || subtask.id;
                        return (
                          <div
                            key={sId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleSubtask(sId, subtask.completed)}
                              className="flex items-center gap-3 text-left flex-1 min-w-0"
                            >
                              {subtask.completed ? (
                                <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <MdRadioButtonUnchecked className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                              )}
                              <span
                                className={`text-sm break-words ${
                                  subtask.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {subtask.title}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(sId)}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete subtask"
                            >
                              <MdDeleteOutline className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Subtasks Footer */}
                <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: COMMENTS */}
            {activeTab === 'comments' && (
              <div className="p-6 space-y-4 max-h-[70vh] flex flex-col justify-between">
                {!isEdit ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    Please create and save this task first to start discussions and comments.
                  </div>
                ) : (
                  <>
                    {/* Comments Thread List */}
                    <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2">
                      {loadingComments ? (
                        <div className="py-8 text-center">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-xs text-slate-400 mt-2">Loading discussion...</p>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                          No comments yet. Start the conversation!
                        </div>
                      ) : (
                        comments.map((comment) => {
                          const commentId = comment._id || comment.id;
                          const authorName = comment.user?.name || comment.userName || 'User';
                          const authorId = comment.user?._id || comment.user?.id || comment.user;
                          const isOwn =
                            authorId === (user?._id || user?.id) ||
                            authorName === user?.name;

                          let timeAgo = '';
                          if (comment.createdAt) {
                            try {
                              const d = parseISO(comment.createdAt);
                              if (isValid(d)) timeAgo = formatDistanceToNow(d, { addSuffix: true });
                            } catch {
                              timeAgo = '';
                            }
                          }

                          return (
                            <div
                              key={commentId}
                              className={`p-3 rounded-xl border text-sm transition-colors ${
                                isOwn
                                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40'
                                  : 'bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                                    {authorName.substring(0, 1).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {authorName}
                                  </span>
                                  {timeAgo && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                      {timeAgo}
                                    </span>
                                  )}
                                </div>

                                {isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(commentId)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Delete comment"
                                  >
                                    <MdDeleteOutline className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                                {comment.content || comment.text}
                              </p>
                            </div>
                          );
                        })
                      )}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Add Comment Input */}
                    <form
                      onSubmit={handleAddComment}
                      className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <MdSend className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;
