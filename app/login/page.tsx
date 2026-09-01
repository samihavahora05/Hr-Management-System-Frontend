'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleDefaultRoute } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      login(data.token, data.user);
      router.push(getRoleDefaultRoute(data.user?.role));
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-900 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header / Branding */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <div className="flex items-center gap-2">
          <img
            src="/images/logoblue.png"
            alt="BlueBoxx DA Pvt. Ltd."
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </div>
        <span className="text-[11px] font-medium text-slate-400">v4.2 Enterprise</span>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/40">
          {/* Header */}
          <div className="mb-6 text-left">
            <h1 className="font-display text-[2.1rem] sm:text-[2.25rem] font-semibold text-slate-900 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Enter your details to sign in to your portal.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="name@blueboxx.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0f365e] focus:ring-[#0f365e] cursor-pointer"
                />
                <span>Remember for 30 days</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setToastMessage('Password reset link sent to your registered email.');
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="font-semibold text-[#0f365e] hover:underline underline-offset-2 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0f365e] hover:bg-[#164677] active:scale-[0.99] text-white text-sm font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Security / Copyright Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected by enterprise 256-bit SSL encryption</span>
        </div>
        <p className="text-[10px] text-slate-400">
          © 2026 BlueBoxx Business Solutions Pvt Ltd.
        </p>
      </footer>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </div>
  );
}