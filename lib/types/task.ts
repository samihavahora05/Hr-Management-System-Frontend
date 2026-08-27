export interface SubTask {
  id: string | number;
  text: string;
  completed: boolean;
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
  status: 'todo' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  progress_percentage?: number;
  start_date?: string | null;
  due_date?: string | null;
  subtasks?: SubTask[] | null;
  notes?: string | null;
  completion_notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  assigner?: TaskUser;
  assignedTo?: TaskUser;
}

export interface TaskMetrics {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  completion_rate: number;
}
