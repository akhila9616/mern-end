import React from 'react';
import { motion } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';
import {
  MdCalendarToday,
  MdEdit,
  MdDelete,
  MdLabelOutline,
  MdPlaylistAddCheck,
  MdChatBubbleOutline,
  MdFolderOpen,
  MdWarningAmber,
} from 'react-icons/md';

const priorityConfig = {
  low: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    label: 'Low',
  },
  medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    label: 'Medium',
  },
  high: {
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    label: 'High',
  },
};

const statusConfig = {
  todo: {
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    label: 'To Do',
  },
  in_progress: {
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    label: 'In Progress',
  },
  'in-progress': {
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    label: 'In Progress',
  },
  done: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    label: 'Done',
  },
  completed: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    label: 'Done',
  },
};

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  isDragging = false,
  innerRef,
  draggableProps,
  dragHandleProps,
}) => {
  const priorityKey = (task.priority || 'medium').toLowerCase();
  const priorityStyle = priorityConfig[priorityKey] || priorityConfig.medium;

  const statusKey = (task.status || 'todo').toLowerCase();
  const statusStyle = statusConfig[statusKey] || statusConfig.todo;

  const formattedDate = () => {
    if (!task.dueDate) return null;
    try {
      const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return null;
    }
    return null;
  };

  const dueDateStr = formattedDate();

  // Check if task is overdue
  const isOverdue = (() => {
    if (!task.dueDate) return false;
    const st = (task.status || '').toLowerCase();
    if (st === 'done' || st === 'completed') return false;
    try {
      const due = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isValid(due) && due < today;
    } catch {
      return false;
    }
  })();

  // Subtasks calculation
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Comments count
  const commentCount =
    typeof task.commentCount === 'number'
      ? task.commentCount
      : Array.isArray(task.comments)
      ? task.comments.length
      : 0;

  // Project info
  const project = task.project && typeof task.project === 'object' ? task.project : null;

  // Normalize tags
  const tagsList = Array.isArray(task.tags)
    ? task.tags.filter(Boolean)
    : typeof task.tags === 'string'
    ? task.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all select-none ${
        priorityStyle.border
      } border-l-4 ${isDragging ? 'shadow-xl ring-2 ring-indigo-500/50 rotate-1' : ''}`}
    >
      {/* Top Header: Badges & Actions */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityStyle.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
            {priorityStyle.label}
          </span>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle.badge}`}
          >
            {statusStyle.label}
          </span>

          {/* Overdue indicator */}
          {isOverdue && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
              title="This task is overdue"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Overdue</span>
            </span>
          )}
        </div>

        {/* Hover Actions (Edit & Delete) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
              title="Edit Task"
            >
              <MdEdit className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id || task.id);
              }}
              className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
              title="Delete Task"
            >
              <MdDelete className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project badge if attached */}
      {project && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color || '#6366f1' }}
          />
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {project.name}
          </span>
        </div>
      )}

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              <MdPlaylistAddCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            </span>
            <span className="text-[10px] text-slate-400">{subtaskPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${subtaskPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {tagsList.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {tagsList.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <MdLabelOutline className="w-3 h-3 text-slate-400" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due Date & Comments Counter */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          {dueDateStr ? (
            <span
              className={`inline-flex items-center gap-1 ${
                isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
              }`}
            >
              <MdCalendarToday className="w-3.5 h-3.5" />
              <span>{dueDateStr}</span>
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-600 italic">No due date</span>
          )}
        </div>

        {commentCount > 0 && (
          <span
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            title={`${commentCount} comments`}
          >
            <MdChatBubbleOutline className="w-3.5 h-3.5" />
            <span>{commentCount}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;
