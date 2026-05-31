// Shared types for MV-GSM Goal Manager

export type UserRole = 'admin' | 'manager' | 'staff' | 'finance';
export type GoalStatus = 'draft' | 'active' | 'completed' | 'archived' | 'cancelled';
export type GoalCategory = 'tai_chinh' | 'san_pham' | 'khach_hang' | 'thuong_hieu' | 'he_thong' | 'doi_ngu';
export type TrackingStatus = 'done' | 'in_progress' | 'not_done';
export type RewardStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'reward_request' | 'reward_approved' | 'reward_rejected' | 'goal_alert' | 'goal_completed' | 'mention';
export type BCGCATEGORY = 'star' | 'cow' | 'question' | 'dog';

export interface Company {
  id: string;
  name: string;
  mission?: string;
  vision?: string;
  core_values?: string;
  reward_policy?: string;
  created_at: number;
  updated_at: number;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id?: string;
  is_active: number;
  created_at: number;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  manager_id?: string;
}

export interface Goal {
  id: string;
  company_id: string;
  category: GoalCategory;
  year: number;
  quarter?: number;
  start_week: number;
  end_week: number;
  title: string;
  description?: string;
  measure?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  deadline?: string;
  weight: number;
  owner_dept_id?: string;
  collab_dept_ids?: string;
  reward?: string;
  reward_value?: number;
  status: GoalStatus;
  created_by?: string;
  created_at: number;
  updated_at: number;
  deleted_at?: number;
}

export interface Strategy {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  sort_order: number;
}

export interface Evidence {
  id: string;
  goal_id: string;
  type: 'file' | 'link' | 'note';
  value: string;
  uploaded_by?: string;
  created_at: number;
}

export interface WeeklyTracking {
  id: string;
  goal_id: string;
  week_number: number;
  year: number;
  status: TrackingStatus;
  note?: string;
  updated_by?: string;
  updated_at: number;
}

export interface FinancialTarget {
  id: string;
  company_id: string;
  year: number;
  revenue_target: number;
  cost_ratio_target?: number;
  profit_ratio_target?: number;
}

export interface MonthlyActual {
  id: string;
  company_id: string;
  year: number;
  month: number;
  revenue?: number;
  cost?: number;
  profit?: number;
  updated_by?: string;
  updated_at: number;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  year: number;
  quantity_sold?: number;
  unit_price?: number;
  revenue?: number;
  profit_margin?: number;
  growth_rate?: number;
  bcg_category?: BCGCATEGORY;
  is_active: number;
}

export interface PersonalKPI {
  id: string;
  user_id: string;
  year: number;
  month?: number;
  income_target?: number;
  commission_rate?: number;
  conversion_rate?: number;
  avg_order_value?: number;
  working_days_per_month: number;
  created_at: number;
  updated_at: number;
}

export interface RewardApproval {
  id: string;
  goal_id: string;
  company_id: string;
  requested_by: string;
  requested_at: number;
  status: RewardStatus;
  reviewed_by?: string;
  reviewed_at?: number;
  reject_reason?: string;
  reward_description: string;
  reward_value?: number;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: number;
  created_at: number;
}

export interface ActivityFeed {
  id: string;
  company_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  meta?: Record<string, unknown>;
  created_at: number;
}

export interface GoalComment {
  id: string;
  goal_id: string;
  company_id: string;
  author_id: string;
  content: string;
  mentions?: string[];
  created_at: number;
  updated_at: number;
  deleted_at?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  deviceId: string;
  exp: number;
}

// Progress calculation
export interface GoalProgress {
  actualProgress: number; // DoneWeeks / TotalWeeks
  expectedProgress: number; // ElapsedWeeks / TotalWeeks
  healthScore: number; // ActualProgress / ExpectedProgress
  doneWeeks: number;
  totalWeeks: number;
  elapsedWeeks: number;
}
