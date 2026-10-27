import React from 'react';
import {
  MdSearch,
  MdFilterList,
  MdClear,
  MdClose,
  MdViewKanban,
  MdFormatListBulleted,
  MdFolderOpen,
} from 'react-icons/md';

const TaskFilters = ({
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  priorityFilter = 'all',
  onPriorityFilterChange,
  projectFilter = 'all',
  onProjectFilterChange,
  projects = [],
  viewMode = 'kanban',
  onViewModeChange,
  onClearFilters,
}) => {
  const isFiltered =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-sm mb-6 transition-all duration-200">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MdSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title, description, or tags..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50 dark:bg-slate-700/60 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={projectFilter}
              onChange={(e) => onProjectFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MdFolderOpen className="w-4 h-4" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MdFilterList className="w-4 h-4" />
            </div>
          </div>

          {/* Priority Dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 pl-3.5 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <MdFilterList className="w-4 h-4" />
            </div>
          </div>

          {/* View Mode Toggle (Kanban vs List) */}
          {onViewModeChange && (
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-700 p-0.5 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => onViewModeChange('kanban')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Kanban Board View"
              >
                <MdViewKanban className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Table List View"
              >
                <MdFormatListBulleted className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              title="Reset all filters"
            >
              <MdClear className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;
