import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSwapHoriz,
  MdComment,
  MdCheckCircle,
  MdTimeline,
  MdRefresh,
} from 'react-icons/md';
import { format, isToday, isYesterday, parseISO, isValid, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const ACTION_CONFIG = {
  created: {
    icon: MdAdd,
    bg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 ring-blue-500/20',
    border: 'border-blue-500',
    label: 'Created',
  },
  updated: {
    icon: MdEdit,
    bg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 ring-amber-500/20',
    border: 'border-amber-500',
    label: 'Updated',
  },
  deleted: {
    icon: MdDelete,
    bg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 ring-rose-500/20',
    border: 'border-rose-500',
    label: 'Deleted',
  },
  status_changed: {
    icon: MdSwapHoriz,
    bg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 ring-indigo-500/20',
    border: 'border-indigo-500',
    label: 'Moved',
  },
  comment_added: {
    icon: MdComment,
    bg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 ring-purple-500/20',
    border: 'border-purple-500',
    label: 'Comment',
  },
  completed: {
    icon: MdCheckCircle,
    bg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20',
    border: 'border-emerald-500',
    label: 'Completed',
  },
};

const normalizeAction = (actionStr = '') => {
  const act = actionStr.toLowerCase().replace(/[- ]/g, '_');
  if (act.includes('complete') || act.includes('done')) return 'completed';
  if (act.includes('comment')) return 'comment_added';
  if (act.includes('status') || act.includes('move')) return 'status_changed';
  if (act.includes('create') || act.includes('add')) return 'created';
  if (act.includes('delete') || act.includes('remove')) return 'deleted';
  if (act.includes('update') || act.includes('edit')) return 'updated';
  return 'updated';
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

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activities');
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.activities)
        ? data.activities
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setActivities(list);
    } catch (err) {
      console.error('Failed to load activities:', err);
      toast.error('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    const groups = {};

    activities.forEach((item) => {
      const rawDate = item.createdAt || item.timestamp || item.date;
      let dateObj = new Date();
      if (rawDate) {
        try {
          const parsed = typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate);
          if (isValid(parsed)) dateObj = parsed;
        } catch {
          dateObj = new Date();
        }
      }

      let dateHeader = 'Recent';
      if (isToday(dateObj)) {
        dateHeader = 'Today';
      } else if (isYesterday(dateObj)) {
        dateHeader = 'Yesterday';
      } else {
        dateHeader = format(dateObj, 'MMMM d, yyyy');
      }

      if (!groups[dateHeader]) {
        groups[dateHeader] = [];
      }
      groups[dateHeader].push({ ...item, _dateObj: dateObj });
    });

    return groups;
  }, [activities]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading activity history..." />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 max-w-4xl mx-auto"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Activity Timeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {activities.length} {activities.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit trail of actions, updates, status transitions, and team comments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActivities}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all active:scale-95"
        >
          <MdRefresh className="w-4 h-4" />
          <span>Refresh Feed</span>
        </button>
      </motion.div>

      {/* Activities Timeline */}
      {activities.length === 0 ? (
        <EmptyState
          icon={MdTimeline}
          title="No activity recorded yet"
          description="When you create, update, or comment on tasks, your chronological audit feed will appear here."
          actionText=""
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <motion.div key={dateGroup} variants={itemVariants} className="space-y-4">
              {/* Group Date Header */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs">
                  {dateGroup}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Group Items Vertical List */}
              <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:top-2 before:bottom-2 before:left-3 sm:before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {items.map((activity, index) => {
                  const actionKey = normalizeAction(
                    activity.action || activity.actionType || activity.type || ''
                  );
                  const config = ACTION_CONFIG[actionKey] || ACTION_CONFIG.updated;
                  const Icon = config.icon;

                  let timeAgo = 'Just now';
                  if (activity._dateObj) {
                    try {
                      timeAgo = formatDistanceToNow(activity._dateObj, { addSuffix: true });
                    } catch {
                      timeAgo = '';
                    }
                  }

                  const actorName =
                    activity.user?.name || activity.userName || activity.actor || 'You';

                  return (
                    <motion.div
                      key={activity._id || activity.id || `${dateGroup}-${index}`}
                      variants={itemVariants}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                      className="relative flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Timeline dot & icon */}
                      <div
                        className={`absolute -left-[30px] sm:-left-[38px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${config.bg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {actorName}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full capitalize ${config.bg}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400">
                            {timeAgo}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {activity.description ||
                            activity.details ||
                            activity.message ||
                            'Performed an action on a task'}
                        </p>

                        {/* Optional Task Title preview */}
                        {activity.task && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                            <span className="font-semibold text-slate-700 dark:text-white">
                              Task:
                            </span>
                            <span className="truncate max-w-xs">
                              {typeof activity.task === 'string'
                                ? activity.task
                                : activity.task.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ActivityLog;
