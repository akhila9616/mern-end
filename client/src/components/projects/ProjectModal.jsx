import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdClose,
  MdSave,
  MdFolder,
  MdRocketLaunch,
  MdStar,
  MdWork,
  MdCode,
  MdPalette,
  MdLightbulb,
  MdBookmark,
  MdFolderOpen,
} from 'react-icons/md';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
];

const PRESET_ICONS = [
  { id: 'folder', name: 'Folder', icon: MdFolder },
  { id: 'rocket', name: 'Rocket', icon: MdRocketLaunch },
  { id: 'star', name: 'Star', icon: MdStar },
  { id: 'work', name: 'Work', icon: MdWork },
  { id: 'code', name: 'Code', icon: MdCode },
  { id: 'design', name: 'Design', icon: MdPalette },
  { id: 'idea', name: 'Idea', icon: MdLightbulb },
  { id: 'bookmark', name: 'Bookmark', icon: MdBookmark },
];

const initialForm = {
  name: '',
  description: '',
  color: '#6366f1',
  icon: 'folder',
};

const ProjectModal = ({ isOpen, onClose, project = null, onSuccess }) => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = Boolean(project && (project._id || project.id));

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        color: project.color || '#6366f1',
        icon: project.icon || 'folder',
      });
    } else {
      setFormData(initialForm);
    }
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Project name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
      };

      let res;
      const projectId = project?._id || project?.id;
      if (isEdit) {
        res = await api.put(`/projects/${projectId}`, payload);
        toast.success('Project updated successfully!');
      } else {
        res = await api.post('/projects', payload);
        toast.success('Project created successfully!');
      }

      const saved = res.data?.project || res.data;
      if (onSuccess) {
        onSuccess(saved);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
      const msg = err.response?.data?.message || 'Failed to save project.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-10 my-8 transition-colors duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <span
                  className="p-1.5 rounded-lg text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  <MdFolderOpen className="w-5 h-5" />
                </span>
                {isEdit ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Website Redesign, Mobile App v2"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 dark:text-white dark:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    errors.name
                      ? 'border-rose-300 dark:border-rose-500 bg-rose-50/30'
                      : 'border-slate-200 dark:border-slate-600 bg-white hover:border-slate-300 dark:hover:border-slate-500 focus:border-indigo-500'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Goals, team notes, and summary..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

              {/* Color Picker Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Theme Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((color) => {
                    const isSelected = formData.color.toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                          isSelected ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Project Icon
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PRESET_ICONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = formData.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, icon: item.id }))}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
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
                  <span>{isEdit ? 'Update Project' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
