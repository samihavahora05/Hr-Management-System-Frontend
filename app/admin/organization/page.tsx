'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';

export default function AdminOrganizationPage() {
  const { user, updateOrganizationLogo } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Logo state
  const [fullLogoPreview, setFullLogoPreview] = useState<string>('/images/logoblue.png');
  const [iconLogoPreview, setIconLogoPreview] = useState<string>('/images/Boxxlogo.png');
  const [fullLogoFile, setFullLogoFile] = useState<File | null>(null);
  const [iconLogoFile, setIconLogoFile] = useState<File | null>(null);
  const [fullLogoUrlInput, setFullLogoUrlInput] = useState<string>('');
  const [iconLogoUrlInput, setIconLogoUrlInput] = useState<string>('');

  const fullLogoInputRef = useRef<HTMLInputElement>(null);
  const iconLogoInputRef = useRef<HTMLInputElement>(null);

  // Company Name & Info State
  const [companyNameInput, setCompanyNameInput] = useState<string>('');
  const [currencyInput, setCurrencyInput] = useState<string>('INR');
  const [timezoneInput, setTimezoneInput] = useState<string>('Asia/Kolkata');
  const [savingCompanyInfo, setSavingCompanyInfo] = useState<boolean>(false);

  useEffect(() => {
    fetchApi('/settings/organization')
      .then((res) => {
        if (res?.organization) {
          setOrg(res.organization);
          setCompanyNameInput(res.organization.name || '');
          const settings = res.organization.settings || {};
          setCurrencyInput(settings.currency || 'INR');
          setTimezoneInput(settings.timezone || 'Asia/Kolkata');

          if (settings.logo_url) {
            setFullLogoPreview(settings.logo_url);
            setFullLogoUrlInput(settings.logo_url.startsWith('http') ? settings.logo_url : '');
          }
          if (settings.icon_logo_url) {
            setIconLogoPreview(settings.icon_logo_url);
            setIconLogoUrlInput(settings.icon_logo_url.startsWith('http') ? settings.icon_logo_url : '');
          }
        }
      })
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim()) {
      setToastMessage('Company name cannot be empty.');
      return;
    }
    setSavingCompanyInfo(true);
    try {
      const res = await fetchApi('/settings/organization', {
        method: 'PUT',
        body: JSON.stringify({
          name: companyNameInput.trim(),
          settings: {
            currency: currencyInput,
            timezone: timezoneInput,
          },
        }),
      });
      setOrg(res.organization);
      setToastMessage('Company profile updated successfully! New company name is now active for all users.');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update company profile.');
    } finally {
      setSavingCompanyInfo(false);
    }
  };

  const handleFullLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setFullLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFullLogoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIconLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setIconLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setIconLogoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLogo(true);

    try {
      // Use FormData for direct file upload or pass base64/url
      const formData = new FormData();
      if (fullLogoFile) {
        formData.append('logo_file', fullLogoFile);
      } else if (fullLogoPreview) {
        formData.append('logo', fullLogoPreview);
      }

      if (iconLogoFile) {
        formData.append('icon_file', iconLogoFile);
      } else if (iconLogoPreview) {
        formData.append('icon_logo', iconLogoPreview);
      }

      const res = await fetchApi('/settings/organization/logo', {
        method: 'POST',
        body: formData,
      });

      setToastMessage(res.message || 'Logo updated successfully! All users will now see your brand logo.');
      
      // Update Auth context so the admin's sidebar updates immediately
      if (res.logo_url) {
        updateOrganizationLogo(res.logo_url, res.icon_logo_url);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update organization logo.');
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Organization Configuration & Branding"
        description="Manage company branding, system-wide logos, statutory holiday calendar, and fiscal settings"
      />

      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading organization details from database...
        </div>
      ) : !org ? (
        <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-xl border border-slate-200">
          No organization metadata found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* BRANDING & LOGOS CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🎨</span> Company Logos & Portal Branding
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logos configured here will automatically display across the <strong>Sidebar</strong>, <strong>Login Page</strong>, and <strong>all User Portals</strong>.
                </p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 self-start sm:self-auto">
                Visible to All Users
              </span>
            </div>

            <form onSubmit={handleSaveLogos} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Full Horizontal Logo (Expanded Sidebar & Login) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Primary Logo (Horizontal)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Displayed in expanded sidebar and login screen (Max width 200px)
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">PNG, SVG, JPG</span>
                  </div>

                  {/* Preview Container */}
                  <div className="p-4 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center min-h-[90px]">
                    {fullLogoPreview ? (
                      <img
                        src={fullLogoPreview}
                        alt="Primary Logo Preview"
                        className="max-h-12 max-w-[220px] object-contain"
                        onError={() => setFullLogoPreview('/images/logoblue.png')}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No logo selected</span>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fullLogoInputRef}
                      onChange={handleFullLogoFileChange}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fullLogoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs"
                      >
                        📁 Choose Image File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFullLogoPreview('/images/logoblue.png');
                          setFullLogoFile(null);
                        }}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-medium transition-colors"
                      >
                        Reset to Default
                      </button>
                    </div>

                    {/* Or URL input */}
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Or Image URL</span>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={fullLogoUrlInput}
                        onChange={(e) => {
                          setFullLogoUrlInput(e.target.value);
                          if (e.target.value) setFullLogoPreview(e.target.value);
                        }}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Compact / Square Icon Logo (Collapsed Sidebar) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Icon / Square Logo
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Displayed when sidebar is collapsed (Square 1:1 ratio recommended)
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">1:1 Aspect</span>
                  </div>

                  {/* Preview Container */}
                  <div className="p-4 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center min-h-[90px]">
                    {iconLogoPreview ? (
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
                        <img
                          src={iconLogoPreview}
                          alt="Icon Logo Preview"
                          className="w-full h-full object-contain"
                          onError={() => setIconLogoPreview('/images/Boxxlogo.png')}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No icon logo selected</span>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={iconLogoInputRef}
                      onChange={handleIconLogoFileChange}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => iconLogoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs"
                      >
                        📁 Choose Icon File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIconLogoPreview('/images/Boxxlogo.png');
                          setIconLogoFile(null);
                        }}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-medium transition-colors"
                      >
                        Reset to Default
                      </button>
                    </div>

                    {/* Or URL input */}
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Or Icon URL</span>
                      <input
                        type="url"
                        placeholder="https://example.com/icon.png"
                        value={iconLogoUrlInput}
                        onChange={(e) => {
                          setIconLogoUrlInput(e.target.value);
                          if (e.target.value) setIconLogoPreview(e.target.value);
                        }}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingLogo}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>{savingLogo ? 'Saving Logo & Applying to Users...' : 'Save & Publish Logo'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* COMPANY METADATA CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🏢</span> Company Profile & System Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Updating company name here applies across employee dashboards, payslips, and system records
                </p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 self-start sm:self-auto">
                System Active
              </span>
            </div>

            <form onSubmit={handleSaveCompanyInfo} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    placeholder="e.g. Acme Corporation Pvt. Ltd."
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This company name is shown to all employees on their profiles, sidebar, and reports.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Organization Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={org.code}
                    className="w-full text-sm font-mono font-bold bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    System identifier code for multi-tenant isolation.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Default Payroll Currency
                  </label>
                  <select
                    value={currencyInput}
                    onChange={(e) => setCurrencyInput(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Operational Timezone
                  </label>
                  <select
                    value={timezoneInput}
                    onChange={(e) => setTimezoneInput(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingCompanyInfo}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <span>🏢</span>
                  <span>{savingCompanyInfo ? 'Saving Changes...' : 'Save Company Details'}</span>
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Statutory Holiday Calendar (2026)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(org.settings?.holiday_calendar || []).map((h: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{h.title}</p>
                      <p className="text-[10px] font-mono text-slate-500">{h.date}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Official Holiday
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
