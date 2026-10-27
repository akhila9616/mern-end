import React from 'react';
import { MdInbox, MdAdd } from 'react-icons/md';

const EmptyState = ({
  icon: Icon = MdInbox,
  title = 'No tasks found',
  description = 'Get started by creating your first task or adjust your search filters.',
  actionText = 'Create Task',
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-4 ring-8 ring-indigo-50/50 dark:ring-indigo-950/30">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {onAction && actionText && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
        >
          <MdAdd className="w-5 h-5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
