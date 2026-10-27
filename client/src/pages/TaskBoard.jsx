import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  MdAdd,
  MdViewKanban,
  MdFormatListBulleted,
  MdEdit,
  MdDelete,
  MdCalendarToday,
  MdPlaylistAddCheck,
  MdCheckCircle,
  MdRadioButtonUnchecked,
} from 'react-icons/md';
import { format, isValid, parseISO } from 'date-fns';
import api from '../utils/api';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import TaskFilters from '../components/tasks/TaskFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const COLUMNS = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-slate-400 dark:bg-slate-500',
    headerBadge: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'bg-amber-500',
    headerBadge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
  },
  {
    id: 'done',
    title: 'Done',
    color: 'bg-emerald-500',
    headerBadge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
  },
];

const normalizeStatus = (status) => {
  if (!status) return 'todo';
  const s = status.toLowerCase();
  if (s === 'in_progress' || s === 'in-progress') return 'in_progress';
  if (s === 'done' || s === 'completed') return 'done';
  return 'todo';
};

const TaskBoard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProjectQuery = searchParams.get('project') || 'all';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'kanban' or 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState(initialProjectQuery);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [tasksRes, projsRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/projects'),
      ]);

      if (tasksRes.status === 'fulfilled') {
        const data = tasksRes.value.data;
        const taskList = Array.isArray(data)
          ? data
          : Array.isArray(data?.tasks)
          ? data.tasks
          : [];
        setTasks(taskList);
      }

      if (projsRes.status === 'fulfilled') {
        const pdata = projsRes.value.data;
        const pList = Array.isArray(pdata)
          ? pdata
          : Array.isArray(pdata?.projects)
          ? pdata.projects
          : Array.isArray(pdata?.data)
          ? pdata.data
          : [];
        setProjects(pList);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const handleRefresh = () => fetchTasks();
    window.addEventListener('taskflow:refresh-tasks', handleRefresh);
    return () => {
      window.removeEventListener('taskflow:refresh-tasks', handleRefresh);
    };
  }, []);

  // Sync project filter with query param if it changes
  useEffect(() => {
    const p = searchParams.get('project');
    if (p) {
      setProjectFilter(p);
    }
  }, [searchParams]);

  const handleProjectFilterChange = (val) => {
    setProjectFilter(val);
    if (val === 'all') {
      searchParams.delete('project');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ project: val });
    }
  };

  // Filter tasks based on search, status, priority, and project
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(task.tags) &&
          task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

      // Status filter
      const normalized = normalizeStatus(task.status);
      const matchesStatus = statusFilter === 'all' || normalized === statusFilter;

      // Priority filter
      const matchesPriority =
        priorityFilter === 'all' ||
        (task.priority || '').toLowerCase() === priorityFilter.toLowerCase();

      // Project filter
      const taskProjectId =
        typeof task.project === 'object' && task.project !== null
          ? task.project._id || task.project.id
          : task.project;

      const matchesProject = projectFilter === 'all' || taskProjectId === projectFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, projectFilter]);

  // Handle Drag and Drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const previousTasks = [...tasks];

    // Optimistically update
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        const id = String(t._id || t.id);
        if (id === draggableId) {
          return { ...t, status: newStatus };
        }
        return t;
      })
    );

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
      toast.success(
        `Task moved to ${
          newStatus === 'in_progress' ? 'In Progress' : newStatus === 'done' ? 'Done' : 'To Do'
        }`
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      toast.error('Could not save task status. Reverting change.');
      setTasks(previousTasks);
    }
  };

  // Open modal for new task
  const handleOpenCreateModal = (columnId = 'todo') => {
    setSelectedTask({
      status: columnId,
      project: projectFilter !== 'all' ? projectFilter : '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));

    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task');
      setTasks(previousTasks);
    }
  };

  // Save/Update callback from modal
  const handleTaskSaved = () => {
    fetchTasks();
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    handleProjectFilterChange('all');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading task board..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Task Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {viewMode === 'kanban'
              ? 'Organize tasks by workflow stage with drag-and-drop.'
              : 'Detailed table overview of all your tasks and milestones.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateModal('todo')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
        >
          <MdAdd className="w-5 h-5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Filter Bar with Project Dropdown & View Mode */}
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={handleProjectFilterChange}
        projects={projects}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
      />

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter(
                (t) => normalizeStatus(t.status) === col.id
              );

              return (
                <div
                  key={col.id}
                  className="flex flex-col bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${col.color}`} />
                      <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                        {col.title}
                      </h2>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.headerBadge}`}
                      >
                        {columnTasks.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(col.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                      title={`Add task to ${col.title}`}
                    >
                      <MdAdd className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Droppable Column Content */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 min-h-[420px] transition-colors flex flex-col gap-3 ${
                          snapshot.isDraggingOver
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-400 ring-dashed'
                            : ''
                        }`}
                      >
                        {columnTasks.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl my-2">
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              No tasks in {col.title}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateModal(col.id)}
                              className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              + Add one now
                            </button>
                          </div>
                        ) : (
                          columnTasks.map((task, index) => {
                            const taskId = String(task._id || task.id);
                            return (
                              <Draggable key={taskId} draggableId={taskId} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <TaskCard
                                    task={task}
                                    innerRef={dragProvided.innerRef}
                                    draggableProps={dragProvided.draggableProps}
                                    dragHandleProps={dragProvided.dragHandleProps}
                                    isDragging={dragSnapshot.isDragging}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleDeleteTask}
                                  />
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* VIEW 2: TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              No tasks match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Checklist</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {filteredTasks.map((task) => {
                    const taskId = task._id || task.id;
                    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
                    const completedSubs = subtasks.filter((s) => s.completed).length;

                    // Resolve project
                    let projectObj = null;
                    if (task.project && typeof task.project === 'object') {
                      projectObj = task.project;
                    } else if (task.project) {
                      projectObj = projects.find((p) => (p._id || p.id) === task.project);
                    }

                    const priorityClass =
                      task.priority === 'high'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : task.priority === 'low'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300';

                    const statusClass =
                      task.status === 'done' || task.status === 'completed'
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : task.status === 'in_progress' || task.status === 'in-progress'
                        ? 'bg-amber-100/60 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

                    let formattedDue = '';
                    if (task.dueDate) {
                      try {
                        const d = parseISO(task.dueDate);
                        if (isValid(d)) formattedDue = format(d, 'MMM d, yyyy');
                      } catch {
                        formattedDue = '';
                      }
                    }

                    return (
                      <tr
                        key={taskId}
                        onClick={() => handleOpenEditModal(task)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                      >
                        {/* Title & Description */}
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <div className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-400 dark:text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                              {task.description}
                            </div>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {projectObj ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: projectObj.color || '#6366f1' }}
                              />
                              <span>{projectObj.name}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                              None
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusClass}`}
                          >
                            {task.status?.replace('_', ' ') || 'todo'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${priorityClass}`}
                          >
                            {task.priority || 'medium'}
                          </span>
                        </td>

                        {/* Checklist */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {subtasks.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <MdPlaylistAddCheck className="w-4 h-4 text-indigo-500" />
                              <span>
                                {completedSubs}/{subtasks.length}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {formattedDue ? (
                            <span className="inline-flex items-center gap-1">
                              <MdCalendarToday className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formattedDue}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">No date</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className="inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(task)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                              title="Edit Task"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(taskId)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                              title="Delete Task"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
};

export default TaskBoard;
