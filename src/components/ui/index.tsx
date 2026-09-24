import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={twMerge(clsx('bg-card text-card-foreground rounded-xl border border-border shadow-sm', className))}>
      {children}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: 'SAFE' | 'WARNING' | 'NOT_SAFE'; className?: string }) {
  const colors = {
    SAFE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    NOT_SAFE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels = {
    SAFE: 'SAFE',
    WARNING: 'WARNING',
    NOT_SAFE: 'BELOW REQUIRED',
  };

  return (
    <span className={twMerge(clsx('px-2.5 py-1 text-xs font-semibold rounded-full', colors[status], className))}>
      {labels[status]}
    </span>
  );
}

export function ProgressBar({ percentage, status, className }: { percentage: number; status: 'SAFE' | 'WARNING' | 'NOT_SAFE'; className?: string }) {
  const colors = {
    SAFE: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    NOT_SAFE: 'bg-red-500',
  };

  return (
    <div className={twMerge(clsx('w-full bg-secondary rounded-full h-2.5', className))}>
      <div
        className={`h-2.5 rounded-full ${colors[status]}`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      ></div>
    </div>
  );
}

export function ProgressCircle({ percentage, status, size = 120, strokeWidth = 10 }: { percentage: number; status: 'SAFE' | 'WARNING' | 'NOT_SAFE'; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    SAFE: 'text-green-500',
    WARNING: 'text-yellow-500',
    NOT_SAFE: 'text-red-500',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-secondary"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colors[status]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{percentage.toFixed(2)}%</span>
      </div>
    </div>
  );
}
