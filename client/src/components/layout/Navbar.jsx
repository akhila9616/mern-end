import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MdMenu,
  MdClose,
  MdLogout,
  MdDashboard,
  MdTaskAlt,
  MdAdd,
  MdLightMode,
  MdDarkMode,
  MdFolderOpen,
  MdCalendarMonth,
  MdTimeline,
  MdPerson,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onOpenCreateTask }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/20 text-white font-semibold shadow-sm backdrop-blur-sm'
        : 'text-indigo-100 hover:text-white hover:bg-white/10'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md dark:shadow-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl transform group-hover:scale-110 transition-transform duration-200">
                🚀
              </span>
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                Task<span className="text-indigo-200">Flow</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              <NavLink to="/" end className={navLinkClasses}>
                <MdDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/tasks" className={navLinkClasses}>
                <MdTaskAlt className="w-4 h-4" />
                <span>Tasks</span>
              </NavLink>
              <NavLink to="/projects" className={navLinkClasses}>
                <MdFolderOpen className="w-4 h-4" />
                <span>Projects</span>
              </NavLink>
              <NavLink to="/calendar" className={navLinkClasses}>
                <MdCalendarMonth className="w-4 h-4" />
                <span>Calendar</span>
              </NavLink>
              <NavLink to="/activity" className={navLinkClasses}>
                <MdTimeline className="w-4 h-4" />
                <span>Activity</span>
              </NavLink>
            </nav>
          </div>

          {/* Right Section: Dark Mode Toggle, New Task, User & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-indigo-100 hover:text-white hover:bg-white/10 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <MdLightMode className="w-5 h-5 text-amber-300 animate-spin-slow" />
              ) : (
                <MdDarkMode className="w-5 h-5" />
              )}
            </button>

            {onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all duration-200 border border-white/20 active:scale-95 shadow-sm"
              >
                <MdAdd className="w-4 h-4" />
                <span>New Task</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-2 border-l border-white/20">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="View Profile"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white text-indigo-700 flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white/30">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold leading-tight text-white">
                    {user?.name || 'Account'}
                  </span>
                  <span className="text-[11px] text-indigo-200 leading-none truncate max-w-[110px]">
                    {user?.email || ''}
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition-colors"
                title="Sign out"
              >
                <MdLogout className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Right Controls: Dark Mode Toggle & Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDark ? (
                <MdLightMode className="w-5 h-5 text-amber-300" />
              ) : (
                <MdDarkMode className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-indigo-900/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-1.5 animate-fadeIn">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/tasks"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdTaskAlt className="w-5 h-5" />
            <span>Tasks</span>
          </NavLink>

          <NavLink
            to="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdFolderOpen className="w-5 h-5" />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/calendar"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdCalendarMonth className="w-5 h-5" />
            <span>Calendar</span>
          </NavLink>

          <NavLink
            to="/activity"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdTimeline className="w-5 h-5" />
            <span>Activity</span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? 'bg-white/20 text-white font-semibold' : 'text-indigo-100 hover:bg-white/10'
              }`
            }
          >
            <MdPerson className="w-5 h-5" />
            <span>Profile</span>
          </NavLink>

          {onOpenCreateTask && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateTask();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600/50 hover:bg-indigo-600/80"
            >
              <MdAdd className="w-5 h-5" />
              <span>Create Task</span>
            </button>
          )}

          <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-white text-indigo-700 flex items-center justify-center font-bold text-xs">
                {getInitials(user?.name)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-indigo-200 truncate max-w-[150px]">{user?.email}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/80 hover:bg-rose-600 text-white transition-colors"
            >
              <MdLogout className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
