'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from '@/components/ui/Icon';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dynamic Company Branding
  const [companyLogo, setCompanyLogo] = useState<string>('/images/logoblue.png');
  const [companyName, setCompanyName] = useState<string>('BlueBoxx DA Pvt. Ltd.');

  const router = useRouter();

  useEffect(() => {
    fetchApi('/organization/branding')
      .then((res) => {
        if (res?.logo_url) setCompanyLogo(res.logo_url);
        if (res?.organization_name) setCompanyName(res.organization_name);
      })
      .catch(() => null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('The new password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('The new password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          password_confirmation: passwordConfirmation,
        }),
      });

      setSuccessMessage(data.message || 'Password reset successfully! Redirecting to login...');
      setPassword('');
      setPasswordConfirmation('');

      // Automatically redirect to login with success state
      setTimeout(() => {
        router.push(`/login?reset=success&email=${encodeURIComponent(cleanEmail)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password. Please check your details.');
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
            src={companyLogo}
            alt={companyName}
            className="h-8 sm:h-9 w-auto max-w-[200px] object-contain"
            onError={() => setCompanyLogo('/images/logoblue.png')}
          />
        </div>
        <span className="text-[11px] font-medium text-slate-400">v4.2 Enterprise</span>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/40">
          {/* Header */}
          <div className="mb-6 text-left">
            <h1 className="font-display text-[2.1rem] sm:text-[2.25rem] font-semibold text-slate-900 tracking-tight leading-tight">
              Reset Password
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 font-normal">
              Enter your registered email and choose a new password.
            </p>
          </div>

          {/* Success Notice */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                >
                  Proceed to Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0f365e] focus:ring-1 focus:ring-[#0f365e] transition-all"
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer select-none"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0f365e] hover:bg-[#164677] active:scale-[0.99] text-white text-sm font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Changing password…' : 'Change Password'}
              </button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#0f365e] hover:underline underline-offset-2 transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Sign in
                </Link>
              </div>
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
    </div>
  );
}
