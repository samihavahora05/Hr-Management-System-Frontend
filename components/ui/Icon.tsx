import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const LayoutDashboard = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const Users = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const User = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const UserCheck = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

export const Clock = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const CalendarDays = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </svg>
);

export const Calendar = CalendarDays;

export const CreditCard = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export const TrendingUp = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const CheckSquare = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const Check = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const BrainCircuit = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M12 13h4M12 9h6M12 17h3" />
  </svg>
);

export const Settings = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const Eye = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOff = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const Download = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const Upload = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const Plus = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const UserPlus = Plus;

export const Search = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const Filter = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const ArrowLeft = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export const CheckCircle2 = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const CheckCircle = CheckCircle2;

export const Megaphone = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="m3 11 18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

export const ChevronRight = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const ChevronLeft = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronDown = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChevronUp = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const FileText = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const ShieldCheck = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const UserMinus = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

export const Briefcase = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const Send = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export const Edit3 = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export const RefreshCw = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

export const LogOut = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const Building2 = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
  </svg>
);

export const X = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const XCircle = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export const Mail = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const Lock = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const AlertCircle = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const HelpCircle = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const Pin = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="17" x2="12" y2="22" />
    <path d="M5 17h14l-1.5-6H6.5L5 17z" />
    <path d="M9 11V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7" />
  </svg>
);

export const Trash2 = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const ListTodo = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="5" width="6" height="6" rx="1" />
    <path d="m3 17 2 2 4-4" />
    <path d="M13 6h8" />
    <path d="M13 12h8" />
    <path d="M13 18h8" />
  </svg>
);

export const LayoutList = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <line x1="14" y1="4" x2="21" y2="4" />
    <line x1="14" y1="9" x2="21" y2="9" />
    <line x1="14" y1="15" x2="21" y2="15" />
    <line x1="14" y1="20" x2="21" y2="20" />
  </svg>
);

export const Kanban = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M6 3v18" />
    <path d="M12 3v18" />
    <path d="M18 3v18" />
    <rect x="3" y="5" width="6" height="5" rx="1" />
    <rect x="9" y="8" width="6" height="7" rx="1" />
    <rect x="15" y="5" width="6" height="10" rx="1" />
  </svg>
);

export const AlertTriangle = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const Tag = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M12 2H2v10l11.29 11.29a1 1 0 0 0 1.42 0l7.58-7.58a1 1 0 0 0 0-1.42L12 2Z" />
    <circle cx="7" cy="7" r="2" />
  </svg>
);

export const Award = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

export const Laptop = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M20 16V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11M2 19h20M12 16v3" />
  </svg>
);

export const DollarSign = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const Bell = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const Target = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const Sparkles = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </svg>
);

export const Bot = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <rect width="18" height="12" x="3" y="6" rx="2" />
    <path d="M9 13h.01M15 13h.01M12 2v4M2 12h1M21 12h1" />
  </svg>
);

export const Printer = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect width="12" height="8" x="6" y="14" />
  </svg>
);

export const Edit = (props: IconProps) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const Pencil = Edit;
