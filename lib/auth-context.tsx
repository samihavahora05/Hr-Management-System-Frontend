'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from './api';

export function getRoleDefaultRoute(role?: string): string {
  if (!role) return '/login';
  const r = strtolower(role);
  switch (r) {
    case 'admin':
      return '/admin/dashboard';
    case 'hr':
      return '/hr/dashboard';
    case 'manager':
    case 'company_manager':
      return '/manager/dashboard';
    case 'team_leader':
    case 'tl':
    case 'team_lead':
      return '/team-leader/dashboard';
    case 'employee':
      return '/employee/dashboard';
    default:
      return '/login';
  }
}

function strtolower(str: string): string {
  return str ? str.toLowerCase() : '';
}

export function canAccessNamespace(
  role: string | undefined,
  namespace: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee'
): boolean {
  if (!role) return false;
  const r = strtolower(role);
  if (r === 'admin') return true;
  if (r === 'hr') return namespace === 'hr' || namespace === 'employee';
  if (r === 'manager' || r === 'company_manager') return namespace === 'manager' || namespace === 'team_leader' || namespace === 'employee';
  if (r === 'team_leader' || r === 'tl' || r === 'team_lead') return namespace === 'team_leader' || namespace === 'employee';
  return r === namespace;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  employee_code?: string;
  role: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
  role_display?: string;
  department?: string;
  designation?: string;
  organization?: string;
  organization_id?: number;
  avatar?: string;
  base_salary?: number;
  joining_date?: string;
  status?: string;
  phone?: string;
  manager_id?: number | null;
  manager_name?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isHR: boolean;
  isCompanyManager: boolean;
  isTeamLeader: boolean;
  isEmployee: boolean;
  defaultRoute: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isAdmin: false,
  isHR: false,
  isCompanyManager: false,
  isTeamLeader: false,
  isEmployee: false,
  defaultRoute: '/login',
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);

          const res = await fetchApi('/auth/me');
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (e: any) {
          // Only clear session if backend explicitly rejects token with 401 / Unauthenticated
          if (e?.message?.includes('Unauthenticated') || e?.message?.includes('Invalid') || e?.message?.includes('401')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, userData: UserProfile) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await fetchApi('/auth/me');
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const role = strtolower(user?.role || '');
  const isAdmin = role === 'admin';
  const isHR = role === 'hr';
  const isCompanyManager = role === 'manager' || role === 'company_manager';
  const isTeamLeader = role === 'team_leader' || role === 'tl' || role === 'team_lead';
  const isEmployee = role === 'employee';
  const defaultRoute = user ? getRoleDefaultRoute(role) : '/login';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isAdmin,
        isHR,
        isCompanyManager,
        isTeamLeader,
        isEmployee,
        defaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
