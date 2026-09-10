export interface SubTask {
  id: string | number;
  text?: string;
  title?: string;
  completed: boolean;
}

export interface TaskEditHistoryItem {
  id: string;
  editor_id: number;
  editor_name: string;
  editor_role: string;
  timestamp: string;
  summary: string;
  changes: string[];
}

export interface TaskSubmissionFile {
  id: number;
  submission_id: number;
  task_id: number;
  user_id: number;
  original_name: string;
  file_path: string;
  file_type?: string | null;
  file_size?: number;
  created_at: string;
}

export interface TaskSubmission {
  id: number;
  task_id: number;
  employee_id: number;
  submission_number: number;
  completion_note: string;
  what_was_completed?: string | null;
  employee_comment?: string | null;
  status: 'submitted' | 'approved' | 'needs_revision';
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  admin_feedback?: string | null;
  marks_awarded?: number | null;
  maximum_marks: number;
  created_at: string;
  updated_at: string;
  files?: TaskSubmissionFile[];
  reviewer?: {
    id: number;
    name: string;
  };
  employee?: {
    id: number;
    name: string;
  };
}

export interface TaskActivity {
  id: number;
  task_id: number;
  submission_id?: number | null;
  event_type:
    | 'task_created'
    | 'task_assigned'
    | 'task_reassigned'
    | 'task_started'
    | 'task_submitted'
    | 'proof_uploaded'
    | 'revision_requested'
    | 'task_approved'
    | 'marks_awarded'
    | 'marks_updated'
    | 'task_cancelled'
    | 'task_updated';
  performed_by?: number | null;
  performed_by_role?: string | null;
  previous_status?: string | null;
  new_status?: string | null;
  description: string;
  metadata?: any;
  created_at: string;
  performer?: {
    id: number;
    name: string;
    role?: {
      id: number;
      name: string;
      display_name: string;
    };
  };
}

export interface TaskUser {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  department?: string | null;
  designation?: string | null;
  role?: {
    id: number;
    name: string;
    display_name: string;
  };
}

export interface Task {
  id: number;
  organization_id: number;
  assigner_id: number;
  assigned_to: number;
  assigned_by_role?: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
  assigned_to_role?: 'admin' | 'hr' | 'manager' | 'team_leader' | 'employee';
  title: string;
  description?: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'assigned' | 'in_progress' | 'submitted_for_review' | 'approved' | 'needs_revision' | 'completed' | 'overdue' | 'cancelled';
  progress_percentage?: number;
  maximum_marks?: number;
  marks_awarded?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  subtasks?: SubTask[] | null;
  notes?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  started_at?: string | null;
  started_by?: number | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  admin_feedback?: string | null;
  last_edited_by?: number | null;
  last_edited_at?: string | null;
  last_edit_summary?: string | null;
  edit_history?: TaskEditHistoryItem[] | null;
  created_at: string;
  updated_at: string;
  assigner?: TaskUser;
  assignedTo?: TaskUser;
  starter?: TaskUser;
  reviewer?: TaskUser;
  lastEditor?: TaskUser;
  submissions?: TaskSubmission[];
  latestSubmission?: TaskSubmission | null;
  latest_submission?: TaskSubmission | null;
  activities?: TaskActivity[];
}

export interface TaskMetrics {
  total: number;
  todo: number;
  in_progress: number;
  submitted_for_review?: number;
  needs_revision?: number;
  approved?: number;
  completed: number;
  overdue: number;
  cancelled: number;
  total_earned_marks?: number;
  total_possible_marks?: number;
  performance_percentage?: number;
  completion_rate: number;
}
