'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, canAccessNamespace, getRoleDefaultRoute } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { fetchApi } from '@/lib/api';
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
  Sparkles,
  Receipt,
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
      { label: 'AI Assistant', href: '/admin/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Users & Master', href: '/admin/users', icon: Users },
      { label: 'Document Vault', href: '/admin/documents', icon: FileText },
      { label: 'Departments', href: '/admin/departments', icon: Building2 },
      { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { label: 'Payroll & Slips', href: '/admin/payroll', icon: CreditCard },
      { label: 'Tasks', href: '/admin/tasks', icon: ListTodo },
      { label: 'Performance', href: '/admin/performance', icon: TrendingUp },
      { label: 'Attendance', href: '/admin/attendance', icon: Clock },
      { label: 'Leave', href: '/admin/leave', icon: CalendarDays },
      { label: 'Recruitment ATS', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Assets', href: '/assets', icon: Building2 },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },

      { label: 'Roles', href: '/admin/roles', icon: ShieldCheck },
      { label: 'Permissions', href: '/admin/permissions', icon: CheckSquare },
      { label: 'Organization', href: '/admin/organization', icon: Building2 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
      { label: 'My Profile', href: '/profile', icon: User },
    ],
    hr: [
      { label: 'Dashboard', href: '/hr/dashboard', icon: LayoutDashboard },
      { label: 'HR Assistant', href: '/hr/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Employees', href: '/hr/employees', icon: Users },
      { label: 'Document Vault', href: '/hr/documents', icon: FileText },
      { label: 'Recruitment & ATS', href: '/hr/recruitment', icon: UserCheck },
      { label: 'Tasks', href: '/hr/tasks', icon: ListTodo },
      { label: 'Attendance', href: '/hr/attendance', icon: Clock },
      { label: 'Leave', href: '/hr/leave', icon: CalendarDays },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Asset Register', href: '/assets', icon: Building2 },
      { label: 'HR Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Reports', href: '/hr/reports', icon: FileText },
      { label: 'Announcements', href: '/hr/announcements', icon: Megaphone },
      { label: 'My Profile', href: '/profile', icon: User },
    ],
    manager: [
      { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
      { label: 'Team Assistant', href: '/manager/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'Team Leaders', href: '/manager/team', icon: Users },
      { label: 'Employees', href: '/manager/employees', icon: UserCheck },
      { label: 'Team Tasks', href: '/manager/tasks', icon: ListTodo },
      { label: 'Vault & Reports', href: '/manager/documents', icon: FileText },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Reports', href: '/manager/reports', icon: FileText },
      { label: 'My Profile', href: '/profile', icon: User },
    ],
    team_leader: [
      { label: 'Dashboard', href: '/team-leader/dashboard', icon: LayoutDashboard },
      { label: 'Team Assistant', href: '/team-leader/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'My Team', href: '/team-leader/team', icon: Users },
      { label: 'Tasks', href: '/team-leader/tasks', icon: ListTodo },
      { label: 'Vault & Reports', href: '/team-leader/documents', icon: FileText },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'Profile', href: '/profile', icon: User },
    ],
    employee: [
      { label: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
      { label: 'AI Assistant', href: '/employee/assistant', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Megaphone },
      { label: 'My Payslips', href: '/employee/payroll', icon: CreditCard },
      { label: 'My Tasks', href: '/employee/tasks', icon: ListTodo },
      { label: 'Attendance', href: '/employee/attendance', icon: Clock },
      { label: 'Leave', href: '/employee/leave', icon: CalendarDays },
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Timesheets', href: '/timesheets', icon: Clock },
      { label: 'My Assets', href: '/assets', icon: Building2 },
      { label: 'Helpdesk', href: '/helpdesk', icon: FileText },
      { label: 'My Vault', href: '/employee/documents', icon: FileText },
      { label: 'Profile', href: '/profile', icon: User },
    ],
  };

  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!token || !user) return;
    let isMounted = true;
    const fetchUnreadNotifications = async () => {
      try {
        const res = await fetchApi('/notifications');
        if (isMounted && typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }
      } catch (err) {
        // Silently ignore background polling errors
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname, user, token]);

  const currentMenuItems = menuItemsMap[activeNamespace] || menuItemsMap.employee;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside
      className={`bg-white border-r border-[#c3c6cf] text-slate-700 flex flex-col h-screen sticky top-0 shrink-0 z-20 transition-all duration-200 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* BRAND & PORTAL HEADER */}
      <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
        <Link
          href={`/${activeNamespace}/dashboard`}
          className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
        >
          {isCollapsed ? (
            <img
              src={user?.organization_icon_logo || user?.organization_logo || '/images/Boxxlogo.png'}
              alt={user?.organization || 'Company Logo'}
              className="w-8 h-8 object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/Boxxlogo.png';
              }}
            />
          ) : (
            <div className="flex flex-col min-w-0">
              <img
                src={user?.organization_logo || '/images/logoblue.png'}
                alt={user?.organization || 'Company Logo'}
                className="h-7 w-auto max-w-[170px] object-contain object-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logoblue.png';
                }}
              />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 truncate">
                {portalTitleMap[activeNamespace]}
              </p>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebarCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
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
          const isNotificationItem = item.href === '/notifications';
          const hasUnread = isNotificationItem && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? (hasUnread ? `${item.label} (${unreadCount} unread)` : item.label) : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group relative ${isActive
                ? 'bg-slate-100 text-[#0f365e] font-bold border border-[#c3c6cf] shadow-2xs'
                : 'text-slate-600 hover:text-[#0f365e] hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#0f365e]' : 'text-slate-400 group-hover:text-[#0f365e]'}`} />
                  {isCollapsed && hasUnread && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && hasUnread && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] text-[10px] font-black text-white bg-rose-600 rounded-full shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
