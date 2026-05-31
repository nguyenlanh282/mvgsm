-- Migration 0001: Initial Schema
-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mission TEXT,
  vision TEXT,
  core_values TEXT,
  reward_policy TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','manager','staff','finance')),
  department_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  manager_id TEXT REFERENCES users(id)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  category TEXT NOT NULL CHECK(category IN (
    'tai_chinh','san_pham','khach_hang',
    'thuong_hieu','he_thong','doi_ngu'
  )),
  year INTEGER NOT NULL,
  quarter INTEGER,
  start_week INTEGER NOT NULL DEFAULT 1,
  end_week INTEGER NOT NULL DEFAULT 52,
  title TEXT NOT NULL,
  description TEXT,
  measure TEXT,
  target_value REAL,
  current_value REAL,
  unit TEXT,
  deadline TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  owner_dept_id TEXT REFERENCES departments(id),
  collab_dept_ids TEXT,
  reward TEXT,
  reward_value REAL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','active','completed','archived','cancelled')),
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  CHECK (end_week >= start_week),
  CHECK (start_week BETWEEN 1 AND 53),
  CHECK (end_week BETWEEN 1 AND 53),
  CHECK (weight BETWEEN 1 AND 100)
);

-- Strategies
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Evidences
CREATE TABLE IF NOT EXISTS evidences (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('file','link','note')),
  value TEXT NOT NULL,
  uploaded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- Weekly Tracking
CREATE TABLE IF NOT EXISTS weekly_tracking (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('done','in_progress','not_done')),
  note TEXT,
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL,
  UNIQUE(goal_id, week_number, year)
);

-- Financial Targets
CREATE TABLE IF NOT EXISTS financial_targets (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  year INTEGER NOT NULL,
  revenue_target REAL NOT NULL,
  cost_ratio_target REAL,
  profit_ratio_target REAL,
  UNIQUE(company_id, year)
);

-- Monthly Actuals
CREATE TABLE IF NOT EXISTS monthly_actuals (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  revenue REAL,
  cost REAL,
  profit REAL,
  updated_by TEXT REFERENCES users(id),
  updated_at INTEGER NOT NULL,
  UNIQUE(company_id, year, month)
);

-- Products (BCG)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  quantity_sold INTEGER,
  unit_price REAL,
  revenue REAL,
  profit_margin REAL,
  growth_rate REAL,
  bcg_category TEXT CHECK(bcg_category IN ('star','cow','question','dog')),
  is_active INTEGER DEFAULT 1
);

-- Personal KPI
CREATE TABLE IF NOT EXISTS personal_kpi (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target REAL,
  commission_rate REAL,
  conversion_rate REAL,
  avg_order_value REAL,
  working_days_per_month INTEGER DEFAULT 26,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Reward Approvals
CREATE TABLE IF NOT EXISTS reward_approvals (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id),
  requested_by TEXT REFERENCES users(id),
  requested_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  reject_reason TEXT,
  reward_description TEXT NOT NULL,
  reward_value REAL
);

CREATE UNIQUE INDEX idx_unique_pending_reward
  ON reward_approvals(goal_id)
  WHERE status = 'pending';

CREATE INDEX idx_reward_approvals_company_status
  ON reward_approvals(company_id, status);

CREATE INDEX idx_reward_approvals_goal
  ON reward_approvals(goal_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN (
    'reward_request','reward_approved','reward_rejected',
    'goal_alert','goal_completed','mention'
  )),
  title TEXT NOT NULL,
  content TEXT,
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  actor_id TEXT REFERENCES users(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'tracking_updated','goal_created','goal_status_changed',
    'goal_completed','reward_requested','reward_approved',
    'reward_rejected','comment_added','financial_updated'
  )),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_title TEXT NOT NULL,
  meta TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_activity_feed_company
  ON activity_feed(company_id, created_at DESC);

-- Goal Comments
CREATE TABLE IF NOT EXISTS goal_comments (
  id TEXT PRIMARY KEY,
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id),
  author_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,
  mentions TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX idx_goal_comments_goal
  ON goal_comments(goal_id, created_at ASC);

-- Personal KPI History
CREATE TABLE IF NOT EXISTS personal_kpi_history (
  id TEXT PRIMARY KEY,
  personal_kpi_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target REAL,
  commission_rate REAL,
  conversion_rate REAL,
  avg_order_value REAL,
  working_days_per_month INTEGER,
  changed_by TEXT REFERENCES users(id),
  changed_at INTEGER NOT NULL
);

CREATE INDEX idx_personal_kpi_history_user
  ON personal_kpi_history(user_id, changed_at DESC);

-- Audit Critical (for critical events - dual write)
CREATE TABLE IF NOT EXISTS audit_critical (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_critical_entity
  ON audit_critical(company_id, entity_type, entity_id, created_at DESC);
