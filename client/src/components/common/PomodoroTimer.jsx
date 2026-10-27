import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdTimer,
  MdPlayArrow,
  MdPause,
  MdRefresh,
  MdClose,
  MdLocalCafe,
  MdBedtime,
  MdSelfImprovement,
} from 'react-icons/md';

const MODES = {
  focus: { label: 'Focus', minutes: 25, seconds: 25 * 60, icon: MdSelfImprovement, color: '#6366f1' },
  short: { label: 'Short Break', minutes: 5, seconds: 5 * 60, icon: MdLocalCafe, color: '#10b981' },
  long: { label: 'Long Break', minutes: 15, seconds: 15 * 60, icon: MdBedtime, color: '#8b5cf6' },
};

const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // AudioContext might be blocked until user interaction
    console.warn('Audio notification unavailable:', e);
  }
};

const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef(null);

  // Switch mode
  const handleSelectMode = (modeKey) => {
    setActiveMode(modeKey);
    setIsRunning(false);
    setTimeLeft(MODES[modeKey].seconds);
  };

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playBeep();
            if (activeMode === 'focus') {
              setCompletedSessions((s) => s + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, activeMode]);

  const handleTogglePlay = () => {
    if (timeLeft === 0) {
      setTimeLeft(MODES[activeMode].seconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[activeMode].seconds);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Progress calculation
  const totalSeconds = MODES[activeMode].seconds;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3.5 rounded-full shadow-xl flex items-center justify-center transition-all ${
          isOpen
            ? 'bg-slate-800 text-white dark:bg-slate-700'
            : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
        }`}
        title="Pomodoro Focus Timer"
      >
        {isOpen ? <MdClose className="w-6 h-6" /> : <MdTimer className="w-6 h-6" />}

        {/* Running animation indicator badge */}
        {isRunning && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white items-center justify-center">
              ●
            </span>
          </span>
        )}
      </motion.button>

      {/* Floating Panel Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-700 p-5 overflow-hidden transition-colors duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍅</span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pomodoro Focus</h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                {completedSessions} {completedSessions === 1 ? 'cycle' : 'cycles'}
              </span>
            </div>

            {/* Mode Selectors */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl mb-5">
              {Object.entries(MODES).map(([key, config]) => {
                const isSelected = activeMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectMode(key)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {config.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Circular Progress Ring */}
            <div className="relative flex items-center justify-center my-3">
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-700"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={MODES[activeMode].color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 0.5s ease',
                  }}
                />
              </svg>

              {/* Time display */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white font-mono">
                  {timeFormatted}
                </span>
                <span className="text-[11px] font-medium text-slate-400 capitalize mt-0.5">
                  {MODES[activeMode].label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80">
              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Reset timer"
              >
                <MdRefresh className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <MdPause className="w-5 h-5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <MdPlayArrow className="w-5 h-5" />
                    <span>{timeLeft === 0 ? 'Restart' : 'Start'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PomodoroTimer;
