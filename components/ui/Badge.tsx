import React from 'react';

interface BadgeProps {
  status?: string;
  variant?: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export function Badge({ status, variant, size = 'sm', children }: BadgeProps) {
  const normalized = (variant || status || (typeof children === 'string' ? children : '')).toLowerCase();

  const styles: Record<string, string> = {
    // Approved / Present / Success / Green / Low
    present: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    paid: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    low: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',

    // Pending / Late / Warning / Yellow / Medium
    pending: 'bg-amber-50 text-amber-800 border-amber-300/80',
    late: 'bg-amber-50 text-amber-800 border-amber-300/80',
    medium: 'bg-amber-50 text-amber-800 border-amber-300/80',
    in_progress: 'bg-amber-50 text-amber-800 border-amber-300/80',
    processing: 'bg-amber-50 text-amber-800 border-amber-300/80',
    yellow: 'bg-amber-50 text-amber-800 border-amber-300/80',

    // Rejected / Absent / High Risk / Red
    absent: 'bg-rose-50 text-rose-800 border-rose-300/80',
    rejected: 'bg-rose-50 text-rose-800 border-rose-300/80',
    high: 'bg-rose-50 text-rose-800 border-rose-300/80',
    inactive: 'bg-rose-50 text-rose-800 border-rose-300/80',
    red: 'bg-rose-50 text-rose-800 border-rose-300/80',

    // Info / Half Day / On Leave / Blue / Purple
    half_day: 'bg-sky-50 text-sky-800 border-sky-300/80',
    on_leave: 'bg-sky-50 text-sky-800 border-sky-300/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-300/80',
    sky: 'bg-sky-50 text-sky-800 border-sky-300/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-300/80',
    gray: 'bg-slate-100 text-slate-700 border-slate-300/80',
    draft: 'bg-slate-100 text-slate-700 border-slate-300/80',

    default: 'bg-slate-100 text-slate-700 border-slate-300/80',
  };

  const dotColors: Record<string, string> = {
    present: 'bg-emerald-600',
    active: 'bg-emerald-600',
    approved: 'bg-emerald-600',
    completed: 'bg-emerald-600',
    paid: 'bg-emerald-600',
    low: 'bg-emerald-600',
    green: 'bg-emerald-600',

    pending: 'bg-amber-600',
    late: 'bg-amber-600',
    medium: 'bg-amber-600',
    in_progress: 'bg-amber-600',
    processing: 'bg-amber-600',
    yellow: 'bg-amber-600',

    absent: 'bg-rose-600',
    rejected: 'bg-rose-600',
    high: 'bg-rose-600',
    inactive: 'bg-rose-600',
    red: 'bg-rose-600',

    half_day: 'bg-sky-600',
    on_leave: 'bg-sky-600',
    blue: 'bg-sky-600',
    purple: 'bg-purple-600',
    gray: 'bg-slate-500',
    draft: 'bg-slate-500',

    default: 'bg-slate-500',
  };

  const selectedStyle = styles[normalized] || styles.default;
  const selectedDot = dotColors[normalized] || dotColors.default;

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1 text-xs font-semibold'
      : 'px-2.5 py-0.5 text-[11px] font-bold';

  const displayText = children ?? (status ? status.replace('_', ' ') : normalized);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-mono ${sizeClasses} ${selectedStyle} transition-all duration-150`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${selectedDot}`}></span>
      <span>{displayText}</span>
    </span>
  );
}
