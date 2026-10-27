import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isValid,
} from 'date-fns';
import {
  MdChevronLeft,
  MdChevronRight,
  MdToday,
  MdAdd,
  MdCalendarToday,
  MdClose,
  MdPlaylistAddCheck,
  MdCheckCircle,
  MdRadioButtonUnchecked,
} from 'react-icons/md';
import api from '../utils/api';
import TaskModal from '../components/tasks/TaskModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const priorityColors = {
  low: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  medium: {
    bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  high: {
    bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
};

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
        ? data.tasks
        : [];
      setTasks(list);
    } catch (err) {
      console.error('Failed to load tasks for calendar:', err);
      toast.error('Failed to load tasks');
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

  // Compute days for calendar matrix
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Map tasks to dates
  const tasksByDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      try {
        const d = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
        if (isValid(d)) {
          const dateKey = format(d, 'yyyy-MM-dd');
          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          map.get(dateKey).push(task);
        }
      } catch {
        // ignore invalid date
      }
    });
    return map;
  }, [tasks]);

  // Selected date tasks
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateTasks = tasksByDay.get(selectedDateKey) || [];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const handleOpenNewTaskForDate = (date) => {
    const formatted = format(date, 'yyyy-MM-dd');
    setEditingTask({ dueDate: formatted });
    setIsModalOpen(true);
  };

  const handleTaskClick = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading calendar..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Calendar View
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track milestone deadlines and schedule tasks across monthly timelines.
          </p>
        </div>

        {/* Navigation & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Previous Month"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <MdToday className="w-3.5 h-3.5 text-indigo-500" />
              <span>Today</span>
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Next Month"
            >
              <MdChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenNewTaskForDate(selectedDate)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
          >
            <MdAdd className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Grid & Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Monthly Calendar Grid (3 Columns) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 sm:p-6 shadow-sm overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span
                key={d}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const isCurrent = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              const dayTasks = tasksByDay.get(dayKey) || [];

              return (
                <div
                  key={dayKey}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/30'
                      : 'border-slate-100 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  } ${!isCurrent ? 'opacity-40' : ''}`}
                >
                  {/* Day Number and Badges */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isCurrentDay
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 sm:hidden">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks List Pills (Show top 2-3) */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((task) => {
                      const priority = (task.priority || 'medium').toLowerCase();
                      const style = priorityColors[priority] || priorityColors.medium;
                      const isDone = task.status === 'done' || task.status === 'completed';

                      return (
                        <div
                          key={task._id || task.id}
                          onClick={(e) => handleTaskClick(task, e)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                            style.bg
                          } ${isDone ? 'line-through opacity-70' : ''}`}
                          title={task.title}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.length > 2 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold pl-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Side Panel (1 Column) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Selected Day
              </p>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mt-0.5">
                {format(selectedDate, 'EEEE, MMM d')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleOpenNewTaskForDate(selectedDate)}
              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
              title="Add task for this date"
            >
              <MdAdd className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Scheduled Tasks</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                {selectedDateTasks.length}
              </span>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <MdCalendarToday className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No tasks due on this date.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenNewTaskForDate(selectedDate)}
                  className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Add task for {format(selectedDate, 'MMM d')}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {selectedDateTasks.map((task) => {
                  const priority = (task.priority || 'medium').toLowerCase();
                  const style = priorityColors[priority] || priorityColors.medium;
                  const isDone = task.status === 'done' || task.status === 'completed';

                  return (
                    <div
                      key={task._id || task.id}
                      onClick={() => handleTaskClick(task, { stopPropagation: () => {} })}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${style.bg}`}
                        >
                          {task.priority || 'medium'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 capitalize">
                          {task.status?.replace('_', ' ') || 'todo'}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}

                      {task.project && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.project.color || '#6366f1' }}
                          />
                          <span>{task.project.name || 'Project'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal for Create / Edit */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSuccess={() => fetchTasks()}
      />
    </div>
  );
};

export default Calendar;
