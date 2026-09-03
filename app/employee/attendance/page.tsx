'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { Toast } from '@/components/ui/Toast';
import { Clock, CheckCircle2, Edit3, X } from '@/components/ui/Icon';
import { useAuth } from '@/lib/auth-context';
import { getCurrentLocation } from '@/lib/geolocation';

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
}

function formatAttendanceNotes(notes?: string): string {
  if (!notes) return 'On-time check-in';
  return notes.replace(/Late by (-?\d+(?:\.\d+)?) mins/g, (_, p1) => {
    const totalMins = Math.round(Math.abs(parseFloat(p1)));
    if (isNaN(totalMins) || totalMins === 0) return 'Late check-in';
    if (totalMins < 60) {
      return `Late by ${totalMins} mins`;
    }
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const hrStr = `${hours} ${hours > 1 ? 'hrs' : 'hr'}`;
    if (mins === 0) {
      return `Late by ${hrStr}`;
    }
    return `Late by ${hrStr} ${mins} mins`;
  });
}

export default function EmployeeAttendancePage() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [officeLocation, setOfficeLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formDate, setFormDate] = useState<string>('');
  const [formCheckIn, setFormCheckIn] = useState<string>('');
  const [formCheckOut, setFormCheckOut] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('present');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const roleName = (typeof user?.role === 'object' ? (user.role as any)?.name : user?.role || '').toString().toLowerCase();
  const isAdmin = roleName === 'admin';

  useEffect(() => {
    loadData();
    // Periodically re-evaluate auto check-outs every 30 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [histRes, sumRes, schedRes, locRes] = await Promise.all([
        fetchApi('/attendance/history'),
        fetchApi('/attendance/summary').catch(() => null),
        fetchApi('/attendance/schedule').catch(() => null),
        fetchApi('/attendance/office-location').catch(() => null),
      ]);
      setAttendances(histRes.attendances || []);
      if (sumRes?.my_today) {
        setTodayAttendance(sumRes.my_today);
      }
      if (schedRes?.schedule) {
        setSchedule(schedRes.schedule);
      }
      if (locRes?.office_location) {
        setOfficeLocation(locRes.office_location);
      }
    } catch (err) {
      if (showLoading) setToastMessage('Failed to load attendance history');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const clientTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const coords = await getCurrentLocation().catch((err: any) => {
        throw new Error(err.message || 'Office location verification required: Please allow GPS location in your browser.');
      });

      const res = await fetchApi('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({
          time: clientTime,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });
      setToastMessage(res.message || 'Checked in successfully!');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Check-in failed: You must be at the office premises to clock in.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const clientTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const res = await fetchApi('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ time: clientTime }),
      });
      setToastMessage(res.message || 'Checked out!');
      await loadData();
    } catch (err: any) {
      setToastMessage(err.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleOpenEditModal = (record: any) => {
    setEditingRecord(record);
    setFormDate(formatDate(record.date));
    setFormCheckIn(record.check_in ? record.check_in.substring(0, 5) : '');
    setFormCheckOut(record.check_out ? record.check_out.substring(0, 5) : '');
    setFormStatus(record.status || 'present');
    setFormNotes(record.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);
    try {
      const res = await fetchApi('/attendance/correction', {
        method: 'POST',
        body: JSON.stringify({
          user_id: editingRecord.user_id,
          date: formDate,
          check_in: formCheckIn || null,
          check_out: formCheckOut || null,
          status: formStatus,
          notes: formNotes,
        }),
      });

      setToastMessage(res?.message || 'Attendance corrected successfully');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to save attendance correction');
    } finally {
      setSubmitting(false);
    }
  };

  const hasCheckedIn = !!todayAttendance?.check_in;
  const hasCheckedOut = !!todayAttendance?.check_out;

  return (
    <PortalLayout namespace="employee">
      <PageHeader
        title="My Attendance History"
        description="Daily check-in and check-out logs, punctuality records, and working hours"
        action={
          <div className="flex gap-2 items-center">
            {hasCheckedIn ? (
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>In: {formatTime(todayAttendance.check_in)}</span>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>{checkingIn ? 'Recording...' : 'Check In'}</span>
              </button>
            )}

            {hasCheckedOut ? (
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>Out: {formatTime(todayAttendance.check_out)}</span>
              </div>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut || !hasCheckedIn}
                className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 ${
                  hasCheckedIn
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{checkingOut ? 'Recording...' : 'Check Out'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* SHIFT TIMING & AUTO CLOCK-OUT STATUS BANNER */}
      <div className="bg-gradient-to-r from-[#0f365e]/5 via-indigo-50/40 to-emerald-50/30 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f365e] text-white flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">
                {schedule?.shift_name || 'General Day Shift'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Mon–Fri: {formatTime(schedule?.start_time || '10:00:00')} - {formatTime(schedule?.regular_end_time || '18:00:00')} • Sat: {formatTime(schedule?.start_time || '10:00:00')} - {formatTime(schedule?.saturday_end_time || '14:00:00')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Working Days: {schedule?.work_days ? schedule.work_days.join(', ') : 'Mon - Sat'} • Grace Period: {schedule?.grace_period_minutes ?? 15} mins
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 bg-white/80 border border-slate-200 px-3 py-2 rounded-lg text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px]">
              <strong>Auto Checkout:</strong> Mon–Fri <strong className="text-emerald-700">6:00 PM</strong> • Sat <strong className="text-indigo-700">2:00 PM</strong>
            </span>
          </div>
          {officeLocation && (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg text-indigo-900 text-[11px] font-semibold">
              <span>📍</span>
              <span><strong>Office Geofence:</strong> {officeLocation.name} ({officeLocation.radius_meters}m)</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching your attendance history...
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No attendance records logged yet today. Use the buttons above to check in.
          </div>
        ) : (
          <TablePrimitive
            headers={isAdmin ? ['Date', 'Check In', 'Check Out', 'Status', 'Notes', 'Action'] : ['Date', 'Check In', 'Check Out', 'Status', 'Notes']}
            rows={attendances.map((a) => {
              const row = [
                <span key="date" className="font-mono text-xs text-slate-900 font-bold">{formatDate(a.date)}</span>,
                <span key="in" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_in)}</span>,
                <span key="out" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_out)}</span>,
                <Badge key="status" variant={a.status === 'present' ? 'green' : a.status === 'late' ? 'amber' : a.status === 'on_leave' ? 'blue' : 'red'}>
                  {a.status === 'late' ? 'LATE' : a.status ? a.status.toUpperCase() : 'ABSENT'}
                </Badge>,
                <span key="notes" className={`text-xs ${a.status === 'late' ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                  {formatAttendanceNotes(a.notes)}
                </span>,
              ];

              if (isAdmin) {
                row.push(
                  <button
                    key="action"
                    onClick={() => handleOpenEditModal(a)}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                    title="Admin Edit Clock-In / Clock-Out"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                );
              }

              return row;
            })}
          />
        )}
      </div>

      {/* EDIT MODAL FOR ADMIN */}
      {isModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Edit Attendance (Admin Override)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Adjust check-in and check-out timestamps for {formatDate(formDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Clock In & Clock Out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clock-In Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={formCheckIn}
                    onChange={(e) => setFormCheckIn(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Clock-Out Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={formCheckOut}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attendance Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  required
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correction Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted by Admin"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
