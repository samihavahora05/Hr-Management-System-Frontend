'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, canAccessNamespace, getRoleDefaultRoute } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  TrendingUp,
  CheckSquare,
  Settings,
  ChevronRight,
  Plus,
  ShieldCheck,
  Building2,
  FileText,
  UserCheck,
  Megaphone,
  User,
  LogOut,
  ListTodo,
} from '@/components/ui/Icon';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebarCollapse } = useTheme();
  const [showPortalMenu, setShowPortalMenu] = useState(false);

  const role = user?.role || 'employee';

  // Determine current active namespace from URL pathname
  let activeNamespace: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee' = 'employee';
  if (pathname.startsWith('/admin')) activeNamespace = 'admin';
  else if (pathname.startsWith('/hr')) activeNamespace = 'hr';
  else if (pathname.startsWith('/manager')) activeNamespace = 'manager';
  else if (pathname.startsWith('/team-leader')) activeNamespace = 'team_leader';
  else if (pathname.startsWith('/employee')) activeNamespace = 'employee';
  else {
    activeNamespace = (role as any) || 'employee';
  }

  type PortalId = 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
  const allPortals: Array<{ id: PortalId; label: string; href: string }> = [
    { id: 'admin', label: 'Admin Portal', href: '/admin/dashboard' },
    { id: 'hr', label: 'HR Portal', href: '/hr/dashboard' },
    { id: 'manager', label: 'Company Manager Portal', href: '/manager/dashboard' },
    { id: 'team_leader', label: 'Team Leader Portal', href: '/team-leader/dashboard' },
    { id: 'employee', label: 'Employee Portal', href: '/employee/dashboard' },
  ];
  const availablePortals = allPortals.filter((p) => canAccessNamespace(role, p.id));

  const portalTitleMap = {
    admin: 'ADMIN PORTAL',
    hr: role === 'admin' ? 'ADMIN PORTAL' : 'HR PORTAL',
    manager: role === 'admin' ? 'ADMIN PORTAL' : 'COMPANY MANAGER PORTAL',
    team_leader: role === 'admin' ? 'ADMIN PORTAL' : 'TEAM LEADER PORTAL',
    employee: role === 'admin' ? 'ADMIN PORTAL' : 'EMPLOYEE PORTAL',
  };

  // Namespace specific navigation menus
  const menuItemsMap = {
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Users & Master', href: '/admin/users', icon: Users },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
      { label: 'Tasks', href: '/admin/tasks', icon: ListTodo },
      { label: 'Performance', href: '/admin/performance', icon: TrendingUp },
      { label: 'Attendance', href: '/admin/attendance', icon: Clock },
      { label: 'Leave', href: '/admin/leave', icon: CalendarDays },
      { label: 'Recruitment ATS', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Assets', href: '/assets', icon: Building2 },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Roles', href: '/admin/roles', icon: ShieldCheck },
      { label: 'Permissions', href: '/admin/permissions', icon: CheckSquare },
      { label: 'Organization', href: '/admin/organization', icon: Building2 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    ],
    hr: [
      { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Recruitment & ATS', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Tasks', href: '/hr/tasks', icon: ListTodo },
      { label: 'Attendance', href: '/hr/attendance', icon: Clock },
      { label: 'Leave', href: '/hr/leave', icon: CalendarDays },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Asset Register', href: '/assets', icon: Building2 },
      { label: 'HR Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Reports', href: '/hr/reports', icon: FileText },
      { label: 'Announcements', href: '/hr/announcements', icon: Megaphone },
    ],
    manager: [
      { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
      { label: 'Team Leaders', href: '/manager/team', icon: Users },
      { label: 'Employees', href: '/manager/employees', icon: UserCheck },
      { label: 'Team Tasks', href: '/manager/tasks', icon: ListTodo },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Reports', href: '/manager/reports', icon: FileText },
    ],
    team_leader: [
      { label: 'Dashboard', href: '/team-leader/dashboard', icon: LayoutDashboard },
      { label: 'My Team', href: '/team-leader/team', icon: Users },
      { label: 'Tasks', href: '/team-leader/tasks', icon: ListTodo },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Profile', href: '/team-leader/profile', icon: User },
    ],
    employee: [
      { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
      { label: 'My Tasks', href: '/employee/tasks', icon: ListTodo },
      { label: 'Attendance', href: '/employee/attendance', icon: Clock },
      { label: 'Leave', href: '/employee/leave', icon: CalendarDays },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'My Assets', href: '/assets', icon: Building2 },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'My Vault', href: '/employee/documents', icon: FileText },
      { label: 'Profile', href: '/employee/profile', icon: User },
    ],
  };

  const currentMenuItems = menuItemsMap[activeNamespace] || menuItemsMap.employee;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={`bg-white border-r border-[#c3c6cf] text-slate-700 flex flex-col h-screen sticky top-0 shrink-0 z-20 transition-all duration-200 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* BRAND & PORTAL HEADER */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0f365e] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
            C
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-extrabold text-[#0f365e] text-lg tracking-tight leading-none">
                CorpHR
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                {portalTitleMap[activeNamespace]}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebarCollapse}
          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* QUICK NEW LEAVE REQUEST BUTTON FOR EMPLOYEE / MANAGER / HR */}
      {!isCollapsed && activeNamespace !== 'admin' && (
        <div className="px-4 pt-4 pb-2">
          <Link
            href={`/${activeNamespace}/leave`}
            className="w-full py-2.5 px-4 bg-[#0f365e] hover:bg-[#164677] active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </Link>
        </div>
      )}

      {/* NAVIGATION MENU ITEMS */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {currentMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-slate-100 text-[#0f365e] font-bold border border-[#c3c6cf] shadow-2xs'
                  : 'text-slate-600 hover:text-[#0f365e] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0f365e]' : 'text-slate-400 group-hover:text-[#0f365e]'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* USER FOOTER & LOGOUT DRAWER */}
      <div className="p-3 border-t border-[#c3c6cf] bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 p-1 rounded-lg min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-[#0f365e] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
            {user?.name ? user.name[0] : 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[9px] text-slate-500 truncate capitalize">{user?.role_display || user?.role || 'Employee'}</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
