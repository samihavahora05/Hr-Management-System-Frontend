'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Send,
  RefreshCw,
  Calendar,
} from '@/components/ui/Icon';

export default function EmployeePerformancePage() {
  const [data, setData] = useState<{ summary: any; tasks: any[] }>({
    summary: null,
    tasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/tasks/my-performance')
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to fetch personal performance', err))
      .finally(() => setLoading(false));
  }, []);

  const summary = data.summary || {};
  const tasks = data.tasks || [];

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Task Performance & Verified Marks"
        description="Track your performance rating, admin-awarded marks, task submissions, and evaluation scores"
      />

      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs font-semibold text-slate-400 animate-pulse shadow-2xs">
          Loading performance summary...
        </div>
      ) : (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* OVERALL PERFORMANCE SCORE */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Performance Score</span>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {summary.performance_percentage ?? 0}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">from admin marks</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${summary.performance_percentage ?? 0}%` }}
                />
              </div>
            </div>

            {/* TOTAL MARKS EARNED */}
            <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-xs font-bold uppercase tracking-wider">Total Marks Earned</span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950 font-mono">
                  {summary.total_earned_marks ?? 0}
                </span>
                <span className="text-xs text-emerald-700 font-semibold">
                  / {summary.total_possible_marks ?? 0} max marks
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Across {summary.approved_tasks ?? 0} approved tasks
              </p>
            </div>

            {/* APPROVED VS IN PROGRESS */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider">Approved Tasks</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {summary.approved_tasks ?? 0}
              </div>
              <p className="text-[11px] text-slate-500">
                {summary.in_progress_tasks ?? 0} in progress • {summary.submitted_for_review_tasks ?? 0} under review
              </p>
            </div>

            {/* RATING BADGE */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Evaluation Rating</span>
                <FileCheck className="w-5 h-5 text-slate-400" />
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                summary.rating_badge === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                summary.rating_badge === 'blue' ? 'bg-sky-100 text-sky-800' :
                summary.rating_badge === 'amber' ? 'bg-amber-100 text-amber-800' :
                summary.rating_badge === 'rose' ? 'bg-rose-100 text-rose-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {summary.rating || 'Staff Member'}
              </span>
              <p className="text-[11px] text-slate-500">
                {summary.needs_revision_tasks > 0 ? `${summary.needs_revision_tasks} tasks need revision` : 'No outstanding revisions'}
              </p>
            </div>
          </div>

          {/* TASK-LEVEL PERFORMANCE BREAKDOWN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-sm">Assigned Tasks Evaluation Breakdown</h3>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No task evaluation records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Task Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Max Marks</th>
                      <th className="py-3 px-4 text-center">Marks Awarded</th>
                      <th className="py-3 px-4">Score (%)</th>
                      <th className="py-3 px-4">Admin Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{t.title}</td>
                        <td className="py-3 px-4 capitalize">{t.category}</td>
                        <td className="py-3 px-4 capitalize">{t.priority}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            t.status === 'approved' || t.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            t.status === 'submitted_for_review' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            t.status === 'needs_revision' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {t.status ? t.status.replace('_', ' ') : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{t.maximum_marks}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {t.marks_awarded !== null ? (
                            <span className="text-emerald-800">{t.marks_awarded}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {t.percentage !== null ? `${t.percentage}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">
                          {t.admin_feedback || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
