import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TaskModal from '../tasks/TaskModal';
import PomodoroTimer from '../common/PomodoroTimer';

const Layout = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenCreateTask = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTaskSaved = (newTask) => {
    // Notify active page if listening
    window.dispatchEvent(new CustomEvent('taskflow:refresh-tasks', { detail: newTask }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onOpenCreateTask={handleOpenCreateTask} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar onOpenCreateTask={handleOpenCreateTask} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children || <Outlet context={{ openCreateTask: handleOpenCreateTask }} />}
        </main>
      </div>

      {/* Global Pomodoro Timer Widget */}
      <PomodoroTimer />

      {/* Global Task Creation Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
};

export default Layout;
