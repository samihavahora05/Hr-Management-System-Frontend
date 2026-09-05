'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Task, TaskMetrics, TaskUser, SubTask } from '@/lib/types/task';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Trash2,
  CheckSquare,
  Tag,
  Kanban,
  LayoutList,
  X,
  ChevronRight,
  Pencil,
  Edit,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
} from '@/components/ui/Icon';

interface TaskManagerProps {
  portalScope?: 'hr' | 'manager' | 'team_leader' | 'employee' | 'admin';
}

export function TaskManager({ portalScope = 'employee' }: TaskManagerProps) {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const isEmployeeMode = portalScope === 'employee' || userRole === 'employee';
  const isHRMode = portalScope === 'hr' || userRole === 'hr';
  const isManagerMode = portalScope === 'manager' || userRole === 'manager';
  const isTeamLeaderMode = portalScope === 'team_leader' || userRole === 'team_leader';
  const isAdminMode = portalScope === 'admin' || userRole === 'admin';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics>({
    total: 0,
    todo: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    completion_rate: 0,
  });
  const [assignableUsers, setAssignableUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [activeTab, setActiveTab] = useState<'assigned_to_me' | 'assigned_by_me' | 'all'>(
    isEmployeeMode ? 'assigned_to_me' : 'all'
  );
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Modals & Selection
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Create Task Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<string | number>('');
  const [formCategory, setFormCategory] = useState('general');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formSubtasks, setFormSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Edit Task Form State
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editFormTitle, setEditFormTitle] = useState('');
  const [editFormDescription, setEditFormDescription] = useState('');
  const [editFormAssignedTo, setEditFormAssignedTo] = useState<string | number>('');
  const [editFormCategory, setEditFormCategory] = useState('general');
  const [editFormPriority, setEditFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [editFormStatus, setEditFormStatus] = useState<'todo' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'>('todo');
  const [editFormDueDate, setEditFormDueDate] = useState('');
  const [editFormNotes, setEditFormNotes] = useState('');
  const [editFormSubtasks, setEditFormSubtasks] = useState<SubTask[]>([]);
  const [editNewSubtaskInput, setEditNewSubtaskInput] = useState('');

  useEffect(() => {
    loadTasks();
    if (!isEmployeeMode) {
      loadAssignableUsers();
    }
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, assigneeFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let queryStr = `?scope=${activeTab}`;
      if (statusFilter !== 'all') queryStr += `&status=${statusFilter}`;
      if (priorityFilter !== 'all') queryStr += `&priority=${priorityFilter}`;
      if (categoryFilter !== 'all') queryStr += `&category=${categoryFilter}`;
      if (assigneeFilter !== 'all') queryStr += `&assigned_to=${assigneeFilter}`;
      if (searchQuery) queryStr += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetchApi(`/tasks${queryStr}`);
      setTasks(res.tasks || []);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err: any) {
      setToastMessage('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignableUsers = async () => {
    try {
      const res = await fetchApi('/tasks/assignable-users');
      setAssignableUsers(res.users || []);
      if (res.users && res.users.length > 0 && !formAssignedTo) {
        setFormAssignedTo(res.users[0].id);
      }
    } catch (err) {
      console.error('Failed to load assignable users', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskInput.trim()) return;
    setFormSubtasks([
      ...formSubtasks,
      { id: Date.now(), text: newSubtaskInput.trim(), completed: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtaskItem = (id: string | number) => {
    setFormSubtasks(formSubtasks.filter((st) => st.id !== id));
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('general');
    setFormPriority('medium');
    setFormDueDate('');
    setFormNotes('');
    setFormSubtasks([]);
    setNewSubtaskInput('');
    if (assignableUsers.length > 0) {
      setFormAssignedTo(assignableUsers[0].id);
    }
  };

  const openEditModal = (task: Task) => {
    if (assignableUsers.length === 0) {
      loadAssignableUsers();
    }
    const assignedId =
      typeof task.assigned_to === 'object' && task.assigned_to !== null
        ? (task.assigned_to as any).id
        : (task.assignedTo?.id || task.assigned_to || '');

    setEditTaskId(task.id);
    setEditFormTitle(task.title || '');
    setEditFormDescription(task.description || '');
    setEditFormAssignedTo(assignedId);
    setEditFormCategory(task.category || 'general');
    setEditFormPriority(task.priority || 'medium');
    setEditFormStatus(task.status || 'todo');
    setEditFormDueDate(task.due_date ? String(task.due_date).substring(0, 10) : '');
    setEditFormNotes(task.notes || '');
    setEditFormSubtasks(
      Array.isArray(task.subtasks)
        ? task.subtasks.map((st) => ({
            id: st.id,
            text: st.text || (st as any).title || '',
            completed: Boolean(st.completed),
          }))
        : []
    );
    setEditNewSubtaskInput('');
    setIsEditModalOpen(true);
  };

  const handleEditAddSubtaskItem = () => {
    if (!editNewSubtaskInput.trim()) return;
    setEditFormSubtasks([
      ...editFormSubtasks,
      { id: Date.now(), text: editNewSubtaskInput.trim(), completed: false },
    ]);
    setEditNewSubtaskInput('');
  };

  const handleEditRemoveSubtaskItem = (id: string | number) => {
    setEditFormSubtasks(editFormSubtasks.filter((st) => st.id !== id));
  };

  const handleEditToggleSubtaskItem = (id: string | number) => {
    setEditFormSubtasks(
      editFormSubtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskId) return;

    setEditSubmitting(true);
    try {
      const res = await fetchApi(`/tasks/${editTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editFormTitle,
          description: editFormDescription,
          assigned_to: editFormAssignedTo,
          category: editFormCategory,
          priority: editFormPriority,
          status: editFormStatus,
          due_date: editFormDueDate || null,
          notes: editFormNotes || null,
          subtasks: editFormSubtasks,
        }),
      });

      const updatedTask = res.task;
      setTasks((prev) => prev.map((t) => (t.id === editTaskId ? (updatedTask || { ...t, title: editFormTitle }) : t)));
      if (selectedTask && selectedTask.id === editTaskId) {
        setSelectedTask(updatedTask);
      }

      setToastMessage('Task updated successfully!');
      setIsEditModalOpen(false);
      await loadTasks();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update task');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = formAssignedTo || user?.id;
    if (!targetUserId) {
      setToastMessage('Please select an employee to assign this task');
      return;
    }

    setSubmitting(true);
    try {
      await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          assigned_to: targetUserId,
          category: formCategory,
          priority: formPriority,
          due_date: formDueDate || null,
          notes: formNotes || null,
          subtasks: formSubtasks,
        }),
      });

      setToastMessage('Task created & assigned successfully!');
      setIsCreateModalOpen(false);
      resetForm();
      setActiveTab('all');
      await loadTasks();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetchApi(`/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      
      const isComplete = newStatus === 'completed';
      setToastMessage(
        isComplete
          ? '🎉 Task marked as Completed!'
          : `Task status updated to ${newStatus.replace('_', ' ')}`
      );

      const updatedTask = res?.task;
      // Update local state smoothly
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? (updatedTask || { ...t, status: newStatus as any }) : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? (updatedTask || { ...prev, status: newStatus as any }) : null));
      }
      loadTasks();
    } catch (err: any) {
      setToastMessage(err.message || 'Status update failed');
    }
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string | number) => {
    if (!canUpdateTaskStatus(task)) {
      setToastMessage('Only the assigned employee or management can update checklist items.');
      return;
    }
    try {
      const res = await fetchApi(`/tasks/${task.id}/toggle-subtask`, {
        method: 'POST',
        body: JSON.stringify({ subtask_id: subtaskId }),
      });
      const updatedTask = res.task;

      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(updatedTask);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Subtask toggle failed');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setIsDetailModalOpen(false);
      setSelectedTask(null);
      const res = await fetchApi(`/tasks/${taskId}`, { method: 'DELETE' });
      setToastMessage(res?.message || 'Task deleted successfully');
      await loadTasks();
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to delete task');
      await loadTasks();
    }
  };

  // Helper getters for badges
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      case 'medium':
        return 'bg-sky-100 text-sky-800 border-sky-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const isTaskAssignee = (task: Task) => {
    if (!user || !user.id) return false;
    const assignedId =
      typeof task.assigned_to === 'object' && task.assigned_to !== null
        ? (task.assigned_to as any).id
        : (task.assignedTo?.id || task.assigned_to);
    return Number(assignedId) === Number(user.id);
  };

  const canManageTask = (task?: Task | null) => {
    if (isAdminMode || isHRMode || isManagerMode || isTeamLeaderMode) return true;
    if (task && user?.id && Number(task.assigner_id) === Number(user.id)) return true;
    return false;
  };

  const canUpdateTaskStatus = (task: Task) => {
    return isTaskAssignee(task) || canManageTask(task);
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'todo' && t.status !== 'todo') return false;
      if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && t.status !== 'completed') return false;
      if (statusFilter === 'overdue' && t.status !== 'overdue') return false;
      if (statusFilter === 'cancelled' && t.status !== 'cancelled') return false;
    }

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    if (assigneeFilter !== 'all') {
      const assignedId =
        typeof t.assigned_to === 'object' && t.assigned_to !== null
          ? (t.assigned_to as any).id
          : (t.assignedTo?.id || t.assigned_to);
      if (Number(assignedId) !== Number(assigneeFilter)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignedTo?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* TOP METRIC DASHBOARD WIDGETS (CLICKABLE FILTERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs ${
            statusFilter === 'all'
              ? 'bg-slate-900 border-slate-900 text-white shadow-md -translate-y-0.5'
              : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-200' : 'text-slate-500'}`}>
              {isEmployeeMode ? 'My Tasks' : 'Total Tasks'}
            </span>
            <ListTodo className={`w-4 h-4 ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${statusFilter === 'all' ? 'text-white' : 'text-slate-900'}`}>{metrics.total || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('todo')}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs ${
            statusFilter === 'todo'
              ? 'bg-amber-500 border-amber-600 text-white shadow-md -translate-y-0.5'
              : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'todo' ? 'text-amber-100' : 'text-amber-600'}`}>To Do</span>
            <Clock className={`w-4 h-4 ${statusFilter === 'todo' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${statusFilter === 'todo' ? 'text-white' : 'text-amber-600'}`}>{metrics.todo || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in_progress')}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs ${
            statusFilter === 'in_progress'
              ? 'bg-indigo-600 border-indigo-700 text-white shadow-md -translate-y-0.5'
              : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'in_progress' ? 'text-indigo-100' : 'text-indigo-600'}`}>In Progress</span>
            <Tag className={`w-4 h-4 ${statusFilter === 'in_progress' ? 'text-white' : 'text-indigo-500'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${statusFilter === 'in_progress' ? 'text-white' : 'text-indigo-600'}`}>{metrics.in_progress || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-md -translate-y-0.5'
              : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'completed' ? 'text-emerald-100' : 'text-emerald-600'}`}>Completed</span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'completed' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${statusFilter === 'completed' ? 'text-white' : 'text-emerald-600'}`}>{metrics.completed || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('overdue')}
          className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs ${
            statusFilter === 'overdue'
              ? 'bg-rose-600 border-rose-700 text-white shadow-md -translate-y-0.5'
              : 'bg-white border-rose-200 bg-rose-50/30 hover:border-rose-400 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'overdue' ? 'text-rose-100' : 'text-rose-600'}`}>Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${statusFilter === 'overdue' ? 'text-white' : 'text-rose-500'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${statusFilter === 'overdue' ? 'text-white' : 'text-rose-600'}`}>{metrics.overdue || 0}</p>
        </button>
      </div>

      {/* HEADER & ACTION BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* NAVIGATION TABS / TITLE */}
          <div className="flex items-center gap-2">
            {!isEmployeeMode ? (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-[#0f365e] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAdminMode ? 'All Organization Tasks' : isHRMode ? 'All HR Scope Tasks' : 'Team Member Tasks'}
                </button>

                <button
                  onClick={() => setActiveTab('assigned_to_me')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'assigned_to_me'
                      ? 'bg-white text-[#0f365e] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Personal Tasks
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-extrabold rounded-lg">
                  📋 Employee Work Todo List
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (Assigned by Management)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-500'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                title="Kanban Board View"
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-500'
                }`}
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>

            {/* CREATE / ASSIGN TASK BUTTON FOR ADMIN / HR / MANAGER */}
            {!isEmployeeMode && (
              <button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdminMode ? 'Create / Assign Task' : isHRMode ? 'Assign Task to Employee' : 'Assign Task to Team Member'}</span>
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search task title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f365e]"
            />
          </form>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="project">Project Work</option>
              <option value="compliance">HR & Compliance</option>
              <option value="onboarding">Onboarding / Training</option>
              <option value="review">Review & Feedback</option>
            </select>
          </div>
        </div>
      </div>

      {/* TASK LIST OR KANBAN DISPLAY */}
      {loading ? (
        <div className="py-16 text-center text-xs font-semibold text-slate-400 animate-pulse">
          Fetching assigned work tasks & loading pipeline...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-extrabold text-slate-800 mb-1">No Tasks to Display</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {isEmployeeMode
              ? 'You currently have no active work items assigned to you. Outstanding tasks from Management will appear here.'
              : 'No tasks matching your current selection filter.'}
          </p>
          {!isEmployeeMode && (
            <div className="flex items-center justify-center gap-2">
              {activeTab !== 'all' && (
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                    setAssigneeFilter('all');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  View All Organization Tasks
                </button>
              )}
              <button
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Assign New Work Task
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Task Work Details</th>
                  {!isEmployeeMode && <th className="py-3 px-4">Assigned Employee</th>}
                  <th className="py-3 px-4">Assigned By</th>
                  <th className="py-3 px-4">Priority & Category</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Subtasks Progress</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-center">Actions & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.map((task) => {
                  const subtasks = task.subtasks || [];
                  const completedSubtasks = subtasks.filter((s) => s.completed).length;
                  const totalSubtasks = subtasks.length;
                  const progressPct =
                    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                  const isOverdue =
                    task.due_date &&
                    new Date(task.due_date) < new Date(new Date().toDateString()) &&
                    task.status !== 'completed' &&
                    task.status !== 'cancelled';

                  const assignedEmployeeName =
                    task.assignedTo?.name ||
                    (typeof task.assigned_to === 'object' && task.assigned_to !== null ? ((task.assigned_to as any)?.name || `Employee #${(task.assigned_to as any)?.id || ''}`) : (task.assigned_to ? `Employee #${task.assigned_to}` : 'Unassigned'));
                  const assignerName = task.assigner?.name || (typeof task.assigner_id === 'object' && task.assigner_id !== null ? ((task.assigner_id as any)?.name || `User #${(task.assigner_id as any)?.id || ''}`) : (task.assigner_id ? `User #${task.assigner_id}` : 'System Admin'));

                  const userCanManage = canManageTask(task);
                  const userCanUpdateStatus = canUpdateTaskStatus(task);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* TITLE & DESC */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            disabled={!userCanUpdateStatus}
                            checked={task.status === 'completed'}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (!userCanUpdateStatus) return;
                              handleStatusChange(
                                task.id,
                                task.status === 'completed' ? 'todo' : 'completed'
                              );
                            }}
                            title={userCanUpdateStatus ? 'Toggle completion status' : 'Only assigned employee or admin can update status'}
                            className={`mt-0.5 w-4 h-4 rounded border-slate-300 ${
                              userCanUpdateStatus ? 'text-[#0f365e] cursor-pointer' : 'text-slate-300 cursor-not-allowed opacity-40'
                            }`}
                          />
                          <div>
                            <p
                              className={`font-bold text-slate-900 text-xs ${
                                task.status === 'completed' ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {task.description}
                              </p>
                            )}
                            {task.last_edited_at && (
                              <div
                                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-850 rounded-md text-[10px] font-semibold"
                                title={task.last_edit_summary ? `Admin updates: ${task.last_edit_summary}` : 'Task was edited by management'}
                              >
                                <History className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>
                                  Edited by {task.lastEditor?.name || 'Admin'} ({new Date(task.last_edited_at).toLocaleDateString()})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ASSIGNED TO (Hidden for Employee mode) */}
                      {!isEmployeeMode && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0f365e] text-white font-bold text-[10px] flex items-center justify-center">
                              {assignedEmployeeName[0]}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-800">{assignedEmployeeName}</span>
                              <span className="block text-[9px] text-slate-400 capitalize">
                                {task.assignedTo?.department || 'Corporate Staff'}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* ASSIGNED BY */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span className="font-semibold text-slate-800">{assignerName}</span>
                        <span className="block text-[9px] font-bold text-indigo-600 capitalize">
                          {task.assigner?.role?.display_name || 'HR / Manager'}
                        </span>
                      </td>

                      {/* PRIORITY & CATEGORY */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] border capitalize w-fit ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority} Priority
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium capitalize">
                            {task.category}
                          </span>
                        </div>
                      </td>

                      {/* DUE DATE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.due_date ? (
                          <div
                            className={`flex items-center gap-1 text-xs font-semibold ${
                              isOverdue ? 'text-rose-600 font-extrabold' : 'text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{task.due_date}</span>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 rounded-xs bg-rose-100 text-rose-700 text-[9px]">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* SUBTASKS PROGRESS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {totalSubtasks > 0 ? (
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span>Checklist</span>
                              <span>
                                {completedSubtasks}/{totalSubtasks}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  progressPct === 100 ? 'bg-emerald-500' : 'bg-[#0f365e]'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No subtasks</span>
                        )}
                      </td>

                      {/* STATUS DISPLAY (EDITABLE BY ASSIGNEE OR MANAGEMENT) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {userCanUpdateStatus ? (() => {
                          const curr = ((task.status as any) === 'pending' ? 'todo' : task.status) as string;
                          const isTodo = curr === 'todo';
                          const isInProgress = curr === 'in_progress' || curr === 'under_review' || curr === 'overdue';
                          const isCompleted = curr === 'completed' || curr === 'cancelled';
                          const hasIncompleteSubtasks = !userCanManage && task.subtasks && task.subtasks.length > 0 && task.subtasks.some((s) => !s.completed);

                          return (
                            <select
                              value={curr}
                              onChange={(e) => {
                                const target = e.target.value;
                                if (target === 'completed' && hasIncompleteSubtasks) {
                                  setToastMessage('Please complete all checklist subtasks first.');
                                  return;
                                }
                                handleStatusChange(task.id, target);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize cursor-pointer focus:outline-hidden ${getStatusBadge(
                                task.status
                              )}`}
                            >
                              <option value="todo" disabled={!isTodo && !userCanManage}>To Do</option>
                              <option value="in_progress" disabled={isCompleted && !userCanManage}>In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled" disabled={isCompleted && !userCanManage}>Cancelled</option>
                            </select>
                          );
                        })() : (
                          <span
                            title="Status view only"
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status === 'todo' ? 'To Do' : task.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS & COMPLETE BUTTON */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {task.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Done
                            </span>
                          ) : userCanUpdateStatus ? (
                            <button
                              onClick={() => {
                                const hasIncompleteSubtasks = !userCanManage && task.subtasks && task.subtasks.length > 0 && task.subtasks.some((s) => !s.completed);
                                if (hasIncompleteSubtasks) {
                                  setToastMessage('Please complete all checklist subtasks first.');
                                  return;
                                }
                                handleStatusChange(task.id, 'completed');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Mark task as completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              View only
                            </span>
                          )}

                          {userCanManage && (
                            <>
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                title="Edit task details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                title="Delete task from system"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 w-full">
          {[
            { id: 'todo', title: 'To Do', color: 'border-amber-400 bg-amber-50/30' },
            { id: 'in_progress', title: 'In Progress', color: 'border-indigo-400 bg-indigo-50/30' },
            { id: 'completed', title: 'Completed', color: 'border-emerald-400 bg-emerald-50/30' },
            { id: 'cancelled', title: 'Cancelled', color: 'border-slate-300 bg-slate-50/50' },
          ].map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id || (column.id === 'todo' && (t.status as any) === 'pending') || (column.id === 'in_progress' && (t.status as any) === 'under_review'));

            return (
              <div
                key={column.id}
                className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col h-full min-h-[300px] sm:min-h-[400px] min-w-0"
              >
                <div className={`p-2.5 mb-3 rounded-lg border ${column.color} flex items-center justify-between`}>
                  <h4 className="font-extrabold text-slate-800 text-xs">{column.title}</h4>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-800 text-[10px] font-bold flex items-center justify-center shadow-2xs">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.map((task) => {
                    const assignedEmployeeName =
                      task.assignedTo?.name || `User #${task.assigned_to}`;
                    const subtasks = task.subtasks || [];
                    const doneSubtasks = subtasks.filter((s) => s.completed).length;
                    const userCanManage = canManageTask(task);
                    const userCanUpdateStatus = canUpdateTaskStatus(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] border capitalize ${getPriorityBadge(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold capitalize">
                              {task.category}
                            </span>
                          </div>

                          {userCanManage && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit task"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <h5 className="font-bold text-slate-900 text-xs group-hover:text-[#0f365e] transition-colors leading-snug">
                          {task.title}
                        </h5>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
                        )}

                        {subtasks.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-md w-fit">
                            <CheckSquare className="w-3 h-3 text-slate-400" />
                            <span>
                              {doneSubtasks} / {subtasks.length} checklist
                            </span>
                          </div>
                        )}

                        {task.last_edited_at && (
                          <div
                            className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[10px] font-semibold w-fit"
                            title={task.last_edit_summary ? `Admin updates: ${task.last_edit_summary}` : 'Task was edited by management'}
                          >
                            <History className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate max-w-[170px]">
                              Edited by {task.lastEditor?.name || 'Admin'}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#0f365e] text-white text-[9px] font-bold flex items-center justify-center">
                              {assignedEmployeeName[0]}
                            </div>
                            <span className="font-medium text-slate-700 truncate max-w-[90px]">
                              {assignedEmployeeName}
                            </span>
                          </div>

                          {task.status !== 'completed' && userCanUpdateStatus && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task.id, 'completed');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-md shadow-2xs transition-colors cursor-pointer"
                            >
                              Submit Done
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & ASSIGN TASK MODAL (FOR ADMIN / HR / MANAGER) */}
      {!isEmployeeMode && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={isAdminMode ? 'Admin Create & Assign Task' : isHRMode ? 'HR Assign Task to Employee' : 'Manager Assign Task to Team Member'}
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAdminMode || isHRMode ? 'Select Employee (Organization-Wide) *' : 'Select Team Member *'}
              </label>
              <select
                required
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
              >
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department || 'Staff'} — {u.role?.display_name || 'Employee'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Prepare Quarterly Performance Evaluation & Submit Documents"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description & Scope</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Detailed work instructions for the employee..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="general">General Task</option>
                  <option value="project">Project Work</option>
                  <option value="compliance">HR & Compliance</option>
                  <option value="onboarding">Onboarding / Training</option>
                  <option value="review">Review & Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* SUBTASKS / CHECKLIST BUILDER */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtasks / Checklist Items</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add actionable subtask item..."
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtaskItem();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubtaskItem}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                >
                  Add Item
                </button>
              </div>

              {formSubtasks.length > 0 && (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {formSubtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-md border border-slate-100">
                      <span className="text-slate-700">{st.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtaskItem(st.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes / Instructions</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Please attach finalized sheet in documents section..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#0f365e] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Assigning Task...' : 'Create & Assign Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT TASK MODAL (FOR ADMIN & MANAGEMENT) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Task #${editTaskId || ''}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Employee *
            </label>
            <select
              required
              value={editFormAssignedTo}
              onChange={(e) => setEditFormAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
            >
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.department || 'Staff'} — {u.role?.display_name || 'Employee'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={editFormTitle}
              onChange={(e) => setEditFormTitle(e.target.value)}
              placeholder="Task Title..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              rows={3}
              value={editFormDescription}
              onChange={(e) => setEditFormDescription(e.target.value)}
              placeholder="Detailed instructions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={editFormPriority}
                onChange={(e) => setEditFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={editFormCategory}
                onChange={(e) => setEditFormCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="general">General Task</option>
                <option value="project">Project Work</option>
                <option value="compliance">HR & Compliance</option>
                <option value="onboarding">Onboarding / Training</option>
                <option value="review">Review & Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editFormStatus}
                onChange={(e) => setEditFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs capitalize"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={editFormDueDate}
                onChange={(e) => setEditFormDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* SUBTASKS / CHECKLIST BUILDER */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Subtasks / Checklist Items</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add subtask item..."
                value={editNewSubtaskInput}
                onChange={(e) => setEditNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleEditAddSubtaskItem();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleEditAddSubtaskItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
              >
                Add Item
              </button>
            </div>

            {editFormSubtasks.length > 0 && (
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-40 overflow-y-auto">
                {editFormSubtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-md border border-slate-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleEditToggleSubtaskItem(st.id)}
                        className="w-3.5 h-3.5 text-[#0f365e] rounded border-slate-300 cursor-pointer"
                      />
                      <span className={st.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-medium'}>
                        {st.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditRemoveSubtaskItem(st.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes / Instructions</label>
            <input
              type="text"
              value={editFormNotes}
              onChange={(e) => setEditFormNotes(e.target.value)}
              placeholder="e.g. Please attach finalized sheet in documents section..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-2 bg-[#0f365e] hover:bg-[#164677] text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {editSubmitting ? 'Saving...' : 'Save Task Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TASK DETAIL & ACTION MODAL */}
      {selectedTask && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          title={`Task #${selectedTask.id}: ${selectedTask.title}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* ADMIN / MANAGEMENT REVISION & UPDATE NOTICE (PROMINENTLY DISPLAYED TO ASSIGNED EMPLOYEE & ALL VIEWERS) */}
            {(selectedTask.last_edited_at || selectedTask.last_edit_summary || (selectedTask.edit_history && selectedTask.edit_history.length > 0)) && (
              <div className="rounded-xl border-2 border-amber-300 bg-linear-to-r from-amber-50 via-orange-50/40 to-amber-50 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Management Revision Notice
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                          Updated by {selectedTask.lastEditor?.name || 'Management'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        This task was modified on{' '}
                        <span className="font-bold">
                          {selectedTask.last_edited_at
                            ? new Date(selectedTask.last_edited_at).toLocaleString()
                            : 'recently'}
                        </span>
                        . Review the updated details below so there is full alignment.
                      </p>
                    </div>
                  </div>

                  {selectedTask.edit_history && selectedTask.edit_history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{showHistory ? 'Hide History' : `Full Audit Log (${selectedTask.edit_history.length})`}</span>
                      {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* LATEST SUMMARY BOX */}
                {selectedTask.last_edit_summary && (
                  <div className="bg-white/95 border border-amber-200 rounded-lg p-3 text-xs text-slate-800 shadow-2xs">
                    <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1.5">
                      Itemized Changes Applied:
                    </span>
                    <div className="space-y-1">
                      {selectedTask.last_edit_summary.split(';').map((changeItem, idx) => {
                        const clean = changeItem.trim();
                        if (!clean) return null;
                        return (
                          <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium text-[11px]">
                            <span className="text-amber-600 font-bold mt-0.5">•</span>
                            <span>{clean}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EXPANDABLE REVISION HISTORY LOG */}
                {showHistory && selectedTask.edit_history && selectedTask.edit_history.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
                        Complete Task Change History
                      </span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        {selectedTask.edit_history.length} revision{selectedTask.edit_history.length > 1 ? 's' : ''} recorded
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedTask.edit_history.map((h, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-white rounded-lg border border-amber-200/80 text-xs shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900">{h.editor_name || (h as any).edited_by_name || 'Admin'}</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-xs font-semibold capitalize">
                                {h.editor_role || (h as any).edited_by_role || 'Staff'}
                              </span>
                            </div>
                            <span className="text-slate-400 font-medium">
                              {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-slate-700 pl-1 space-y-0.5">
                            {(h.changes || []).map((ch, cIdx) => (
                              <li key={cIdx} className="font-medium text-slate-700">{ch}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANAGEMENT PERMISSION NOTICE OR ASSIGNEE NOTICE */}
            {canManageTask(selectedTask) ? (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 font-medium flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    <strong>Administrative Access:</strong> You can edit this task, reassign members, modify checklist subtasks, or update status.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openEditModal(selectedTask);
                  }}
                  className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer"
                >
                  Edit Task
                </button>
              </div>
            ) : !isTaskAssignee(selectedTask) ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Status change is reserved for assigned employee (<strong>{selectedTask.assignedTo?.name || 'Assignee'}</strong>). You are viewing this task as Viewer.
                </span>
              </div>
            ) : null}

            {/* BADGES & STATUS SWITCHER */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs border capitalize font-bold ${getPriorityBadge(
                    selectedTask.priority
                  )}`}
                >
                  {selectedTask.priority} Priority
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700 font-bold capitalize">
                  {selectedTask.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                {canUpdateTaskStatus(selectedTask) ? (() => {
                  const curr = ((selectedTask.status as any) === 'pending' ? 'todo' : selectedTask.status) as string;
                  const isTodo = curr === 'todo';
                  const isInProgress = curr === 'in_progress' || curr === 'under_review' || curr === 'overdue';
                  const isCompleted = curr === 'completed' || curr === 'cancelled';
                  const userCanManage = canManageTask(selectedTask);
                  const hasIncompleteSubtasks = !userCanManage && selectedTask.subtasks && selectedTask.subtasks.length > 0 && selectedTask.subtasks.some((s) => !s.completed);

                  return (
                    <select
                      value={curr}
                      onChange={(e) => {
                        const target = e.target.value;
                        if (target === 'completed' && hasIncompleteSubtasks) {
                          setToastMessage('Please complete all checklist subtasks first.');
                          return;
                        }
                        handleStatusChange(selectedTask.id, target);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border capitalize cursor-pointer focus:outline-hidden ${getStatusBadge(
                        selectedTask.status
                      )}`}
                    >
                      <option value="todo" disabled={!isTodo && !userCanManage}>To Do</option>
                      <option value="in_progress" disabled={isCompleted && !userCanManage}>In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled" disabled={isCompleted && !userCanManage}>Cancelled</option>
                    </select>
                  );
                })() : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border capitalize ${getStatusBadge(
                      selectedTask.status
                    )}`}
                  >
                    {selectedTask.status === 'todo' ? 'To Do' : selectedTask.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* PEOPLE METADATA */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Assigned Employee
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0f365e] text-white font-bold text-xs flex items-center justify-center">
                    {((selectedTask.assignedTo?.name || (typeof selectedTask.assigned_to === 'object' && selectedTask.assigned_to !== null ? (selectedTask.assigned_to as any)?.name : null)) || 'E')[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedTask.assignedTo?.name || (typeof selectedTask.assigned_to === 'object' && selectedTask.assigned_to !== null ? ((selectedTask.assigned_to as any)?.name || `Employee #${(selectedTask.assigned_to as any)?.id || ''}`) : (selectedTask.assigned_to ? `Employee #${selectedTask.assigned_to}` : 'Unassigned'))}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedTask.assignedTo?.email || (typeof selectedTask.assigned_to === 'object' && selectedTask.assigned_to !== null ? (selectedTask.assigned_to as any)?.email : null) || 'Corporate Staff'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Assigned By
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                    {(selectedTask.assigner?.name || 'A')[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {selectedTask.assigner?.name || `User #${selectedTask.assigner_id}`}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {selectedTask.assigner?.role?.display_name || 'Management'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION & DATES */}
            {selectedTask.description && (
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 mb-1">Work Description</h5>
                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                  {selectedTask.description}
                </div>
              </div>
            )}

            {/* SUBTASKS INTERACTIVE CHECKLIST */}
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-extrabold text-slate-800">Checklist Subtasks</h5>
                  <span className="text-[10px] font-bold text-slate-500">
                    {selectedTask.subtasks.filter((s) => s.completed).length} / {selectedTask.subtasks.length} Completed
                  </span>
                </div>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedTask.subtasks.map((st) => {
                    const canEditChecklist = canUpdateTaskStatus(selectedTask);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2 bg-white rounded-md border border-slate-100 text-xs transition-colors ${
                          canEditChecklist ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed opacity-90'
                        }`}
                        title={!canEditChecklist ? 'Only assigned employee or management can update checklist items' : undefined}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            disabled={!canEditChecklist}
                            onChange={() => canEditChecklist && handleToggleSubtask(selectedTask, st.id)}
                            className="w-4 h-4 text-[#0f365e] rounded border-slate-300 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className={st.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-medium'}>
                            {st.text || (st as any).title || ''}
                          </span>
                        </div>
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : !canEditChecklist ? (
                          <span className="text-[10px] text-slate-400 font-medium italic">Pending</span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedTask.notes && (
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 mb-1">Instructions / Notes</h5>
                <p className="text-xs text-slate-600 italic bg-amber-50/40 p-2.5 rounded-lg border border-amber-200">
                  {selectedTask.notes}
                </p>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {canManageTask(selectedTask) ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      openEditModal(selectedTask);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Edit task details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Task</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete task from organization database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                </div>
              ) : <div />}

              <div className="flex items-center gap-2">
                {selectedTask.status !== 'completed' && canUpdateTaskStatus(selectedTask) && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTask.id, 'completed');
                      setIsDetailModalOpen(false);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Mark Completed</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
    </div>
  );
}
