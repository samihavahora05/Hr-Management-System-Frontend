'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi, downloadApiFile } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Upload, Plus, Calendar, Clock, User } from '@/components/ui/Icon';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [employee, setEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'leaves' | 'personal'>('overview');
  const [loading, setLoading] = useState(true);

  // Document upload modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('contract');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/employees/${id}`);
      setEmployee(res.employee);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load employee profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToastMessage('Please choose a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('type', docType);
      formData.append('file', selectedFile);
      formData.append('user_id', String(id));

      await fetchApi('/documents', {
        method: 'POST',
        body: formData,
      });

      setIsDocModalOpen(false);
      setDocTitle('');
      setSelectedFile(null);
      setToastMessage('Document uploaded and saved to vault successfully');
      await loadDetail();
    } catch (err: any) {
      setToastMessage(err.message || 'Document upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (d: any) => {
    try {
      const ext = d.file_url ? d.file_url.split('.').pop() : 'pdf';
      const cleanTitle = (d.title || 'document').replace(/\s+/g, '_');
      await downloadApiFile(`/documents/${d.id}/download`, `${cleanTitle}.${ext}`);
      setToastMessage(`Downloaded ${d.title}`);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="p-8 max-w-7xl mx-auto w-full flex justify-center items-center py-20 text-slate-400 text-xs font-semibold animate-pulse">
            Loading employee record...
          </main>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="p-8 max-w-7xl mx-auto w-full">
            <Link href="/hr/employees" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
            </Link>
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-base font-extrabold text-slate-900">Employee Record Not Found</p>
              <p className="text-xs text-slate-500 mt-1">The requested employee ID does not exist or you do not have authorization to view it.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const formatJoiningDate = (dateVal?: string | null) => {
    if (!dateVal) return 'N/A';
    const clean = String(dateVal).split('T')[0].split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return clean;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
          <div className="mb-4">
            <Link href="/hr/employees" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Directory
            </Link>
          </div>

          {/* REAL EMPLOYEE PROFILE HEADER CARD */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#0f365e] text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
              {employee.name ? employee.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{employee.name}</h1>
                  <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
                    {employee.designation} • {employee.employee_code}
                  </p>
                </div>
                <Badge variant={employee.status === 'active' ? 'green' : employee.status === 'on_leave' ? 'yellow' : 'red'}>
                  {employee.status || 'Active'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="text-slate-900 font-semibold">{employee.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Manager</span>
                  <span className="text-slate-900 font-semibold">{employee.manager?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Email</span>
                  <span className="text-slate-900 font-semibold">{employee.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PROFILE TABS BAR */}
          <div className="flex border-b border-slate-200 mb-6 gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'leaves' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Leave Balances ({employee.leave_balances?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'documents' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Documents ({employee.documents?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === 'personal' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Personal Details
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Joining Date</span>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {employee.joining_date ? (
                      <span className="font-sans font-extrabold text-[#0f365e]">
                        {formatJoiningDate(employee.joining_date)}
                        <span className="text-xs text-slate-400 font-mono font-normal ml-2">
                          ({String(employee.joining_date).split('T')[0].split(' ')[0]})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">N/A</span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">System Role</span>
                  <div className="text-lg font-bold text-slate-900 mt-1 capitalize">{employee.role?.display_name || employee.role?.name || 'Staff'}</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Contact Details</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-900 font-semibold truncate">✉ {employee.email}</p>
                    <p className="text-slate-600 font-mono">📞 {employee.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEAVE BALANCES */}
          {activeTab === 'leaves' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Allocated Leave Quotas</h3>
              {(!employee.leave_balances || employee.leave_balances.length === 0) ? (
                <p className="text-xs text-slate-500 py-4 text-center">No leave balance records assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employee.leave_balances.map((lb: any) => (
                    <div key={lb.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs font-bold text-slate-700">{lb.leave_type?.name || 'Leave'}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-[#0f365e]">{lb.remaining}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {lb.allocated} days</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{lb.used} days taken</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Official Vault Documents</h3>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0f365e] hover:bg-[#164677] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {(!employee.documents || employee.documents.length === 0) ? (
                <p className="text-xs text-slate-500 py-6 text-center">No documents uploaded for this employee yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {employee.documents.map((d: any) => (
                    <div key={d.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#0f365e]" />
                        <div>
                          <p className="font-bold text-slate-900">{d.title}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{d.type} • Uploaded {d.created_at ? String(d.created_at).slice(0, 10) : 'Recent'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDoc(d)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
              <h3 className="text-base font-bold text-slate-900">Personal & Emergency Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Phone Number</span>
                  <p className="text-sm font-semibold text-slate-900">{employee.phone || 'Not Specified'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Work Mode</span>
                  <p className="text-sm font-semibold text-slate-900 capitalize">{employee.work_mode || 'In-Office'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Gender</span>
                  <p className="text-sm font-semibold text-slate-900 capitalize">{employee.gender || 'Not Specified'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase block mb-1">Date of Birth</span>
                  <p className="text-sm font-semibold text-slate-900 font-mono">
                    {employee.dob ? String(employee.dob).split('T')[0] : 'Not Specified'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Upload Document to Employee Vault">
        <form onSubmit={handleDocUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File to Upload *</label>
            <input
              type="file"
              required
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  if (!docTitle) {
                    setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                  }
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Identity Card, Appointment Letter"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
            >
              <option value="contract">Contract & Agreement</option>
              <option value="identity">Identity Proof</option>
              <option value="tax">Tax Declaration</option>
              <option value="certificate">Certification / Degree</option>
              <option value="other">Other Document</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Save to Vault'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </div>
  );
}
