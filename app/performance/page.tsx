'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { Target, Award, Plus, CheckCircle } from '@/components/ui/Icon';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function PerformancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [weightage, setWeightage] = useState('20');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        const role = (user.role || '').toLowerCase();
        if (role === 'admin') {
          router.replace('/admin/performance');
        } else if (role === 'hr') {
          router.replace('/hr/dashboard');
        } else if (role === 'manager' || role === 'company_manager') {
          router.replace('/manager/dashboard');
        } else if (role === 'team_leader' || role === 'tl') {
          router.replace('/team-leader/dashboard');
        } else {
          router.replace('/employee/dashboard');
        }
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, cRes, rRes] = await Promise.all([
        fetchApi('/performance/goals'),
        fetchApi('/performance/cycles'),
        fetchApi('/performance/reviews'),
      ]);
      setGoals(gRes.goals || []);
      setCycles(cRes.cycles || []);
      setReviews(rRes.reviews || []);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRes = await fetchApi('/auth/me');
      const res = await fetchApi('/performance/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: goalTitle,
          description: goalDesc,
          weightage: parseInt(weightage),
          user_id: userRes.user.id,
        }),
      });
      setToastMessage(res.message || 'Performance goal created!');
      setIsGoalModalOpen(false);
      setGoalTitle('');
      setGoalDesc('');
      loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create goal');
    }
  };

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="Performance & Goal Management"
        description="Goal setting, KPI tracking, performance appraisal cycles, and self/manager reviews"
        action={
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Performance Goal</span>
          </button>
        }
      />

      <div className="space-y-6">
        {/* GOALS TRACKING */}
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0f365e]" />
            <span>Assigned Goals & Objectives</span>
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading performance goals...</div>
            ) : goals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">No performance goals set for current cycle.</div>
            ) : (
              <TablePrimitive
                headers={['Goal Title', 'Weightage', 'Progress', 'Status', 'Manager Feedback']}
                rows={goals.map((g) => [
                  <div key="title" className="flex flex-col">
                    <span className="font-extrabold text-slate-900 text-xs">{g.title}</span>
                    <span className="text-[10px] text-slate-500">{g.description || 'No description provided'}</span>
                  </div>,
                  <span key="weight" className="font-mono text-xs text-slate-700 font-bold">{g.weightage}%</span>,
                  <div key="prog" className="w-32">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>{g.current_value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, g.current_value)}%` }}
                      />
                    </div>
                  </div>,
                  <Badge key="status" variant={g.status === 'achieved' ? 'green' : 'amber'}>
                    {g.status.replace('_', ' ').toUpperCase()}
                  </Badge>,
                  <span key="comment" className="text-xs text-slate-600 italic">
                    {g.manager_comment || 'Awaiting review'}
                  </span>,
                ])}
              />
            )}
          </div>
        </div>

        {/* PERFORMANCE REVIEWS */}
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0f365e]" />
            <span>Appraisal Cycle Reviews</span>
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">No review evaluations completed yet.</div>
            ) : (
              <TablePrimitive
                headers={['Cycle', 'Reviewer', 'Self Rating', 'Manager Rating', 'Final Score', 'Status']}
                rows={reviews.map((r) => [
                  <span key="cycle" className="font-extrabold text-slate-900 text-xs">{r.cycle?.title || 'Annual Sync'}</span>,
                  <span key="rev" className="text-xs text-slate-700">{r.reviewer?.name || 'HR Manager'}</span>,
                  <span key="self" className="font-bold text-xs text-blue-700">{r.self_rating ? `${r.self_rating} / 5` : 'Pending'}</span>,
                  <span key="mgr" className="font-bold text-xs text-purple-700">{r.manager_rating ? `${r.manager_rating} / 5` : 'Pending'}</span>,
                  <span key="final" className="font-mono text-xs font-black text-emerald-700">{r.final_rating ? `${r.final_rating} / 5.0` : 'In Progress'}</span>,
                  <Badge key="status" variant={r.status === 'completed' ? 'green' : 'blue'}>
                    {r.status.replace('_', ' ').toUpperCase()}
                  </Badge>,
                ])}
              />
            )}
          </div>
        </div>
      </div>

      {/* CREATE GOAL MODAL */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set Performance Goal">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Goal Title</label>
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Optimize Database Query Performance by 30%"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={goalDesc}
              onChange={(e) => setGoalDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Detail specific deliverables and success metrics..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">KPI Weightage (%)</label>
            <input
              type="number"
              required
              min="5"
              max="100"
              value={weightage}
              onChange={(e) => setWeightage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
