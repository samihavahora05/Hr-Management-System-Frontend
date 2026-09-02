'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Briefcase, UserPlus, Calendar, CheckCircle, Plus } from '@/components/ui/Icon';

export default function HRRecruitmentPage() {
  const [openings, setOpenings] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Job Opening Modal
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [vacancies, setVacancies] = useState('1');
  const [jobDescription, setJobDescription] = useState('');

  // Add Candidate Modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedOpeningId, setSelectedOpeningId] = useState<number | null>(null);
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');

  // Onboard Candidate Modal
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [salaryOffered, setSalaryOffered] = useState('80000');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [opRes, candRes] = await Promise.all([
        fetchApi('/recruitment/openings'),
        fetchApi('/recruitment/candidates'),
      ]);
      setOpenings(opRes.openings || []);
      setCandidates(candRes.candidates || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/recruitment/openings', {
        method: 'POST',
        body: JSON.stringify({
          title: jobTitle,
          department,
          vacancies: parseInt(vacancies, 10) || 1,
          description: jobDescription,
        }),
      });
      setToastMessage(res.message || 'Job opening created!');
      setIsOpeningModalOpen(false);
      setJobTitle('');
      setVacancies('1');
      setJobDescription('');
      loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create opening');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpeningId) return;

    try {
      const res = await fetchApi('/recruitment/candidates', {
        method: 'POST',
        body: JSON.stringify({
          job_opening_id: selectedOpeningId,
          name: candName,
          email: candEmail,
          phone: candPhone,
        }),
      });
      setToastMessage(res.message || 'Candidate added!');
      setIsCandidateModalOpen(false);
      setCandName('');
      setCandEmail('');
      setCandPhone('');
      loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to add candidate');
    }
  };

  const handleOnboardCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      const res = await fetchApi(`/recruitment/candidates/${selectedCandidate.id}/onboard`, {
        method: 'POST',
        body: JSON.stringify({
          salary_offered: parseFloat(salaryOffered),
          joining_date: joiningDate,
        }),
      });
      setToastMessage(res.message || 'Candidate onboarded as active employee!');
      setIsOnboardModalOpen(false);
      loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to onboard candidate');
    }
  };

  // Filter for Active / All Openings
  const [openingFilter, setOpeningFilter] = useState<'active' | 'all'>('active');

  const visibleOpenings = openings.filter((o) => {
    if (openingFilter === 'active') return o.status === 'active';
    return true;
  });

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Recruitment & Candidate ATS"
        description="Manage active job openings, applicant evaluation pipelines, interview scheduling, and onboard hired candidates into active employee master records."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setIsCandidateModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job Opening</span>
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* OPENINGS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#0f365e]" />
              <span>Active Job Openings</span>
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setOpeningFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  openingFilter === 'active' ? 'bg-[#0f365e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active Only ({openings.filter((o) => o.status === 'active').length})
              </button>
              <button
                onClick={() => setOpeningFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  openingFilter === 'all' ? 'bg-[#0f365e] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Show All ({openings.length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading job openings...</div>
            ) : visibleOpenings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                {openingFilter === 'active'
                  ? 'No active job openings right now. All positions have been filled or onboarded.'
                  : 'No job openings created yet.'}
              </div>
            ) : (
              <TablePrimitive
                headers={['Job Title', 'Department', 'Positions / Hired', 'Location', 'Type', 'Applicants', 'Status']}
                rows={visibleOpenings.map((o) => [
                  <span key="title" className="font-extrabold text-slate-900 text-xs">{o.title}</span>,
                  <span key="dept" className="text-xs text-slate-700">{o.department}</span>,
                  <div key="vacancies" className="flex flex-col">
                    <span className="font-extrabold text-xs text-slate-900">{o.joined_count || 0} / {o.vacancies || 1} Hired</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{o.vacancies || 1} open position{(o.vacancies || 1) > 1 ? 's' : ''}</span>
                  </div>,
                  <span key="loc" className="text-xs text-slate-600">{o.location}</span>,
                  <span key="type" className="capitalize text-xs font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded">{o.type.replace('_', ' ')}</span>,
                  <span key="cand" className="font-mono text-xs text-[#0f365e] font-extrabold">{o.candidates_count || 0} applicants</span>,
                  <Badge key="status" variant={o.status === 'active' ? 'green' : 'neutral'}>
                    {o.status === 'active' ? 'ACTIVE' : 'FILLED'}
                  </Badge>,
                ])}
              />
            )}
          </div>
        </div>

        {/* CANDIDATES PIPELINE SECTION */}
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0f365e]" />
            <span>Applicant Pipeline & Onboarding</span>
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading candidate pipeline...</div>
            ) : candidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">No applicants in pipeline.</div>
            ) : (
              <TablePrimitive
                headers={['Candidate Name', 'Applied For', 'Contact', 'Pipeline Stage', 'Rating', 'Actions']}
                rows={candidates.map((c) => [
                  <div key="cand" className="flex flex-col">
                    <span className="font-extrabold text-slate-900 text-xs">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.email}</span>
                  </div>,
                  <span key="job" className="text-xs font-bold text-slate-700">{c.job_opening?.title || 'General'}</span>,
                  <span key="phone" className="font-mono text-xs text-slate-600">{c.phone || 'N/A'}</span>,
                  <Badge
                    key="stage"
                    variant={
                      c.stage === 'joined'
                        ? 'green'
                        : c.stage === 'interview'
                        ? 'blue'
                        : c.stage === 'rejected'
                        ? 'red'
                        : 'amber'
                    }
                  >
                    {c.stage.toUpperCase()}
                  </Badge>,
                  <span key="rating" className="text-xs font-bold text-amber-600">
                    {'★'.repeat(c.rating || 0)}
                    {'☆'.repeat(5 - (c.rating || 0))}
                  </span>,
                  c.stage === 'joined' ? (
                    <span key="act" className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Onboarded
                    </span>
                  ) : (
                    <button
                      key="act"
                      onClick={() => {
                        setSelectedCandidate(c);
                        setIsOnboardModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs cursor-pointer transition-colors"
                    >
                      Onboard as Employee
                    </button>
                  ),
                ])}
              />
            )}
          </div>
        </div>
      </div>

      {/* CREATE JOB OPENING MODAL */}
      <Modal isOpen={isOpeningModalOpen} onClose={() => setIsOpeningModalOpen(false)} title="Create New Job Opening">
        <form onSubmit={handleCreateOpening} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Senior Backend Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Number of Vacancies / Positions</label>
              <input
                type="number"
                min="1"
                required
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Job Description & Requirements</label>
            <textarea
              required
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Key responsibilities and qualifications..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpeningModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Publish Job Opening
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD CANDIDATE MODAL */}
      <Modal isOpen={isCandidateModalOpen} onClose={() => setIsCandidateModalOpen(false)} title="Add Candidate to Opening">
        <form onSubmit={handleAddCandidate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Job Opening</label>
            <select
              required
              value={selectedOpeningId || ''}
              onChange={(e) => setSelectedOpeningId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="">-- Choose Job Opening --</option>
              {openings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={candEmail}
                onChange={(e) => setCandEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={candPhone}
                onChange={(e) => setCandPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCandidateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Save Candidate
            </button>
          </div>
        </form>
      </Modal>

      {/* ONBOARD CANDIDATE MODAL */}
      <Modal isOpen={isOnboardModalOpen} onClose={() => setIsOnboardModalOpen(false)} title="Onboard Hired Candidate">
        <form onSubmit={handleOnboardCandidate} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <p className="font-extrabold text-slate-800">Candidate: {selectedCandidate?.name}</p>
            <p className="text-slate-600">Email: {selectedCandidate?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Offered Monthly Base Salary (₹)</label>
              <input
                type="number"
                required
                value={salaryOffered}
                onChange={(e) => setSalaryOffered(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Onboarding will generate an Employee ID, auto-allocate statutory leave balances, and create their active employee login account.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Convert to Active Employee
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
