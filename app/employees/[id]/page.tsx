'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { ArrowLeft, FileText, Download } from '@/components/ui/Icon';

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [employee, setEmployee] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history' | 'personal'>('overview');
  const [loading, setLoading] = useState(true);

  // Document upload modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('contract');
  const [docUrl, setDocUrl] = useState('');
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
    setUploading(true);
    try {
      await fetchApi(`/employees/${id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          title: docTitle,
          type: docType,
          file_url: docUrl || `/documents/${docType}_${id}.pdf`,
        }),
      });
      setIsDocModalOpen(false);
      setDocTitle('');
      setDocUrl('');
      setToastMessage('Document saved successfully');
      await loadDetail();
    } catch (err: any) {
      setToastMessage(err.message || 'Document upload failed');
    } finally {
      setUploading(false);
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
                <Badge status={employee.status || 'active'} />
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
              Personal Info
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900">Employment Overview</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Joining Date</span>
                  <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                    {employee.joining_date ? String(employee.joining_date).split('T')[0].split(' ')[0] : 'N/A'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">System Role</span>
                  <div className="text-lg font-bold text-slate-900 mt-1 capitalize">{employee.role?.display_name || 'Staff'}</div>
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

          {/* TAB 2: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Official Documents</h3>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0f365e] text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  + Upload Document
                </button>
              </div>

              {employee.documents?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No documents uploaded for this employee yet.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {employee.documents?.map((d: any) => (
                    <div key={d.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-700" />
                        <div>
                          <p className="font-bold text-slate-900">{d.title}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{d.type} • Uploaded {d.created_at?.slice(0, 10)}</p>
                        </div>
                      </div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setToastMessage(`Downloading ${d.title}`);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">Personal Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                  <span className="text-slate-900 font-mono font-bold">{employee.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Employment Status</span>
                  <span className="text-slate-900 font-semibold capitalize">{employee.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Employee Code</span>
                  <span className="text-slate-900 font-mono font-semibold">{employee.employee_code}</span>
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD DOCUMENT MODAL */}
          <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title="Upload Document">
            <form onSubmit={handleDocUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="Employment Agreement 2026"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="contract">Employment Contract</option>
                  <option value="id_proof">Government ID</option>
                  <option value="tax">Tax Document</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white rounded-lg font-bold shadow-xs"
                >
                  {uploading ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </form>
          </Modal>

          <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
        </main>
      </div>
    </div>
  );
}
