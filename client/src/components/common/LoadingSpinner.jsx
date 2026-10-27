import React from 'react';

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
  xl: 'h-16 w-16 border-4',
};

const LoadingSpinner = ({ size = 'md', text = '', fullScreen = false, className = '' }) => {
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size] || sizeMap.md} animate-spin rounded-full border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400`}
        role="status"
        aria-label="loading"
      />
      {text && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
