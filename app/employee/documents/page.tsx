'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { fetchApi } from '@/lib/api';
import { FileText, Download, Plus, Upload, Eye, X } from '@/components/ui/Icon';

export default function EmployeeDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Document Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('contract');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  useEffect(() => {
    loadUserDocuments();
  }, [user?.id]);

  const loadUserDocuments = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/employees/${user.id}`);
      setDocuments(res.employee?.documents || []);
    } catch (err: any) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToastMessage('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSubmitting(true);
    try {
      const payloadUrl = fileDataUrl || fileUrl.trim() || `/documents/${Date.now()}_${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      const res = await fetchApi(`/employees/${user.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          type,
          file_url: payloadUrl,
        }),
      });

      setToastMessage(res.message || 'Document uploaded and saved to vault successfully!');
      setIsModalOpen(false);
      setTitle('');
      setFileUrl('');
      setSelectedFile(null);
      setFileDataUrl('');
      await loadUserDocuments();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = (d: any) => {
    setPreviewDoc(d);
  };

  const handleDownloadDocument = (d: any) => {
    if (!d.file_url || d.file_url === '#') {
      setToastMessage(`No downloadable content for ${d.title}`);
      return;
    }
    const link = document.createElement('a');
    link.href = d.file_url;
    link.download = `${d.title.replace(/\s+/g, '_')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Downloading document: ${d.title}`);
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Document Vault"
        description="Employment contracts, identification proofs, tax forms, and certificates"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Document</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Fetching employee document vault from database...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center rounded-xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-extrabold text-slate-800 mb-1">No Documents Uploaded</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Click &quot;Upload New Document&quot; above to select and store identification proofs, certificates, or tax files.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <TablePrimitive
            headers={['Document Title', 'Category', 'Upload Date', 'Actions']}
            rows={documents.map((d) => [
              <div key="title" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f365e]" />
                <span className="font-extrabold text-slate-900 text-xs">{d.title}</span>
              </div>,
              <span key="type" className="capitalize text-xs text-slate-700 font-bold px-2 py-0.5 bg-slate-100 rounded border border-slate-200">{d.type}</span>,
              <span key="date" className="font-mono text-xs text-slate-500">{d.created_at?.slice(0, 10) || '2026-08-19'}</span>,
              <div key="actions" className="flex items-center gap-2">
                <button
                  onClick={() => handleViewDocument(d)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold rounded-lg border border-sky-200 transition-colors cursor-pointer"
                  title="View Document"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleDownloadDocument(d)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Download Document"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download</span>
                </button>
              </div>,
            ])}
          />
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document to Vault">
        <form onSubmit={handleUploadDocument} className="space-y-4">
          {/* BROWSE FILE DROPZONE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select File to Upload *</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-[#0f365e] rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 transition-all text-center relative cursor-pointer group">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
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
                      setFileDataUrl('');
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
                  <p className="text-[10px] text-slate-400">PDF, DOCX, PNG, JPG, TXT up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Passport Copy, Degree Certificate, Tax Declaration"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white capitalize"
              >
                <option value="contract">Contract & Agreement</option>
                <option value="identity">Identity Proof</option>
                <option value="tax">Tax & Compliance</option>
                <option value="certificate">Certification / Degree</option>
                <option value="other">Other Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">File URL (Optional Link)</label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="Optional external link or URL"
              />
            </div>
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
              disabled={submitting || (!selectedFile && !fileUrl && !title)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{submitting ? 'Uploading to DB...' : 'Save to Vault'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT PREVIEW MODAL */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`Document Preview: ${previewDoc?.title || ''}`}>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{previewDoc?.title}</p>
              <p className="text-xs text-slate-500 capitalize">Category: {previewDoc?.type}</p>
            </div>
            <button
              onClick={() => handleDownloadDocument(previewDoc)}
              className="px-3.5 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto border border-slate-200 rounded-xl p-3 bg-slate-100 flex justify-center items-center min-h-[250px]">
            {previewDoc?.file_url?.startsWith('data:image') ? (
              <img src={previewDoc.file_url} alt={previewDoc.title} className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-xs" />
            ) : previewDoc?.file_url?.startsWith('data:application/pdf') ? (
              <iframe src={previewDoc.file_url} className="w-full h-[50vh] rounded-lg" title={previewDoc.title} />
            ) : (
              <div className="text-center p-8 space-y-3">
                <FileText className="w-12 h-12 text-[#0f365e] mx-auto" />
                <p className="text-sm font-extrabold text-slate-800">{previewDoc?.title}</p>
                <p className="text-xs text-slate-500">Document saved safely in vault database</p>
                <button
                  onClick={() => handleDownloadDocument(previewDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
