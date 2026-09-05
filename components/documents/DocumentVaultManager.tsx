'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { fetchApi, downloadApiFile, fetchApiBlobUrl } from '@/lib/api';
import { FileText, Download, Plus, Upload, Eye, X, Trash2, Users, Search, Filter, ExternalLink, RefreshCw } from '@/components/ui/Icon';
import { UniversalDocViewer } from '@/components/documents/UniversalDocViewer';

interface DocumentVaultManagerProps {
  namespace: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
  title?: string;
  description?: string;
}

export function DocumentVaultManager({
  namespace,
  title,
  description,
}: DocumentVaultManagerProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Upload Document Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('daily_report');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string>('');

  const isElevatedRole = ['admin', 'hr', 'manager', 'team_leader'].includes(namespace);

  useEffect(() => {
    loadDocuments();
    if (isElevatedRole) {
      loadEmployees();
    }
  }, [user?.id, namespace]);

  // Load document blob preview whenever previewDoc is opened
  useEffect(() => {
    let active = true;
    let revokeFn: (() => void) | null = null;

    if (!previewDoc) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(null);
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewContentType('');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    fetchApiBlobUrl(`/documents/${previewDoc.id}/view`)
      .then((res) => {
        if (!active) {
          res.revoke();
          return;
        }
        revokeFn = res.revoke;
        setPreviewBlobUrl(res.url);
        setPreviewContentType(res.contentType || '');
        setPreviewLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setPreviewError(err.message || 'Unable to preview file directly. Please use the download option below.');
        setPreviewLoading(false);
      });

    return () => {
      active = false;
      if (revokeFn) {
        revokeFn();
      }
    };
  }, [previewDoc?.id]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/documents');
      setDocuments(res.documents || []);
    } catch (err: any) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchApi('/employees');
      if (res.employees && Array.isArray(res.employees)) {
        setEmployeesList(res.employees);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setToastMessage('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!docTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setDocTitle(cleanName);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToastMessage('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('type', docType);
      formData.append('file', selectedFile);
      if (targetUserId) {
        formData.append('user_id', targetUserId);
      }

      const res = await fetchApi('/documents', {
        method: 'POST',
        body: formData,
      });

      setToastMessage(res.message || 'Document uploaded and securely saved to vault successfully!');
      setIsModalOpen(false);
      setDocTitle('');
      setSelectedFile(null);
      setTargetUserId('');
      await loadDocuments();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDocument = async (d: any) => {
    try {
      const ext = d.file_url ? d.file_url.split('.').pop() : 'pdf';
      const cleanTitle = (d.title || 'document').replace(/\s+/g, '_');
      await downloadApiFile(`/documents/${d.id}/download`, `${cleanTitle}.${ext}`);
      setToastMessage(`Downloaded: ${d.title}`);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to download document');
    }
  };

  const handleDeleteDocument = async (id: number, docTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${docTitle}"?`)) {
      return;
    }
    try {
      await fetchApi(`/documents/${id}`, { method: 'DELETE' });
      setToastMessage('Document deleted successfully from vault');
      await loadDocuments();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to delete document');
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((d) => {
    // Category filter
    if (selectedCategory !== 'all' && d.type !== selectedCategory) {
      return false;
    }
    // User filter
    if (selectedUserFilter !== 'all' && String(d.user_id) !== selectedUserFilter) {
      return false;
    }
    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchUploader = (d.user?.name || '').toLowerCase().includes(q);
      const matchEmpCode = (d.user?.employee_code || '').toLowerCase().includes(q);
      const matchDept = (d.user?.department || '').toLowerCase().includes(q);
      return matchTitle || matchUploader || matchEmpCode || matchDept;
    }
    return true;
  });

  const dailyReportsCount = documents.filter((d) => d.type === 'daily_report').length;

  const defaultPageTitle =
    namespace === 'admin'
      ? 'Company Document Vault & Employee Daily Reports'
      : namespace === 'hr'
      ? 'HR Document Vault & Reports'
      : namespace === 'manager'
      ? 'Team Document Vault & Daily Reports'
      : namespace === 'team_leader'
      ? 'Team Vault & Work Reports'
      : 'My Document Vault & Daily Reports';

  const defaultPageDesc =
    namespace === 'admin'
      ? 'Centralized master repository of employee daily work reports, signed contracts, identification proofs, and compliance documents across BLUEBOXX'
      : namespace === 'hr'
      ? 'Manage company-wide employee records, daily reports, compliance documents, and certifications'
      : namespace === 'manager'
      ? 'Review daily work reports and uploaded documents submitted by your reporting team members'
      : namespace === 'team_leader'
      ? 'Upload daily reports and view project documentation for your assigned team members'
      : 'Submit your daily work reports and securely manage contracts, identification, and certificates';

  return (
    <PortalLayout namespace={namespace}>
      <PageHeader
        title={title || defaultPageTitle}
        description={description || defaultPageDesc}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document / Daily Report</span>
          </button>
        }
      />

      {/* QUICK METRICS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents in Vault</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{documents.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f365e] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Work Reports</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{dailyReportsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtered View Count</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{filteredDocuments.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: 'All Documents' },
              { id: 'daily_report', label: 'Daily Work Reports' },
              { id: 'contract', label: 'Contracts' },
              { id: 'identity', label: 'Identity Proofs' },
              { id: 'tax', label: 'Tax & Compliance' },
              { id: 'certificate', label: 'Certificates' },
              { id: 'other', label: 'Other' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0f365e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* User selector for elevated roles */}
          {isElevatedRole && employeesList.length > 0 && (
            <div className="w-full md:w-64">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white"
              >
                <option value="all">All Employees / Users</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>
                    {emp.name} ({emp.employee_code || emp.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title, uploader name, employee code, or department..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0f365e]/20 focus:border-[#0f365e]"
          />
        </div>
      </div>

      {/* DOCUMENTS TABLE / LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium animate-pulse">
            Fetching documents and daily reports from database...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Documents Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedUserFilter !== 'all'
                ? 'No documents match the active search or category filters.'
                : 'No documents or daily reports uploaded yet. Click "Upload Document / Daily Report" above to submit one.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Upload New Document / Report
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={[
              'Document Title',
              'Uploaded By (Employee / User)',
              'Category',
              'Upload Date & Time',
              'Actions',
            ]}
            rows={filteredDocuments.map((d) => [
              <div key="title" className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    d.type === 'daily_report'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-blue-50 text-[#0f365e]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-xs block">{d.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {d.file_url ? d.file_url.split('.').pop()?.toUpperCase() : 'PDF'}
                  </span>
                </div>
              </div>,

              <div key="user" className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {d.user?.name ? d.user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">{d.user?.name || 'System / Employee'}</p>
                  <p className="text-[10px] text-slate-400">
                    {d.user?.employee_code ? `${d.user.employee_code} • ` : ''}
                    {d.user?.department || d.user?.role?.name || 'Staff'}
                  </p>
                </div>
              </div>,

              <span
                key="type"
                className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border capitalize ${
                  d.type === 'daily_report'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : d.type === 'contract'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : d.type === 'identity'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {d.type === 'daily_report' ? 'Daily Work Report' : d.type.replace('_', ' ')}
              </span>,

              <span key="date" className="font-mono text-xs text-slate-500">
                {d.created_at ? new Date(d.created_at).toLocaleDateString() + ' ' + new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
              </span>,

              <div key="actions" className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewDoc(d)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 transition-colors cursor-pointer"
                  title="View Document Details"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleDownloadDocument(d)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDeleteDocument(d.id, d.title)}
                  className="inline-flex items-center gap-1 px-2 py-1 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>,
            ])}
          />
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document / Daily Work Report">
        <form onSubmit={handleUploadDocument} className="space-y-4">
          {/* File Picker Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File to Upload *</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-[#0f365e] rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center relative cursor-pointer group">
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.svg"
              />
              {selectedFile ? (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md z-20 cursor-pointer"
                    title="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#0f365e] mx-auto transition-colors" />
                  <p className="text-xs font-extrabold text-slate-700">
                    Click to <span className="text-[#0f365e] underline">Browse File</span> or drag & drop
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, XLSX, XLS, DOCX, DOC, CSV, TXT, PNG, JPG up to 15MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document / Report Title *</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Daily Progress Report - 01 Sept 2026, Degree Certificate"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize font-bold text-slate-800"
              >
                <option value="daily_report">Daily Work Report / Status Update</option>
                <option value="contract">Contract & Agreement</option>
                <option value="identity">Identity Proof (Govt ID)</option>
                <option value="tax">Tax & Compliance Form</option>
                <option value="certificate">Certification / Degree</option>
                <option value="resume">Resume / CV</option>
                <option value="other">Other Document</option>
              </select>
            </div>

            {/* Target employee selector for Admin and HR */}
            {isElevatedRole && employeesList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload on Behalf of (Optional)</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="">Self ({user?.name})</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code || emp.department})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedFile || !docTitle}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? 'Uploading to Vault...' : 'Save to Vault'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Document: ${previewDoc?.title || ''}`} maxWidth="5xl">
        <div className="space-y-3">
          {/* Top metadata & action bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{previewDoc?.title}</span>
                <span className="px-2 py-0.5 bg-[#0f365e]/10 text-[#0f365e] font-bold text-[10px] rounded-md capitalize">
                  {previewDoc?.type === 'daily_report' ? 'Daily Work Report' : previewDoc?.type?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Uploaded by: <span className="font-bold text-slate-700">{previewDoc?.user?.name || 'Employee'}</span>
                {previewDoc?.created_at && (
                  <span className="ml-2 text-slate-400">
                    • {new Date(previewDoc.created_at).toLocaleDateString()} {new Date(previewDoc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {previewBlobUrl && (
                <button
                  onClick={() => window.open(previewBlobUrl, '_blank')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Open in Tab</span>
                </button>
              )}
              <button
                onClick={() => handleDownloadDocument(previewDoc)}
                className="px-3.5 py-1.5 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              {isElevatedRole && (
                <button
                  onClick={() => {
                    const id = previewDoc.id;
                    const title = previewDoc.title;
                    setPreviewDoc(null);
                    handleDeleteDocument(id, title);
                  }}
                  className="px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-transparent hover:border-rose-200 cursor-pointer transition-colors"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Inline Document Preview Box */}
          <div className="w-full h-[68vh] min-h-[480px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-center items-center relative">
            {previewLoading && (
              <div className="flex flex-col items-center gap-2 p-8 text-center animate-pulse">
                <div className="w-10 h-10 border-4 border-[#0f365e] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-700">Loading document preview...</p>
                <p className="text-[11px] text-slate-400">Fetching secure stream from vault</p>
              </div>
            )}

            {!previewLoading && previewError && (
              <div className="text-center p-8 space-y-3 max-w-md bg-white rounded-xl border border-slate-200 shadow-xs">
                <FileText className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-xs font-extrabold text-slate-800">Preview Notice</p>
                <p className="text-[11px] text-slate-500">{previewError}</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPreviewError(null);
                      setPreviewLoading(true);
                      fetchApiBlobUrl(`/documents/${previewDoc.id}/view`)
                        .then((res) => {
                          setPreviewBlobUrl(res.url);
                          setPreviewContentType(res.contentType || '');
                          setPreviewLoading(false);
                        })
                        .catch((err) => {
                          setPreviewError(err.message || 'Unable to preview file.');
                          setPreviewLoading(false);
                        });
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(previewDoc)}
                    className="px-4 py-1.5 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            )}

            {!previewLoading && !previewError && previewBlobUrl && (
              <UniversalDocViewer
                url={previewBlobUrl}
                fileName={previewDoc.file_url ? previewDoc.file_url.split('/').pop() : `${previewDoc.title || 'document'}.pdf`}
                contentType={previewContentType}
                title={previewDoc.title}
                onDownload={() => handleDownloadDocument(previewDoc)}
              />
            )}
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
