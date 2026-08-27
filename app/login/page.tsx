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
  Building2,
} from '@/components/ui/Icon';
import { Toast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        body: JSON.stringify({ email, password }),
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-slate-900 font-sans">
      {/* LEFT HERO IMAGE PANEL (7/12 to 8/12 COLUMNS) */}
      <div className="relative hidden lg:flex lg:col-span-7 xl:col-span-8 flex-col justify-between p-10 xl:p-14 overflow-hidden bg-slate-950">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('/images/office_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30" />

        {/* Top Branding Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wide uppercase shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>BlueBoxx HRMS Enterprise</span>
          </div>
        </div>

        {/* Bottom Hero Typography */}
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-slate-950 font-display font-bold text-base flex items-center justify-center shadow-md">
              BB
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Corp<span className="italic font-normal text-slate-300">HR</span>
            </span>
          </div>

          <h2 className="font-display text-4xl xl:text-[2.75rem] font-medium italic text-white leading-[1.1] tracking-tight">
            Human Capital,
            <br />
            <span className="not-italic font-semibold">Orchestrated.</span>
          </h2>

          <p className="text-[13px] text-slate-300/90 font-normal leading-relaxed">
            Enterprise operations portal for workforce attendance, statutory leave
            quotas, task tracking, and AI attrition-risk insights.
          </p>
        </div>
      </div>

      {/* RIGHT FORM PANEL (SPREAD TO COVER FULL HEIGHT) */}
      <div className="flex flex-col justify-between lg:col-span-5 xl:col-span-4 px-6 sm:px-10 lg:px-12 py-10 lg:py-14 bg-white min-h-screen">
        {/* Top Header / Mobile Branding */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-display font-bold text-xs flex items-center justify-center shadow-xs">
              BB
            </div>
            <span className="font-display font-semibold text-slate-900 text-sm">
              CorpHR <span className="text-slate-400 font-normal">/ BlueBoxx</span>
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">v4.2 Enterprise</span>
        </div>

        {/* Middle Form Area */}
        <div className="w-full max-w-sm mx-auto my-auto py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-[2.25rem] font-semibold text-slate-900 tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-normal">
              Enter your details to sign in to your portal.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="name@company.com"
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
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="••••••••"
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

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setToastMessage('Password reset link sent to your registered email.');
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="font-semibold text-[#0f365e] hover:underline underline-offset-2"
              >
                Forgot password?
              </a>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0f365e] hover:bg-[#164677] active:scale-[0.99] text-white text-sm font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Security / Copyright Footer */}
        <div className="w-full max-w-sm mx-auto pt-4 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            Protected by enterprise 256-bit SSL encryption
          </p>
        </div>
      </div>
      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </div>
  );
}