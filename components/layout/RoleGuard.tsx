'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, getRoleDefaultRoute, canAccessNamespace } from '@/lib/auth-context';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'hr' | 'manager' | 'team_leader' | 'employee'>;
  requiredNamespace?: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
}

export function RoleGuard({ children, allowedRoles, requiredNamespace }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Determine namespace from props or URL pathname
    let targetNamespace = requiredNamespace;
    if (!targetNamespace) {
      if (pathname.startsWith('/admin')) targetNamespace = 'admin';
      else if (pathname.startsWith('/hr')) targetNamespace = 'hr';
      else if (pathname.startsWith('/manager')) targetNamespace = 'manager';
      else if (pathname.startsWith('/team-leader')) targetNamespace = 'team_leader';
      else if (pathname.startsWith('/employee')) targetNamespace = 'employee';
    }

    if (targetNamespace && !canAccessNamespace(user.role, targetNamespace)) {
      const defaultRoute = getRoleDefaultRoute(user.role);
      router.replace(defaultRoute);
    }
  }, [user, loading, pathname, requiredNamespace, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Verifying Security Credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  let currentNamespace = requiredNamespace;
  if (!currentNamespace) {
    if (pathname.startsWith('/admin')) currentNamespace = 'admin';
    else if (pathname.startsWith('/hr')) currentNamespace = 'hr';
    else if (pathname.startsWith('/manager')) currentNamespace = 'manager';
    else if (pathname.startsWith('/team-leader')) currentNamespace = 'team_leader';
    else if (pathname.startsWith('/employee')) currentNamespace = 'employee';
  }

  if (currentNamespace && !canAccessNamespace(user.role, currentNamespace)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            🔒
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-600 mb-6">
            Your role (<strong className="capitalize">{user.role}</strong>) does not have authorization to view the <strong className="uppercase">{currentNamespace}</strong> portal.
          </p>
          <button
            onClick={() => router.replace(getRoleDefaultRoute(user.role))}
            className="w-full py-2.5 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Return to Authorized Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
