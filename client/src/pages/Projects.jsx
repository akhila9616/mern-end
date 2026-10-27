import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MdFolderOpen,
  MdAdd,
  MdEdit,
  MdDelete,
  MdTaskAlt,
  MdArrowForward,
  MdFolder,
  MdRocketLaunch,
  MdStar,
  MdWork,
  MdCode,
  MdPalette,
  MdLightbulb,
  MdBookmark,
} from 'react-icons/md';
import api from '../utils/api';
import ProjectModal from '../components/projects/ProjectModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const ICON_MAP = {
  folder: MdFolder,
  rocket: MdRocketLaunch,
  star: MdStar,
  work: MdWork,
  code: MdCode,
  design: MdPalette,
  idea: MdLightbulb,
  bookmark: MdBookmark,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
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
      console.error('Failed to fetch projects:', err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project, e) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (project, e) => {
    e.stopPropagation();
    const projectId = project._id || project.id;
    if (!window.confirm(`Are you sure you want to delete "${project.name}"?`)) return;

    const previousProjects = [...projects];
    setProjects((prev) => prev.filter((p) => (p._id || p.id) !== projectId));

    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted');
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project');
      setProjects(previousProjects);
    }
  };

  const handleCardClick = (project) => {
    const projectId = project._id || project.id;
    navigate(`/tasks?project=${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading projects..." />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12"
    >
      {/* Page Header */}
      <motion.div
        variants={cardVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Projects
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your workspace initiatives and group related tasks together.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
        >
          <MdAdd className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </motion.div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <EmptyState
          icon={MdFolderOpen}
          title="No projects yet"
          description="Create your first project to organize tasks, track milestones, and streamline your workflow."
          actionText="Create Project"
          onAction={handleOpenCreate}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {projects.map((project) => {
            const projectId = project._id || project.id;
            const projectColor = project.color || '#6366f1';
            const IconComponent = ICON_MAP[project.icon] || MdFolderOpen;
            const taskCount =
              project.taskCount ??
              project.tasksCount ??
              (Array.isArray(project.tasks) ? project.tasks.length : 0);

            return (
              <motion.div
                key={projectId}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleCardClick(project)}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Top colored accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-all group-hover:h-2"
                  style={{ backgroundColor: projectColor }}
                />

                <div>
                  {/* Header: Icon, Name & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: projectColor }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                          <MdTaskAlt className="w-3.5 h-3.5" />
                          <span>
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(project, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Project"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(project, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                        title="Delete Project"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>

                {/* Footer: View Tasks Link */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span>View Project Board</span>
                  <MdArrowForward className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSuccess={() => fetchProjects()}
      />
    </motion.div>
  );
};

export default Projects;
