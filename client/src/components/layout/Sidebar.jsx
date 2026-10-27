import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MdDashboard,
  MdTaskAlt,
  MdAdd,
  MdFolderOpen,
  MdCalendarMonth,
  MdTimeline,
  MdPerson,
} from 'react-icons/md';

const Sidebar = ({ onOpenCreateTask }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: MdDashboard, end: true },
    { name: 'Tasks', path: '/tasks', icon: MdTaskAlt, end: false },
    { name: 'Projects', path: '/projects', icon: MdFolderOpen, end: false },
    { name: 'Calendar', path: '/calendar', icon: MdCalendarMonth, end: false },
    { name: 'Activity', path: '/activity', icon: MdTimeline, end: false },
    { name: 'Profile', path: '/profile', icon: MdPerson, end: false },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200/80 dark:border-slate-700/80 min-h-[calc(100vh-4rem)] p-4 flex-shrink-0 transition-colors duration-200">
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Quick Action Button */}
        {onOpenCreateTask && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCreateTask}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all duration-200"
          >
            <MdAdd className="w-5 h-5" />
            <span>Create Task</span>
          </motion.button>
        )}

        {/* Navigation Section */}
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
            Overview
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="flex items-center gap-3 w-full"
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        }`}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Tips / Productivity Card */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-slate-700/50 dark:to-slate-800/50 border border-indigo-100/60 dark:border-slate-700">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs mb-1">
              <span className="text-base">💡</span> Pro Tip
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Use the floating timer in the bottom-right corner for Pomodoro focus sessions.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
