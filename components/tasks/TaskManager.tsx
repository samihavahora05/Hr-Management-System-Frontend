'use client';

import React, { useEffect, useState, useRef } from 'react';
import { fetchApi, downloadApiFile, getPrimaryApiBase } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Task, TaskMetrics, TaskUser, SubTask, TaskSubmission, TaskActivity } from '@/lib/types/task';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { UniversalDocViewer } from '@/components/documents/UniversalDocViewer';
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
  Upload,
  FileText,
  Download,
  Eye,
  Award,
  RefreshCw,
  Send,
  AlertCircle,
  FileCheck,
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
    submitted_for_review: 0,
    needs_revision: 0,
    approved: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    total_earned_marks: 0,
    total_possible_marks: 0,
    performance_percentage: 0,
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

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ url: string; fileName: string; title: string; contentType?: string } | null>(null);

  // Detail Modal Sub-tabs
  const [detailTab, setDetailTab] = useState<'overview' | 'submissions' | 'history'>('overview');
  const [taskActivities, setTaskActivities] = useState<TaskActivity[]>([]);
  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Create Task Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<string | number>('');
  const [formCategory, setFormCategory] = useState('general');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formMaximumMarks, setFormMaximumMarks] = useState<number>(100);
  const [formStartDate, setFormStartDate] = useState('');
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
  const [editFormMaximumMarks, setEditFormMaximumMarks] = useState<number>(100);
  const [editFormDueDate, setEditFormDueDate] = useState('');
  const [editFormNotes, setEditFormNotes] = useState('');
  const [editFormSubtasks, setEditFormSubtasks] = useState<SubTask[]>([]);
  const [editNewSubtaskInput, setEditNewSubtaskInput] = useState('');

  // Submit Task Form State (Employee Proof Submission)
  const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [whatWasCompleted, setWhatWasCompleted] = useState('');
  const [employeeComment, setEmployeeComment] = useState('');
  const [selectedProofFiles, setSelectedProofFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Review Form State
  const [reviewTaskId, setReviewTaskId] = useState<number | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_revision'>('approve');
  const [reviewMarks, setReviewMarks] = useState<number | ''>(100);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [selectedReviewSubmissionId, setSelectedReviewSubmissionId] = useState<number | null>(null);

  const showToast = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
  };

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
      showToast('Failed to load tasks', 'error');
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

  const loadTaskHistoryAndSubmissions = async (taskId: number) => {
    setLoadingHistory(true);
    try {
      const [histRes, subRes] = await Promise.all([
        fetchApi(`/tasks/${taskId}/history`),
        fetchApi(`/tasks/${taskId}/submissions`),
      ]);
      setTaskActivities(histRes.activities || []);
      setTaskSubmissions(subRes.submissions || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenDetailModal = async (task: Task, initialTab: 'overview' | 'submissions' | 'history' = 'overview') => {
    setSelectedTask(task);
    setDetailTab(initialTab);
    setIsDetailModalOpen(true);
    await loadTaskHistoryAndSubmissions(task.id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTasks();
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskInput.trim()) return;
    setFormSubtasks([
      ...formSubtasks,
      { id: Date.now(), text: newSubtaskInput.trim(), title: newSubtaskInput.trim(), completed: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtaskItem = (id: string | number) => {
    setFormSubtasks(formSubtasks.filter((st) => st.id !== id));
  };

  const handleAddEditSubtaskItem = () => {
    if (!editNewSubtaskInput.trim()) return;
    setEditFormSubtasks([
      ...editFormSubtasks,
      { id: Date.now(), text: editNewSubtaskInput.trim(), title: editNewSubtaskInput.trim(), completed: false },
    ]);
    setEditNewSubtaskInput('');
  };

  const handleRemoveEditSubtaskItem = (id: string | number) => {
    setEditFormSubtasks(editFormSubtasks.filter((st) => st.id !== id));
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('general');
    setFormPriority('medium');
    setFormMaximumMarks(100);
    setFormStartDate('');
    setFormDueDate('');
    setFormNotes('');
    setFormSubtasks([]);
    setNewSubtaskInput('');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = formAssignedTo || user?.id;
    if (!targetUserId) {
      showToast('Please select an employee to assign this task', 'warning');
      return;
    }

    if (formMaximumMarks <= 0) {
      showToast('Maximum marks must be at least 1', 'warning');
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
          maximum_marks: formMaximumMarks,
          start_date: formStartDate || null,
          due_date: formDueDate || null,
          notes: formNotes || null,
          subtasks: formSubtasks,
        }),
      });

      showToast('Task created & assigned successfully with maximum marks!', 'success');
      setIsCreateModalOpen(false);
      resetForm();
      setActiveTab('all');
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditTaskId(task.id);
    setEditFormTitle(task.title);
    setEditFormDescription(task.description || '');
    setEditFormAssignedTo(task.assigned_to);
    setEditFormCategory(task.category || 'general');
    setEditFormPriority(task.priority || 'medium');
    setEditFormMaximumMarks(task.maximum_marks || 100);
    setEditFormDueDate(task.due_date ? task.due_date.substring(0, 10) : '');
    setEditFormNotes(task.notes || '');
    setEditFormSubtasks(task.subtasks || []);
    setEditNewSubtaskInput('');
    setIsEditModalOpen(true);
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
          maximum_marks: editFormMaximumMarks,
          due_date: editFormDueDate || null,
          notes: editFormNotes,
          subtasks: editFormSubtasks,
        }),
      });

      const updatedTask = res?.task;
      setTasks((prev) => prev.map((t) => (t.id === editTaskId ? updatedTask || t : t)));
      if (selectedTask && selectedTask.id === editTaskId) {
        setSelectedTask(updatedTask);
      }

      showToast('Task details updated successfully!', 'success');
      setIsEditModalOpen(false);
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // EMPLOYEE START TASK
  const handleStartTask = async (taskId: number) => {
    try {
      const res = await fetchApi(`/tasks/${taskId}/start`, { method: 'POST' });
      showToast('🚀 Task started! Status changed to In Progress.', 'success');
      const updated = res.task;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated || t : t)));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updated);
      }
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to start task', 'error');
    }
  };

  // OPEN SUBMIT MODAL
  const openSubmitModal = (task: Task) => {
    setSubmitTaskId(task.id);
    setSelectedTask(task);
    setCompletionNote('');
    setWhatWasCompleted('');
    setEmployeeComment('');
    setSelectedProofFiles([]);
    setIsSubmitModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedProofFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // EMPLOYEE SUBMIT TASK FOR REVIEW
  const handleSubmitTaskForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitTaskId) return;

    if (!completionNote.trim()) {
      showToast('Please provide a completion note explaining the work done.', 'warning');
      return;
    }

    if (selectedProofFiles.length === 0) {
      showToast('Proof/deliverable file(s) are required to submit for review.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('completion_note', completionNote.trim());
      if (whatWasCompleted.trim()) formData.append('what_was_completed', whatWasCompleted.trim());
      if (employeeComment.trim()) formData.append('employee_comment', employeeComment.trim());

      selectedProofFiles.forEach((file) => {
        formData.append('proof_files[]', file);
      });

      const res = await fetchApi(`/tasks/${submitTaskId}/submit`, {
        method: 'POST',
        body: formData,
      });

      showToast('✅ Task successfully submitted for Admin Review! Notification dispatched.', 'success');
      setIsSubmitModalOpen(false);
      const updated = res.task;
      setTasks((prev) => prev.map((t) => (t.id === submitTaskId ? updated || t : t)));
      if (selectedTask && selectedTask.id === submitTaskId) {
        setSelectedTask(updated);
      }
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit task for review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN ADMIN REVIEW MODAL
  const openReviewModal = async (task: Task) => {
    setReviewTaskId(task.id);
    setSelectedTask(task);
    setReviewAction('approve');
    setReviewMarks(task.maximum_marks || 100);
    setReviewFeedback('');
    setSelectedReviewSubmissionId(null);
    setIsReviewModalOpen(true);
    await loadTaskHistoryAndSubmissions(task.id);
  };

  // ADMIN REVIEW & MARKS SUBMISSION
  const handleAdminReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTaskId || !selectedTask) return;

    const maxMarks = selectedTask.maximum_marks || 100;

    if (reviewAction === 'approve') {
      if (reviewMarks === '' || reviewMarks < 0 || reviewMarks > maxMarks) {
        showToast(`Please enter valid marks awarded between 0 and ${maxMarks}.`, 'warning');
        return;
      }
    } else {
      if (!reviewFeedback.trim()) {
        showToast('Please enter specific feedback/reason for requesting revision.', 'warning');
        return;
      }
    }

    setReviewSubmitting(true);
    try {
      const res = await fetchApi(`/tasks/${reviewTaskId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action: reviewAction,
          marks_awarded: reviewAction === 'approve' ? Number(reviewMarks) : null,
          admin_feedback: reviewFeedback.trim(),
        }),
      });

      if (reviewAction === 'approve') {
        showToast(`🎉 Task Approved! Awarded ${reviewMarks}/${maxMarks} marks. Performance score recalculated.`, 'success');
      } else {
        showToast('⚠ Revision requested. Employee has been notified with your feedback.', 'info');
      }

      setIsReviewModalOpen(false);
      const updated = res.task;
      setTasks((prev) => prev.map((t) => (t.id === reviewTaskId ? updated || t : t)));
      if (selectedTask && selectedTask.id === reviewTaskId) {
        setSelectedTask(updated);
      }
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Review action failed', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // PREVIEW PROOF FILE IN MODAL
  const handlePreviewProofFile = (taskId: number, file: { id: number; original_name: string; file_type?: string | null }) => {
    const apiBase = getPrimaryApiBase();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const streamUrl = `${apiBase}/tasks/${taskId}/files/${file.id}/view${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    setViewerDoc({
      url: streamUrl,
      fileName: file.original_name,
      title: `Proof File: ${file.original_name}`,
      contentType: file.file_type || 'application/pdf',
    });
    setIsDocViewerOpen(true);
  };

  // DOWNLOAD PROOF FILE
  const handleDownloadProofFile = async (taskId: number, file: { id: number; original_name: string }) => {
    try {
      await downloadApiFile(`/tasks/${taskId}/files/${file.id}/download`, file.original_name);
      showToast(`Downloaded ${file.original_name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to download proof file', 'error');
    }
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string | number) => {
    if (!canUpdateTaskStatus(task)) {
      showToast('Only the assigned employee or management can update checklist items.', 'warning');
      return;
    }

    // Optimistic UI update for instant real-time progress feedback
    const oldSubtasks = task.subtasks || [];
    const updatedSubtasks = oldSubtasks.map((st) => {
      if (String(st.id) === String(subtaskId)) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const totalCount = updatedSubtasks.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const optimisticTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      progress_percentage: newProgress,
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));
    if (selectedTask && selectedTask.id === task.id) {
      setSelectedTask(optimisticTask);
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
      // Revert on error
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask(task);
      }
      showToast(err.message || 'Subtask toggle failed', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setIsDetailModalOpen(false);
      setSelectedTask(null);
      const res = await fetchApi(`/tasks/${taskId}`, { method: 'DELETE' });
      showToast(res?.message || 'Task deleted successfully', 'success');
      await loadTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
      await loadTasks();
    }
  };

  // Helpers
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
      case 'approved':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'submitted_for_review':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold animate-pulse';
      case 'needs_revision':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 font-medium';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'needs_revision':
        return 'Needs Revision';
      case 'in_progress':
        return 'In Progress';
      case 'approved':
        return 'Approved';
      case 'completed':
        return 'Completed';
      case 'todo':
      case 'assigned':
        return 'Assigned';
      default:
        return status ? status.replace('_', ' ') : 'Pending';
    }
  };

  const getAssigneeId = (task: Task | null | undefined): number | string => {
    if (!task) return '';
    if (typeof task.assigned_to === 'object' && task.assigned_to !== null && 'id' in task.assigned_to) {
      return (task.assigned_to as any).id;
    }
    if (task.assignedTo?.id) return task.assignedTo.id;
    if (typeof (task as any).assigned_user === 'object' && (task as any).assigned_user !== null && 'id' in (task as any).assigned_user) {
      return (task as any).assigned_user.id;
    }
    return typeof task.assigned_to === 'number' || typeof task.assigned_to === 'string' ? task.assigned_to : '';
  };

  const getAssignee = (task: Task | null | undefined) => {
    if (!task) {
      return { id: '', name: 'Unassigned', department: 'Staff', designation: '', avatar: '', initial: 'U' };
    }

    // 1. Check if assignedTo / assigned_to / assigned_user is an object with a name
    const candidate: any =
      (typeof task.assignedTo === 'object' && task.assignedTo !== null && 'name' in task.assignedTo ? task.assignedTo : null) ||
      (typeof task.assigned_to === 'object' && task.assigned_to !== null && 'name' in task.assigned_to ? (task.assigned_to as any) : null) ||
      (typeof (task as any).assigned_user === 'object' && (task as any).assigned_user !== null && 'name' in (task as any).assigned_user ? (task as any).assigned_user : null) ||
      (typeof (task as any).assignee === 'object' && (task as any).assignee !== null && 'name' in (task as any).assignee ? (task as any).assignee : null);

    if (candidate && candidate.name) {
      return {
        id: candidate.id,
        name: candidate.name,
        department: candidate.department || candidate.role?.display_name || candidate.role?.name || 'Staff',
        designation: candidate.designation || '',
        avatar: candidate.avatar || '',
        initial: (candidate.name.charAt(0) || 'E').toUpperCase(),
      };
    }

    // 2. If assigned_to is an ID, find in assignableUsers list
    const rawId = getAssigneeId(task);
    if (rawId) {
      const found = assignableUsers.find((u) => String(u.id) === String(rawId));
      if (found) {
        return {
          id: found.id,
          name: found.name,
          department: found.department || found.role?.display_name || found.role?.name || 'Staff',
          designation: found.designation || '',
          avatar: (found as any).avatar || '',
          initial: (found.name.charAt(0) || 'E').toUpperCase(),
        };
      }
      return {
        id: rawId,
        name: `Employee #${rawId}`,
        department: 'Staff',
        designation: '',
        avatar: '',
        initial: 'E',
      };
    }

    return { id: '', name: 'Unassigned', department: 'Staff', designation: '', avatar: '', initial: 'U' };
  };

  const getAssigner = (task: Task | null | undefined) => {
    if (!task) {
      return { id: '', name: 'Management', role: 'Management', avatar: '', initial: 'M' };
    }

    const candidate: any =
      (typeof task.assigner === 'object' && task.assigner !== null && 'name' in task.assigner ? task.assigner : null) ||
      (typeof (task as any).assigner_user === 'object' && (task as any).assigner_user !== null && 'name' in (task as any).assigner_user ? (task as any).assigner_user : null);

    if (candidate && candidate.name) {
      return {
        id: candidate.id,
        name: candidate.name,
        role: candidate.role?.display_name || candidate.role?.name || 'Management',
        avatar: candidate.avatar || '',
        initial: (candidate.name.charAt(0) || 'A').toUpperCase(),
      };
    }

    const rawId = task.assigner_id;
    if (rawId) {
      const found = assignableUsers.find((u) => String(u.id) === String(rawId));
      if (found) {
        return {
          id: found.id,
          name: found.name,
          role: found.role?.display_name || found.role?.name || 'Management',
          avatar: (found as any).avatar || '',
          initial: (found.name.charAt(0) || 'A').toUpperCase(),
        };
      }
      return {
        id: rawId,
        name: `User #${rawId}`,
        role: 'Management',
        avatar: '',
        initial: 'U',
      };
    }

    return { id: '', name: 'Management', role: 'Management', avatar: '', initial: 'M' };
  };

  const isTaskAssignee = (task: Task) => {
    if (!user || !user.id) return false;
    const assignedId = getAssigneeId(task);
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
      if (statusFilter === 'todo' && !['todo', 'assigned', 'pending'].includes(t.status)) return false;
      if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
      if (statusFilter === 'submitted_for_review' && t.status !== 'submitted_for_review') return false;
      if (statusFilter === 'needs_revision' && t.status !== 'needs_revision') return false;
      if (statusFilter === 'approved' && !['approved', 'completed'].includes(t.status)) return false;
      if (statusFilter === 'overdue' && t.status !== 'overdue') return false;
      if (statusFilter === 'cancelled' && t.status !== 'cancelled') return false;
    }

    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    if (assigneeFilter !== 'all') {
      const assignedId = getAssigneeId(t);
      if (Number(assignedId) !== Number(assigneeFilter)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = getAssignee(t).name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* TOP METRIC DASHBOARD WIDGETS (CLICKABLE FILTERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* TOTAL TASKS */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'all'
              ? 'bg-gradient-to-br from-white to-slate-100/90 border-[#0f365e] ring-2 ring-[#0f365e]/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'all' && <div className="absolute top-0 left-0 right-0 h-1 bg-[#0f365e]" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'all' ? 'text-[#0f365e]' : 'text-slate-500'
            }`}>
              Total Tasks
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'all' ? 'bg-[#0f365e] text-white shadow-xs' : 'bg-slate-100 text-[#0f365e]'
            }`}>
              <ListTodo className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-slate-900 tracking-tight">{metrics.total}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-medium ${statusFilter === 'all' ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
              All assigned tasks
            </span>
            {statusFilter === 'all' && (
              <span className="text-[9px] font-bold bg-[#0f365e]/10 text-[#0f365e] px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>

        {/* IN PROGRESS */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'in_progress'
              ? 'bg-gradient-to-br from-white to-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-indigo-50/30 border-slate-200 hover:border-indigo-200 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'in_progress' && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'in_progress' ? 'text-indigo-900' : 'text-slate-500'
            }`}>
              In Progress
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'in_progress' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-slate-900 tracking-tight">{metrics.in_progress}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-medium ${statusFilter === 'in_progress' ? 'text-indigo-700 font-semibold' : 'text-slate-400'}`}>
              Active in flight
            </span>
            {statusFilter === 'in_progress' && (
              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>

        {/* SUBMITTED FOR REVIEW */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'submitted_for_review' ? 'all' : 'submitted_for_review')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'submitted_for_review'
              ? 'bg-gradient-to-br from-white to-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-purple-50/30 border-purple-200/70 hover:border-purple-300 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'submitted_for_review' && <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'submitted_for_review' ? 'text-purple-900' : 'text-purple-700'
            }`}>
              Review Required
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'submitted_for_review' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-600'
            }`}>
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-purple-950 tracking-tight">
            {metrics.submitted_for_review || 0}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-medium ${statusFilter === 'submitted_for_review' ? 'text-purple-800 font-semibold' : 'text-purple-600'}`}>
              Proof uploaded
            </span>
            {statusFilter === 'submitted_for_review' && (
              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>

        {/* NEEDS REVISION */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'needs_revision' ? 'all' : 'needs_revision')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'needs_revision'
              ? 'bg-gradient-to-br from-white to-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-amber-50/30 border-amber-200/70 hover:border-amber-300 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'needs_revision' && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'needs_revision' ? 'text-amber-900' : 'text-amber-700'
            }`}>
              Needs Revision
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'needs_revision' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-50 text-amber-600'
            }`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-amber-950 tracking-tight">
            {metrics.needs_revision || 0}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-medium ${statusFilter === 'needs_revision' ? 'text-amber-800 font-semibold' : 'text-amber-600'}`}>
              Feedback pending
            </span>
            {statusFilter === 'needs_revision' && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>

        {/* APPROVED / MARKS */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'approved'
              ? 'bg-gradient-to-br from-white to-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-emerald-50/30 border-emerald-200/70 hover:border-emerald-300 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'approved' && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'approved' ? 'text-emerald-900' : 'text-emerald-700'
            }`}>
              Approved & Scored
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-emerald-950 tracking-tight">
            {metrics.approved || metrics.completed}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-bold ${statusFilter === 'approved' ? 'text-emerald-800' : 'text-emerald-700'}`}>
              {metrics.performance_percentage}% Marks Score
            </span>
            {statusFilter === 'approved' && (
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>

        {/* OVERDUE */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            statusFilter === 'overdue'
              ? 'bg-gradient-to-br from-white to-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-sm -translate-y-0.5'
              : 'bg-white hover:bg-rose-50/30 border-rose-200/70 hover:border-rose-300 shadow-2xs hover:-translate-y-0.5'
          }`}
        >
          {statusFilter === 'overdue' && <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === 'overdue' ? 'text-rose-900' : 'text-rose-600'
            }`}>
              Overdue
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              statusFilter === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-600'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black mt-1 font-mono text-rose-950 tracking-tight">{metrics.overdue}</div>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`text-[10px] font-medium ${statusFilter === 'overdue' ? 'text-rose-800 font-semibold' : 'text-rose-600'}`}>
              Passed deadline
            </span>
            {statusFilter === 'overdue' && (
              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                Active
              </span>
            )}
          </div>
        </button>
      </div>

      {/* FILTER CONTROLS & CREATE BUTTON BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {!isEmployeeMode && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Team Tasks
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assigned_by_me')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'assigned_by_me' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assigned by Me
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assigned_to_me')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'assigned_to_me' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Tasks
              </button>
            </div>
          )}

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-[#0f365e] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kanban Board view"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f365e]"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="todo">Assigned (To Do)</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted_for_review">Submitted for Review</option>
            <option value="needs_revision">Needs Revision</option>
            <option value="approved">Approved & Scored</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {!isEmployeeMode && canManageTask() && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#0f365e] hover:bg-[#0c2b4b] active:scale-95 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* TASK LIST TABLE OR KANBAN BOARD */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs font-semibold text-slate-400 animate-pulse shadow-2xs">
          Loading task management system...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3 shadow-2xs">
          <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-slate-700 text-sm">No tasks found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are no tasks matching the selected filters or assigned under your scope.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Task Details</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-center">Max Marks</th>
                  <th className="py-3.5 px-4 text-center">Marks Awarded</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Review / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.map((task) => {
                  const isAssignee = isTaskAssignee(task);
                  const isManager = canManageTask(task);
                  const maxMarks = task.maximum_marks || 100;
                  const marksAwarded = task.marks_awarded;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleOpenDetailModal(task, 'overview')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* TITLE & CATEGORY */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
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
                          <p className="font-extrabold text-slate-900 group-hover:text-[#0f365e] transition-colors leading-snug line-clamp-1">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (() => {
                            const done = task.subtasks.filter((s) => s.completed).length;
                            const total = task.subtasks.length;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                            return (
                              <div className="flex items-center gap-2 pt-1">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-500">
                                  {done}/{total} ({pct}% done)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      {/* ASSIGNEE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {(() => {
                          const assignee = getAssignee(task);
                          return (
                            <div className="flex items-center gap-2">
                              {assignee.avatar ? (
                                <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#0f365e] text-white text-[10px] font-bold flex items-center justify-center">
                                  {assignee.initial}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{assignee.name}</p>
                                <p className="text-[10px] text-slate-400">{assignee.department}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* DUE DATE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {task.due_date ? (
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No deadline</span>
                        )}
                      </td>

                      {/* MAXIMUM MARKS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono font-bold text-slate-800 text-xs">
                          {maxMarks}
                        </span>
                      </td>

                      {/* MARKS AWARDED */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {marksAwarded !== null && marksAwarded !== undefined ? (
                          <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-md font-mono font-black text-xs">
                            {marksAwarded} / {maxMarks} ({roundPercentage(marksAwarded, maxMarks)}%)
                          </span>
                        ) : task.status === 'submitted_for_review' ? (
                          <span className="text-purple-700 font-semibold text-[11px]">Pending Review</span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border capitalize ${getStatusBadge(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>

                      {/* ACTIONS & WORKFLOW BUTTONS */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* EMPLOYEE ACTIONS */}
                          {isAssignee && (
                            <>
                              {['todo', 'assigned', 'pending'].includes(task.status) && (
                                <button
                                  type="button"
                                  onClick={() => handleStartTask(task.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3" /> Start Task
                                </button>
                              )}

                              {['in_progress', 'needs_revision'].includes(task.status) && (
                                <button
                                  type="button"
                                  onClick={() => openSubmitModal(task)}
                                  className={`px-2.5 py-1 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 ${
                                    task.status === 'needs_revision' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'
                                  }`}
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>{task.status === 'needs_revision' ? 'Resubmit Proof' : 'Submit for Review'}</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* ADMIN REVIEW ACTION */}
                          {isManager && task.status === 'submitted_for_review' && (
                            <button
                              type="button"
                              onClick={() => openReviewModal(task)}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-black text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Verify & Score</span>
                            </button>
                          )}

                          {/* DETAILS BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(task, 'overview')}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Task Details & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* EDIT / DELETE FOR MANAGEMENT */}
                          {isManager && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit task specifications"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete task"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 min-w-0 w-full">
          {[
            { id: 'todo', title: 'Assigned', color: 'border-blue-400 bg-blue-50/40', statuses: ['todo', 'assigned', 'pending'] },
            { id: 'in_progress', title: 'In Progress', color: 'border-indigo-400 bg-indigo-50/40', statuses: ['in_progress'] },
            { id: 'submitted_for_review', title: 'Submitted for Review', color: 'border-purple-400 bg-purple-50/40', statuses: ['submitted_for_review'] },
            { id: 'needs_revision', title: 'Needs Revision', color: 'border-amber-400 bg-amber-50/40', statuses: ['needs_revision'] },
            { id: 'approved', title: 'Approved & Scored', color: 'border-emerald-400 bg-emerald-50/40', statuses: ['approved', 'completed'] },
          ].map((column) => {
            const columnTasks = filteredTasks.filter((t) => column.statuses.includes(t.status));

            return (
              <div key={column.id} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex flex-col min-h-[350px]">
                <div className={`p-2.5 mb-3 rounded-lg border ${column.color} flex items-center justify-between`}>
                  <h4 className="font-extrabold text-slate-800 text-xs">{column.title}</h4>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-800 text-[10px] font-bold flex items-center justify-center shadow-2xs">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.map((task) => {
                    const isAssignee = isTaskAssignee(task);
                    const isManager = canManageTask(task);
                    const maxMarks = task.maximum_marks || 100;

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenDetailModal(task, 'overview')}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] border capitalize ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {task.marks_awarded !== null ? `${task.marks_awarded}/${maxMarks}` : `${maxMarks} max`}
                          </span>
                        </div>

                        <h5 className="font-bold text-slate-900 text-xs group-hover:text-[#0f365e] transition-colors line-clamp-2">
                          {task.title}
                        </h5>

                        {task.subtasks && task.subtasks.length > 0 && (() => {
                          const done = task.subtasks.filter((s) => s.completed).length;
                          const total = task.subtasks.length;
                          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                                <span>Checklist</span>
                                <span className="font-bold text-slate-700">{done}/{total} ({pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-indigo-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {task.admin_feedback && task.status === 'needs_revision' && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900">
                            <strong>Feedback:</strong> {task.admin_feedback}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-600 truncate max-w-[120px]">
                            {getAssignee(task).name}
                          </span>

                          {/* ACTION BUTTON ON CARD */}
                          {isAssignee && ['todo', 'assigned', 'pending'].includes(task.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTask(task.id);
                              }}
                              className="px-2 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded"
                            >
                              Start
                            </button>
                          )}

                          {isAssignee && ['in_progress', 'needs_revision'].includes(task.status) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSubmitModal(task);
                              }}
                              className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[10px] rounded"
                            >
                              Submit
                            </button>
                          )}

                          {isManager && task.status === 'submitted_for_review' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReviewModal(task);
                              }}
                              className="px-2 py-0.5 bg-purple-700 text-white font-extrabold text-[10px] rounded shadow-2xs"
                            >
                              Verify
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

      {/* CREATE & ASSIGN TASK MODAL */}
      {!isEmployeeMode && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={isAdminMode ? 'Admin Create & Assign Task with Marks' : 'Assign Task to Team Member'}
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign To Employee *
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
                placeholder="e.g. Prepare Monthly Financial Audit & Upload Supporting Receipts"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Evaluation Marks *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={formMaximumMarks}
                  onChange={(e) => setFormMaximumMarks(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  placeholder="100"
                />
                <span className="text-[10px] text-slate-400">Total possible marks admin can award</span>
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Type</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="general">General Task</option>
                  <option value="project">Project Deliverable</option>
                  <option value="compliance">HR & Compliance</option>
                  <option value="audit">Financial / Audit</option>
                  <option value="technical">Technical / Development</option>
                  <option value="report">Report Submission</option>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Instructions & Deliverable Requirements</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Explain the required outcome, format, and expected proof attachments..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#0f365e]"
              />
            </div>

            {/* CHECKLIST BUILDER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Checklist Requirements (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtaskItem();
                    }
                  }}
                  placeholder="Add a checklist requirement item..."
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubtaskItem}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>

              {formSubtasks.length > 0 && (
                <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                  {formSubtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded text-xs border border-slate-200">
                      <span>{st.text || st.title}</span>
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
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
                className="px-5 py-2 bg-[#0f365e] hover:bg-[#0c2b4b] text-white text-xs font-extrabold rounded-lg disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? 'Creating...' : 'Create & Assign Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task Details & Maximum Marks"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={editFormTitle}
              onChange={(e) => setEditFormTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Marks *</label>
              <input
                type="number"
                min="1"
                required
                value={editFormMaximumMarks}
                onChange={(e) => setEditFormMaximumMarks(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
              <select
                value={editFormPriority}
                onChange={(e) => setEditFormPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={editFormCategory}
                onChange={(e) => setEditFormCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={editFormDescription}
              onChange={(e) => setEditFormDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-5 py-2 bg-[#0f365e] hover:bg-[#0c2b4b] text-white text-xs font-extrabold rounded-lg disabled:opacity-50"
            >
              {editSubmitting ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EMPLOYEE PROOF SUBMISSION MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={selectedTask?.status === 'needs_revision' ? 'Resubmit Task with Corrected Proof' : 'Submit Task for Admin Review & Verification'}
      >
        <form onSubmit={handleSubmitTaskForReview} className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-900">{selectedTask?.title}</span>
              <span className="font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Max Marks: {selectedTask?.maximum_marks || 100}
              </span>
            </div>
            <p className="text-purple-700 text-[11px]">
              Attach the deliverables, report files, or screenshots showing proof of completion. Admin will review your submission and award manual performance marks.
            </p>
          </div>

          {selectedTask?.status === 'needs_revision' && selectedTask?.admin_feedback && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
              <span className="font-extrabold text-amber-950 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Previous Revision Requested:
              </span>
              <p className="italic">{selectedTask.admin_feedback}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Completion Note * (Explain what was done)
            </label>
            <textarea
              required
              rows={3}
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="e.g. Completed the monthly sales audit for all 4 regional departments and reconciled the discrepancies..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What was completed? (Summary / Deliverables)
            </label>
            <textarea
              rows={2}
              value={whatWasCompleted}
              onChange={(e) => setWhatWasCompleted(e.target.value)}
              placeholder="Key outputs: Excel workbook, executive PDF summary, presentation slides..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* FILE UPLOAD DROPZONE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Proof / Supporting Deliverable Files * (PDF, XLSX, DOCX, Images, ZIP)
            </label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/70 p-5 rounded-xl text-center cursor-pointer transition-colors space-y-1.5"
            >
              <Upload className="w-6 h-6 text-purple-600 mx-auto" />
              <p className="text-xs font-bold text-purple-900">Click to browse or drop proof files</p>
              <p className="text-[10px] text-slate-400">Supported: PDF, DOCX, XLSX, PPTX, JPG, PNG, WEBP, ZIP (Max 25MB each)</p>
            </div>

            {/* SELECTED FILES LIST */}
            {selectedProofFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto">
                {selectedProofFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Additional Employee Comments (Optional)</label>
            <input
              type="text"
              value={employeeComment}
              onChange={(e) => setEmployeeComment(e.target.value)}
              placeholder="Any comments or clarifications for the reviewing manager..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedProofFiles.length === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting Proof...' : 'Submit for Admin Review'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ADMIN REVIEW & MANUAL MARKING MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Admin Task Verification & Manual Evaluation"
        maxWidth="2xl"
      >
        <form onSubmit={handleAdminReviewSubmit} className="space-y-4">
          {/* TASK CONTEXT HEADER */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reviewing Task</span>
                <h4 className="font-extrabold text-slate-900 text-sm">{selectedTask?.title}</h4>
              </div>
              <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs shadow-2xs">
                Max Marks: {selectedTask?.maximum_marks || 100}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-slate-600">
              <span className="font-semibold">Assignee:</span>
              <span className="font-bold text-slate-900">{getAssignee(selectedTask).name}</span>
              <span>•</span>
              <span className="font-semibold">Department:</span>
              <span>{getAssignee(selectedTask).department}</span>
              <span>•</span>
              <span className="font-semibold">Priority:</span>
              <span className="capitalize font-bold text-slate-800">{selectedTask?.priority}</span>
            </div>
            {selectedTask?.description && (
              <div className="pt-1.5 border-t border-slate-200/80 text-[11px] text-slate-600 line-clamp-2">
                <strong>Scope:</strong> {selectedTask.description}
              </div>
            )}
          </div>

          {/* CHECKLIST PROGRESS VERIFICATION (IF TASK HAS SUBTASKS) */}
          {selectedTask?.subtasks && selectedTask.subtasks.length > 0 && (() => {
            const completedCount = selectedTask.subtasks.filter((s) => s.completed).length;
            const totalCount = selectedTask.subtasks.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Checklist Progress
                  </span>
                  <span className="font-mono font-bold text-blue-900 text-[11px]">
                    {completedCount} / {totalCount} Completed ({pct}% Work Done)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-blue-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* EMPLOYEE SUBMITTED DELIVERABLES & PROOF FILES CARD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-purple-600" />
                <span>Employee Proof & Deliverables</span>
              </label>
              {taskSubmissions.length > 1 && (
                <div className="flex items-center gap-1">
                  {taskSubmissions.map((sub, idx) => {
                    const isSelected = selectedReviewSubmissionId
                      ? sub.id === selectedReviewSubmissionId
                      : idx === taskSubmissions.length - 1;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedReviewSubmissionId(sub.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        Iteration #{sub.submission_number}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {loadingHistory ? (
              <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-200 text-center text-xs font-semibold text-purple-600 animate-pulse">
                Fetching employee proof files and submission details...
              </div>
            ) : (() => {
              const allSubs = taskSubmissions.length > 0
                ? taskSubmissions
                : selectedTask?.latestSubmission
                ? [selectedTask.latestSubmission]
                : (selectedTask as any)?.latest_submission
                ? [(selectedTask as any).latest_submission]
                : [];

              const currentSub = selectedReviewSubmissionId
                ? allSubs.find((s) => s.id === selectedReviewSubmissionId) || allSubs[allSubs.length - 1]
                : allSubs[allSubs.length - 1];

              if (!currentSub) {
                return (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> No Proof Files Uploaded Yet
                    </p>
                    <p className="text-[11px] text-amber-800">
                      The employee has not uploaded proof files for this task yet. You can still evaluate and score or request revision.
                    </p>
                  </div>
                );
              }

              return (
                <div className="p-3.5 bg-gradient-to-br from-purple-50/60 to-white rounded-xl border border-purple-200 space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-purple-950 bg-purple-100 px-2 py-0.5 rounded text-xs">
                        Submission #{currentSub.submission_number}
                      </span>
                      <span className="text-[10px] text-purple-700 font-medium">
                        {currentSub.submitted_at ? new Date(currentSub.submitted_at).toLocaleString() : 'Recently submitted'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded">
                      {currentSub.status === 'submitted' ? 'Ready for Review' : currentSub.status}
                    </span>
                  </div>

                  {/* COMPLETION NOTE */}
                  {currentSub.completion_note && (
                    <div>
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                        Employee Completion Note:
                      </span>
                      <div className="p-2.5 bg-white rounded-lg border border-purple-100 text-slate-800 text-xs whitespace-pre-wrap leading-relaxed">
                        {currentSub.completion_note}
                      </div>
                    </div>
                  )}

                  {/* WHAT WAS COMPLETED */}
                  {currentSub.what_was_completed && (
                    <div>
                      <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                        What Was Completed:
                      </span>
                      <div className="p-2.5 bg-white rounded-lg border border-purple-100 text-slate-800 text-xs whitespace-pre-wrap leading-relaxed">
                        {currentSub.what_was_completed}
                      </div>
                    </div>
                  )}

                  {/* ATTACHED PROOF FILES */}
                  <div>
                    <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1.5">
                      Attached Proof Files ({currentSub.files?.length || 0}):
                    </span>
                    {!currentSub.files || currentSub.files.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-white p-2.5 rounded-lg border border-purple-100">
                        No files attached in this iteration.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentSub.files.map((file: any) => {
                          const isImg = file.original_name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
                          const isPdf = file.original_name.match(/\.pdf$/i);

                          return (
                            <div
                              key={file.id}
                              className="p-2.5 bg-white rounded-xl border border-purple-200/80 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all space-y-2 flex flex-col justify-between"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                                  isPdf ? 'bg-rose-100 text-rose-700' : isImg ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {isPdf ? 'PDF' : isImg ? 'IMG' : 'DOC'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 text-xs truncate" title={file.original_name}>
                                    {file.original_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewProofFile(selectedTask!.id, file)}
                                  className="flex-1 px-2.5 py-1.5 bg-[#0f365e] hover:bg-[#0c2b4b] text-white rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View & Inspect Proof</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadProofFile(selectedTask!.id, file)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-all cursor-pointer"
                                  title="Download file"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ADMIN DECISION */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">Admin Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  reviewAction === 'approve'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-400/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === 'approve'}
                  onChange={() => setReviewAction('approve')}
                  className="w-4 h-4 text-emerald-600"
                />
                <div>
                  <p className="font-extrabold text-xs">Approve & Award Marks</p>
                  <p className="text-[10px] text-slate-500">Task fulfilled & scored</p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  reviewAction === 'request_revision'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="reviewAction"
                  checked={reviewAction === 'request_revision'}
                  onChange={() => setReviewAction('request_revision')}
                  className="w-4 h-4 text-amber-600"
                />
                <div>
                  <p className="font-extrabold text-xs">Request Revision</p>
                  <p className="text-[10px] text-slate-500">Requires correction</p>
                </div>
              </label>
            </div>

            {/* MARKS INPUT IF APPROVE */}
            {reviewAction === 'approve' && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950">
                    Marks Awarded (0 - {selectedTask?.maximum_marks || 100}) *
                  </label>
                  <span className="font-mono font-black text-emerald-900 text-xs">
                    {reviewMarks !== '' ? `${reviewMarks} / ${selectedTask?.maximum_marks || 100} (${roundPercentage(Number(reviewMarks), selectedTask?.maximum_marks || 100)}%)` : '—'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={selectedTask?.maximum_marks || 100}
                  required
                  value={reviewMarks}
                  onChange={(e) => setReviewMarks(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-mono font-black text-slate-900 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 87"
                />
                <p className="text-[10px] text-emerald-800">
                  Performance score will be automatically updated based on verified awarded marks.
                </p>
              </div>
            )}

            {/* FEEDBACK TEXTAREA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {reviewAction === 'approve' ? 'Admin Feedback / Review Comments (Optional)' : 'Revision Reason & Required Corrections *'}
              </label>
              <textarea
                required={reviewAction === 'request_revision'}
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'e.g. Excellent work, all deliverables verified and validated on time.'
                    : 'e.g. Please update the missing April reconciliation figures and re-upload the updated Excel report...'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className={`px-5 py-2 text-white text-xs font-black rounded-lg disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 ${
                reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{reviewSubmitting ? 'Saving...' : reviewAction === 'approve' ? 'Approve & Save Marks' : 'Send Revision Request'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* TASK DETAILS, SUBMISSIONS & FULL HISTORY MODAL */}
      {selectedTask && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Task: ${selectedTask.title}`}
        >
          <div className="space-y-4">
            {/* SUB-TABS NAVIGATION */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setDetailTab('overview')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  detailTab === 'overview'
                    ? 'border-[#0f365e] text-[#0f365e]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('submissions')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'submissions'
                    ? 'border-[#0f365e] text-[#0f365e]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Submissions & Proof</span>
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px]">
                  {taskSubmissions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('history')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'history'
                    ? 'border-[#0f365e] text-[#0f365e]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail ({taskActivities.length})</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {detailTab === 'overview' && (
              <div className="space-y-4">
                {/* STATUS & MARKS SUMMARY BAR */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedTask.status)}`}>
                      {getStatusLabel(selectedTask.status)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border capitalize font-bold ${getPriorityBadge(selectedTask.priority)}`}>
                      {selectedTask.priority} Priority
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600">Evaluation:</span>
                    <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                      {selectedTask.marks_awarded !== null ? `${selectedTask.marks_awarded} / ${selectedTask.maximum_marks || 100} (${roundPercentage(selectedTask.marks_awarded, selectedTask.maximum_marks || 100)}%)` : `Max ${selectedTask.maximum_marks || 100} Marks`}
                    </span>
                  </div>
                </div>

                {/* NEEDS REVISION ALERT */}
                {selectedTask.status === 'needs_revision' && selectedTask.admin_feedback && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Admin Revision Notice</span>
                    </div>
                    <p className="text-amber-800">{selectedTask.admin_feedback}</p>
                  </div>
                )}

                {/* APPROVED NOTICE */}
                {selectedTask.status === 'approved' && (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between font-extrabold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        Verified & Approved by Management
                      </span>
                      <span className="font-mono">
                        Score: {selectedTask.marks_awarded} / {selectedTask.maximum_marks || 100} ({roundPercentage(selectedTask.marks_awarded || 0, selectedTask.maximum_marks || 100)}%)
                      </span>
                    </div>
                    {selectedTask.admin_feedback && (
                      <p className="text-emerald-800 italic">Feedback: "{selectedTask.admin_feedback}"</p>
                    )}
                  </div>
                )}

                {/* PEOPLE METADATA */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Assigned Employee
                    </span>
                    {(() => {
                      const assignee = getAssignee(selectedTask);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#0f365e] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {assignee.initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{assignee.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{assignee.department}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Assigned By
                    </span>
                    {(() => {
                      const assigner = getAssigner(selectedTask);
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {assigner.initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{assigner.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{assigner.role}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* WORK DESCRIPTION */}
                {selectedTask.description && (
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-800 mb-1">Work Description & Scope</h5>
                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedTask.description}
                    </div>
                  </div>
                )}

                {/* CHECKLIST SUBTASKS WITH REAL-TIME COMPLETION RATIO & WORK DONE PERCENTAGE */}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (() => {
                  const completedCount = selectedTask.subtasks.filter((s) => s.completed).length;
                  const totalCount = selectedTask.subtasks.length;
                  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-extrabold text-slate-800">Checklist Subtasks</h5>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono border transition-all ${
                              progressPercentage === 100
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : progressPercentage > 0
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {progressPercentage}% Work Done
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 font-mono">
                          <strong className="text-slate-900 font-black">{completedCount}</strong> / {totalCount} Completed
                        </span>
                      </div>

                      {/* VISUAL ANIMATED COMPLETION PROGRESS BAR */}
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progressPercentage === 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs shadow-emerald-500/30'
                                : progressPercentage >= 50
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xs shadow-blue-500/30'
                                : 'bg-gradient-to-r from-indigo-500 to-[#0f365e]'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Subtask Completion Ratio</span>
                          <span className="font-bold text-slate-600 font-mono">{progressPercentage}% Completed</span>
                        </div>
                      </div>

                      {/* CHECKLIST ITEMS */}
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {selectedTask.subtasks.map((st) => (
                          <label
                            key={st.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                              st.completed
                                ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                                : 'bg-white hover:bg-slate-50/90 border-slate-200 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => handleToggleSubtask(selectedTask, st.id)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span
                                className={`text-xs truncate ${
                                  st.completed ? 'line-through text-slate-400 font-medium' : 'font-semibold text-slate-800'
                                }`}
                              >
                                {st.text || st.title}
                              </span>
                            </div>
                            {st.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 shrink-0">Pending</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 2: ALL SUBMISSIONS & PROOF ITERATIONS */}
            {detailTab === 'submissions' && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {taskSubmissions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No submissions uploaded yet for this task.
                  </div>
                ) : (
                  taskSubmissions.map((sub) => (
                    <div key={sub.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-xs">
                            Submission #{sub.submission_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            sub.status === 'needs_revision' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-purple-100 text-purple-800 border-purple-200'
                          }`}>
                            {sub.status === 'approved' ? 'Approved' : sub.status === 'needs_revision' ? 'Revision Requested' : 'Submitted'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Note:</span>
                        <p className="text-slate-800 whitespace-pre-wrap">{sub.completion_note}</p>
                      </div>

                      {/* FILES */}
                      {sub.files && sub.files.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached Proof:</span>
                          {sub.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span className="font-semibold text-slate-900 truncate">{file.original_name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handlePreviewProofFile(selectedTask.id, file)}
                                  className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadProofFile(selectedTask.id, file)}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" /> Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ADMIN EVALUATION IF REVIEWED */}
                      {sub.reviewed_at && (
                        <div className="p-2 bg-slate-100/70 rounded-lg text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>Reviewed by {sub.reviewer?.name || 'Admin'}</span>
                            {sub.marks_awarded !== null && (
                              <span className="font-mono text-emerald-800">
                                Marks: {sub.marks_awarded}/{sub.maximum_marks}
                              </span>
                            )}
                          </div>
                          {sub.admin_feedback && (
                            <p className="text-slate-600 italic">"{sub.admin_feedback}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: IMMUTABLE AUDIT TRAIL LOG */}
            {detailTab === 'history' && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {taskActivities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No activity logs recorded yet.
                  </div>
                ) : (
                  taskActivities.map((act) => (
                    <div key={act.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{act.performer?.name || 'System'}</span>
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-xs font-semibold capitalize">
                            {act.performed_by_role || 'Staff'}
                          </span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                {canManageTask(selectedTask) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openEditModal(selectedTask);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Edit Task
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* EMPLOYEE ACTION BUTTONS */}
                {isTaskAssignee(selectedTask) && ['todo', 'assigned', 'pending'].includes(selectedTask.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleStartTask(selectedTask.id);
                    }}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Start Task
                  </button>
                )}

                {isTaskAssignee(selectedTask) && ['in_progress', 'needs_revision'].includes(selectedTask.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openSubmitModal(selectedTask);
                    }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedTask.status === 'needs_revision' ? 'Resubmit Proof' : 'Submit for Review'}</span>
                  </button>
                )}

                {/* ADMIN REVIEW ACTION */}
                {canManageTask(selectedTask) && selectedTask.status === 'submitted_for_review' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      openReviewModal(selectedTask);
                    }}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Verify & Score</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* UNIVERSAL DOCUMENT VIEWER MODAL (FOR PROOF PREVIEWS) */}
      {isDocViewerOpen && viewerDoc && (
        <Modal
          isOpen={isDocViewerOpen}
          onClose={() => setIsDocViewerOpen(false)}
          title={viewerDoc.title}
          maxWidth="5xl"
          noPadding
          zIndex="z-[70]"
        >
          <div className="h-[80vh] w-full flex flex-col min-w-0">
            <UniversalDocViewer
              url={viewerDoc.url}
              fileName={viewerDoc.fileName}
              contentType={viewerDoc.contentType}
              title={viewerDoc.title}
              onDownload={() => {
                const a = document.createElement('a');
                a.href = viewerDoc.url;
                a.download = viewerDoc.fileName || 'proof_document';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            />
          </div>
        </Modal>
      )}

      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function roundPercentage(marks?: number | null, max?: number | null): number {
  if (!marks || !max || max <= 0) return 0;
  return Math.round((marks / max) * 1000) / 10;
}
