'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TablePrimitive } from '@/components/ui/TablePrimitive';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { Toast } from '@/components/ui/Toast';
import { Download, Plus, Edit3, X, Clock, CalendarDays } from '@/components/ui/Icon';
import { MonthlyAttendanceReportView } from '@/components/reports/MonthlyAttendanceReportView';
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

export default function AdminAttendancePage() {
  const [summary, setSummary] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'on_leave' | 'absent'>('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formUserId, setFormUserId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formCheckIn, setFormCheckIn] = useState<string>('');
  const [formCheckOut, setFormCheckOut] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('present');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Geofence Modal State
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [geofenceName, setGeofenceName] = useState('Main Office Headquarters');
  const [geofenceAddress, setGeofenceAddress] = useState('SF 02, INDIA BULLS MEGA MALL, Dinesh Mill Rd, near Swami Vivekananda Railway Over Bridge, Anand Nagar, Akota, Vadodara, Gujarat 390022');
  const [geofenceLat, setGeofenceLat] = useState('22.3039');
  const [geofenceLng, setGeofenceLng] = useState('73.1783');
  const [geofenceRadius, setGeofenceRadius] = useState('500');
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [savingGeofence, setSavingGeofence] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  const handleOpenGeofenceModal = async () => {
    try {
      const res = await fetchApi('/attendance/office-location');
      if (res?.office_location) {
        const loc = res.office_location;
        setGeofenceName(loc.name || 'Main Office Headquarters');
        setGeofenceAddress(loc.address || '');
        setGeofenceLat(String(loc.latitude || '22.3039'));
        setGeofenceLng(String(loc.longitude || '73.1783'));
        setGeofenceRadius(String(loc.radius_meters || '500'));
        setGeofenceEnabled(loc.enabled !== false);
      }
    } catch (err) {
      // fallback
    }
    setIsGeofenceModalOpen(true);
  };

  const handleUseCurrentGps = async () => {
    setFetchingGps(true);
    try {
      const coords = await getCurrentLocation();
      setGeofenceLat(coords.latitude.toFixed(6));
      setGeofenceLng(coords.longitude.toFixed(6));
      const srcText = coords.source === 'ip' ? ' (approximate via network/IP)' : ' via device GPS';
      setToastMessage(`Current location coordinates fetched${srcText}!`);
    } catch (err: any) {
      setToastMessage(err.message || 'Could not fetch device GPS.');
    } finally {
      setFetchingGps(false);
    }
  };

  const handleSaveGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeofence(true);
    try {
      const res = await fetchApi('/attendance/office-location', {
        method: 'POST',
        body: JSON.stringify({
          name: geofenceName,
          address: geofenceAddress,
          latitude: parseFloat(geofenceLat),
          longitude: parseFloat(geofenceLng),
          radius_meters: parseInt(geofenceRadius, 10),
          enabled: geofenceEnabled,
        }),
      });
      setToastMessage(res?.message || 'Office geofence updated successfully!');
      setIsGeofenceModalOpen(false);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to save office geofence.');
    } finally {
      setSavingGeofence(false);
    }
  };

  useEffect(() => {
    loadData();
    loadEmployees();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, histRes] = await Promise.all([
        fetchApi('/attendance/summary').catch(() => null),
        fetchApi('/attendance/history').catch(() => ({ attendances: [] })),
      ]);
      setSummary(sumRes?.summary || null);
      setAttendances(histRes?.attendances || []);
    } catch (err) {
      setToastMessage('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchApi('/employees');
      setEmployees(res?.employees || []);
    } catch (err) {
      // Fallback
    }
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      setFormUserId(String(record.user_id));
      setFormDate(formatDate(record.date));
      setFormCheckIn(record.check_in ? record.check_in.substring(0, 5) : '');
      setFormCheckOut(record.check_out ? record.check_out.substring(0, 5) : '');
      setFormStatus(record.status || 'present');
      setFormNotes(record.notes || '');
    } else {
      setEditingRecord(null);
      setFormUserId(employees.length > 0 ? String(employees[0].id) : '');
      setFormDate(getTodayStr());
      setFormCheckIn('09:00');
      setFormCheckOut('18:00');
      setFormStatus('present');
      setFormNotes('Manual entry by Admin');
    }
    setIsModalOpen(true);
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId) {
      setToastMessage('Please select an employee');
      return;
    }
    if (!formDate) {
      setToastMessage('Please select a date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/attendance/correction', {
        method: 'POST',
        body: JSON.stringify({
          user_id: Number(formUserId),
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

  const handleExportExcel = () => {
    if (filteredAttendances.length === 0) {
      setToastMessage('No attendance records available to export.');
      return;
    }
    const headers = ['Date', 'Employee Name', 'Employee Code', 'Check In', 'Check Out', 'Status', 'Notes'];
    const rows = filteredAttendances.map((a) => [
      formatDate(a.date),
      a.user?.name || `Employee #${a.user_id}`,
      a.user?.employee_code || '',
      formatTime(a.check_in),
      formatTime(a.check_out),
      a.status || 'present',
      a.notes || 'N/A',
    ]);
    exportToCSV('Admin_Attendance_Register', headers, rows);
    setToastMessage('Attendance Register exported to Excel CSV format successfully!');
  };

  const filteredAttendances = attendances.filter((a) => {
    if (statusFilter === 'all') return true;
    const itemDate = formatDate(a.date);
    const todayStr = getTodayStr();
    if (statusFilter === 'present') {
      return (a.status === 'present' || a.status === 'late') && itemDate === todayStr;
    }
    return a.status === statusFilter && itemDate === todayStr;
  });

  if (viewMode === 'monthly') {
    return (
      <PortalLayout namespace="admin">
        <PageHeader
          title="Admin Monthly Attendance Register & Archive"
          description="System-wide monthly attendance logs, employee performance ratings, working hours, and persistent stored reports"
          action={
            <button
              onClick={() => setViewMode('daily')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Return to Daily Attendance Register</span>
            </button>
          }
        />
        <MonthlyAttendanceReportView onNavigateBack={() => setViewMode('daily')} />
      </PortalLayout>
    );
  }

  return (
    <PortalLayout namespace="admin">
      <PageHeader
        title="Admin Attendance Register"
        description="System-wide attendance logs, check-in/out timestamps, punctuality stats, and manual corrections"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenGeofenceModal}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
              title="Configure Office GPS Coordinates & 500m Geofencing Radius"
            >
              <span className="text-xs">📍</span>
              <span>Office Geofence</span>
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
              title="Open monthly attendance report with employee performance ratings and persistent storage"
            >
              <CalendarDays className="w-4 h-4 text-purple-600" />
              <span>Monthly Report</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 active:scale-95 font-bold text-xs rounded-xl shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
              title="Export attendance records to Excel CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer"
              title="Add or edit user attendance record"
            >
              <Plus className="w-4 h-4" />
              <span>+ Manual Entry</span>
            </button>
          </div>
        }
      />

      {/* INTERACTIVE SUMMARY CARDS */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                : 'bg-white text-slate-900 border-slate-200 shadow-2xs hover:border-slate-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                Total Active
              </p>
              <span className="text-[10px] font-semibold opacity-75">All</span>
            </div>
            <p className="text-2xl font-extrabold mt-1">{summary.total_employees}</p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'present'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'present' ? 'text-emerald-100' : 'text-slate-400'}`}>
                Present Today
              </p>
              {statusFilter === 'present' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'present' ? 'text-white' : 'text-emerald-600'}`}>
              {summary.present_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'late'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'late' ? 'text-amber-100' : 'text-slate-400'}`}>
                Late Check-ins
              </p>
              {statusFilter === 'late' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'late' ? 'text-white' : 'text-amber-600'}`}>
              {summary.late_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'on_leave' ? 'all' : 'on_leave')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'on_leave'
                ? 'bg-sky-700 text-white border-sky-700 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'on_leave' ? 'text-sky-100' : 'text-slate-400'}`}>
                On Leave
              </p>
              {statusFilter === 'on_leave' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'on_leave' ? 'text-white' : 'text-[#0f365e]'}`}>
              {summary.on_leave_today}
            </p>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              statusFilter === 'absent'
                ? 'bg-rose-700 text-white border-rose-700 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 shadow-2xs hover:border-rose-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'absent' ? 'text-rose-100' : 'text-slate-400'}`}>
                Absent Today
              </p>
              {statusFilter === 'absent' && <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">Filtered</span>}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${statusFilter === 'absent' ? 'text-white' : 'text-rose-600'}`}>
              {summary.absent_today}
            </p>
          </div>
        </div>
      )}

      {/* FILTER ACTIVE RESET BANNER */}
      {statusFilter !== 'all' && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-xl mb-4 text-xs font-semibold text-indigo-900 shadow-2xs">
          <span>Filtering today's logs by status: <strong className="uppercase font-extrabold tracking-wide">{statusFilter.replace('_', ' ')} TODAY</strong></span>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-indigo-700 hover:text-indigo-950 font-extrabold underline cursor-pointer"
          >
            Clear Filter (Show All History)
          </button>
        </div>
      )}

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            Fetching organization attendance history...
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No attendance records found matching status filter "{statusFilter.toUpperCase()}".
          </div>
        ) : (
          <TablePrimitive
            headers={['Date', 'Employee', 'Check In', 'Check Out', 'Status', 'Notes', 'Action']}
            rows={filteredAttendances.map((a) => [
              <span key="date" className="font-mono text-xs text-slate-900 font-bold">{formatDate(a.date)}</span>,
              <div key="user">
                <p className="font-bold text-slate-900 text-xs">{a.user?.name || `Employee #${a.user_id}`}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.user?.employee_code || ''}</p>
              </div>,
              <span key="in" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_in)}</span>,
              <span key="out" className="font-mono text-xs text-slate-800 font-semibold">{formatTime(a.check_out)}</span>,
              <Badge key="status" variant={a.status === 'present' ? 'green' : a.status === 'late' ? 'amber' : a.status === 'on_leave' ? 'blue' : 'red'}>
                {a.status === 'late' ? 'LATE' : a.status ? a.status.toUpperCase() : 'ABSENT'}
              </Badge>,
              <span key="notes" className={`text-xs ${a.status === 'late' ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                {formatAttendanceNotes(a.notes)}
              </span>,
              <button
                key="action"
                onClick={() => handleOpenModal(a)}
                className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Edit Clock-In / Clock-Out times for this employee"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>,
            ])}
          />
        )}
      </div>

      {/* EDIT / MANUAL CORRECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingRecord ? 'Edit Clock-In / Clock-Out' : 'Manual Attendance Entry'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Adjust employee check-in and check-out timestamps
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
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {editingRecord ? (
                  <input
                    type="text"
                    disabled
                    value={editingRecord.user?.name ? `${editingRecord.user.name} (${editingRecord.user.employee_code || `#${editingRecord.user_id}`})` : `Employee #${editingRecord.user_id}`}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-semibold cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    required
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.employee_code ? `(${emp.employee_code})` : ''} - {emp.designation || 'Employee'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attendance Date <span className="text-rose-500">*</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Leave empty if absent</span>
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
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Leave empty if ongoing</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attendance Status <span className="text-rose-500">*</span>
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
                  placeholder="e.g. System glitch, manual approval by HR"
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

      {/* OFFICE GEOFENCE SETTINGS MODAL */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📍</span>
                <div>
                  <h3 className="font-black text-sm text-white">Office Location & Geofence</h3>
                  <p className="text-[11px] text-slate-300">
                    Employees can only clock in when physically within this perimeter
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveGeofence} className="p-6 space-y-4">
              {/* Geofence Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Enforce Office Location Geofence</h4>
                  <p className="text-[11px] text-indigo-700">Block clock-in if employee is outside the allowed office radius</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={geofenceEnabled}
                    onChange={(e) => setGeofenceEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Office Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={geofenceName}
                  onChange={(e) => setGeofenceName(e.target.value)}
                  placeholder="e.g. Main Office Headquarters"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Office Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={geofenceAddress}
                  onChange={(e) => setGeofenceAddress(e.target.value)}
                  placeholder="e.g. SF 02, INDIA BULLS MEGA MALL, Akota, Vadodara"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* GPS Coordinates & Fetch Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    GPS Coordinates (Latitude & Longitude) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={fetchingGps}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <span>{fetchingGps ? '📍 Fetching GPS...' : '📍 Use My Current Location'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={geofenceLat}
                      onChange={(e) => setGeofenceLat(e.target.value)}
                      placeholder="22.295500"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={geofenceLng}
                      onChange={(e) => setGeofenceLng(e.target.value)}
                      placeholder="73.176400"
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Allowed Radius in Meters */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Allowed Geofence Radius (Meters) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-extrabold text-indigo-700">{geofenceRadius} meters</span>
                </div>
                <input
                  type="number"
                  min="20"
                  max="10000"
                  required
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">Quick Presets:</span>
                  {[100, 200, 300, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGeofenceRadius(String(preset))}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-all ${
                        geofenceRadius === String(preset)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset >= 1000 ? `${preset / 1000}km` : `${preset}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGeofence}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingGeofence ? 'Saving Settings...' : 'Save Geofence'}
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
