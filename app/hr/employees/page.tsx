'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { fetchApi } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import Link from 'next/link';
import { Search, UserPlus, Filter, ChevronRight, Download } from '@/components/ui/Icon';

const DEFAULT_COMPANY_DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Product Management',
  'Marketing',
  'Finance',
  'Executive',
  'Sales',
  'Legal & Compliance',
  'Customer Success',
  'Operations',
];

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [companyDepartments, setCompanyDepartments] = useState<string[]>(DEFAULT_COMPANY_DEPARTMENTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Full Stack Developer');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [baseSalary, setBaseSalary] = useState('85000');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
    loadCompanyDepartments();
  }, [search, departmentFilter, statusFilter]);

  const loadCompanyDepartments = async () => {
    try {
      const res = await fetchApi('/departments');
      if (res.departments && Array.isArray(res.departments)) {
        setCompanyDepartments(res.departments);
      }
    } catch (e) {
      // Use default list if error
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (departmentFilter) queryParams.push(`department=${encodeURIComponent(departmentFilter)}`);
      if (statusFilter) queryParams.push(`status=${encodeURIComponent(statusFilter)}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetchApi(`/employees${queryString}`);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetchApi('/employees', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          role,
          department,
          designation,
          joining_date: joiningDate,
          base_salary: baseSalary,
          phone,
        }),
      });

      setToastMessage('Employee onboarded successfully with leave balances & salary structure!');
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadEmployees();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    if (employees.length === 0) {
      setToastMessage('No employee data available to export.');
      return;
    }
    const headers = ['Employee Name', 'Code', 'Email', 'Role', 'Department', 'Designation', 'Joining Date', 'Status', 'Phone'];
    const rows = employees.map((e) => [
      e.name,
      e.employee_code || `EMP00${e.id}`,
      e.email,
      e.role?.display_name || e.role?.name || 'Employee',
      e.department || 'N/A',
      e.designation || 'Staff',
      e.joining_date || 'N/A',
      e.status || 'active',
      e.phone || 'N/A',
    ]);
    exportToCSV('Organization_Workforce_Directory', headers, rows);
    setToastMessage('Workforce Directory exported to Excel CSV format successfully!');
  };

  return (
    <PortalLayout namespace="hr">
      <PageHeader
        title="Organization Employee Directory"
        description="Comprehensive workforce directory, department filters, onboarding profile creation, and record management"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Export employee records to Excel CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        }
      />

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, designation..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0f365e]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
          >
            <option value="">All Departments</option>
            {companyDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* EMPLOYEE GRID */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold animate-pulse">
          Fetching organization employees from database...
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-sm font-extrabold text-slate-800 mb-1">No Employee Records Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            No active workforce members match the selected filters or search terms.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Add First Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-[#0f365e] hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0f365e] text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                      {emp.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-sm truncate">{emp.name}</h3>
                      <p className="text-[11px] font-mono font-semibold text-[#0f365e]">{emp.employee_code || `EMP00${emp.id}`}</p>
                    </div>
                  </div>
                  <Badge variant={emp.status === 'active' ? 'green' : emp.status === 'on_leave' ? 'yellow' : 'red'}>
                    {emp.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Department</span>
                    <span className="font-bold text-slate-800">{emp.department || 'General'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Designation</span>
                    <span className="font-semibold text-slate-700">{emp.designation || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Role</span>
                    <span className="font-semibold text-slate-700 capitalize">{emp.role?.display_name || emp.role?.name || 'Employee'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Email</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate">{emp.email}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">
                  Joined {emp.joining_date ? String(emp.joining_date).split('T')[0].split(' ')[0] : 'N/A'}
                </span>
                <Link
                  href={`/employees/${emp.id}`}
                  className="text-xs font-extrabold text-[#0f365e] hover:underline flex items-center gap-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Onboard New Employee">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="e.g. Vikramaditya Singh"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="vikram@blueboxx.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="employee">Employee</option>
                <option value="team_leader">Team Leader</option>
                <option value="manager">Company Manager</option>
                <option value="hr">HR Specialist</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {companyDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Base Monthly Salary (₹)</label>
            <input
              type="number"
              required
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Creating Employee...' : 'Submit & Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </PortalLayout>
  );
}
