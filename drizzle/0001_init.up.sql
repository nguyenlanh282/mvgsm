-- Migration 0001: Initial PostgreSQL Schema
-- Migrated from Cloudflare D1 (SQLite) to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================== COMPANIES ==================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mission TEXT,
  vision TEXT,
  core_values TEXT,
  reward_policy TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================== USERS ==================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('admin','manager','staff','finance')),
  department_id UUID,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);

-- ================== DEPARTMENTS ==================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  manager_id UUID
);

CREATE INDEX idx_departments_company ON departments(company_id);

-- ================== GOALS ==================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  category VARCHAR(50) NOT NULL CHECK(category IN (
    'tai_chinh','san_pham','khach_hang',
    'thuong_hieu','he_thong','doi_ngu'
  )),
  year INTEGER NOT NULL,
  quarter INTEGER,
  start_week INTEGER NOT NULL DEFAULT 1,
  end_week INTEGER NOT NULL DEFAULT 52,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  measure TEXT,
  target_value DECIMAL(15,2),
  current_value DECIMAL(15,2),
  unit VARCHAR(50),
  deadline TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  owner_dept_id UUID REFERENCES departments(id),
  collab_dept_ids JSONB DEFAULT '[]',
  reward TEXT,
  reward_value DECIMAL(15,2),
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','active','completed','archived','cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT goals_weeks_check CHECK (end_week >= start_week),
  CONSTRAINT goals_weight_check CHECK (weight >= 1 AND weight <= 100),
  CONSTRAINT goals_start_week_check CHECK (start_week >= 1 AND start_week <= 53),
  CONSTRAINT goals_end_week_check CHECK (end_week >= 1 AND end_week <= 53)
);

CREATE INDEX idx_goals_company ON goals(company_id);
CREATE INDEX idx_goals_year ON goals(year);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_deleted ON goals(deleted_at) WHERE deleted_at IS NULL;

-- ================== STRATEGIES ==================
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_strategies_goal ON strategies(goal_id);

-- ================== EVIDENCES ==================
CREATE TABLE IF NOT EXISTS evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK(type IN ('file','link','note')),
  value TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_evidences_goal ON evidences(goal_id);

-- ================== WEEKLY TRACKING ==================
CREATE TABLE IF NOT EXISTS weekly_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK(status IN ('done','in_progress','not_done')),
  note TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(goal_id, week_number, year)
);

CREATE INDEX idx_weekly_tracking_goal ON weekly_tracking(goal_id);
CREATE INDEX idx_weekly_tracking_year ON weekly_tracking(year);

-- ================== FINANCIAL TARGETS ==================
CREATE TABLE IF NOT EXISTS financial_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  year INTEGER NOT NULL,
  revenue_target DECIMAL(15,2) NOT NULL,
  cost_ratio_target DECIMAL(5,2),
  profit_ratio_target DECIMAL(5,2),
  UNIQUE(company_id, year)
);

-- ================== MONTHLY ACTUALS ==================
CREATE TABLE IF NOT EXISTS monthly_actuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  revenue DECIMAL(15,2),
  cost DECIMAL(15,2),
  profit DECIMAL(15,2),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, year, month)
);

CREATE INDEX idx_monthly_actuals_company_year ON monthly_actuals(company_id, year);

-- ================== PRODUCTS (BCG) ==================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  quantity_sold INTEGER,
  unit_price DECIMAL(15,2),
  revenue DECIMAL(15,2),
  profit_margin DECIMAL(5,2),
  growth_rate DECIMAL(5,2),
  bcg_category VARCHAR(50) CHECK(bcg_category IN ('star','cow','question','dog')),
  is_active INTEGER DEFAULT 1
);

CREATE INDEX idx_products_company_year ON products(company_id, year);
CREATE INDEX idx_products_bcg ON products(bcg_category);

-- ================== PERSONAL KPI ==================
CREATE TABLE IF NOT EXISTS personal_kpi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  avg_order_value DECIMAL(15,2),
  working_days_per_month INTEGER DEFAULT 26,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_personal_kpi_user ON personal_kpi(user_id);

-- ================== REWARD APPROVALS ==================
CREATE TABLE IF NOT EXISTS reward_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reject_reason TEXT,
  reward_description TEXT NOT NULL,
  reward_value DECIMAL(15,2)
);

CREATE UNIQUE INDEX idx_reward_pending_unique ON reward_approvals(goal_id) WHERE status = 'pending';
CREATE INDEX idx_reward_company_status ON reward_approvals(company_id, status);
CREATE INDEX idx_reward_goal ON reward_approvals(goal_id);

-- ================== NOTIFICATIONS ==================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK(type IN (
    'reward_request','reward_approved','reward_rejected',
    'goal_alert','goal_completed','mention'
  )),
  title VARCHAR(500) NOT NULL,
  content TEXT,
  entity_type VARCHAR(50),
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_company ON notifications(company_id);

-- ================== ACTIVITY FEED ==================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK(action IN (
    'tracking_updated','goal_created','goal_status_changed',
    'goal_completed','reward_requested','reward_approved',
    'reward_rejected','comment_added','financial_updated'
  )),
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  entity_title VARCHAR(500) NOT NULL,
  meta JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_feed_company ON activity_feed(company_id, created_at DESC);

-- ================== GOAL COMMENTS ==================
CREATE TABLE IF NOT EXISTS goal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_goal_comments_goal ON goal_comments(goal_id, created_at ASC);

-- ================== PERSONAL KPI HISTORY ==================
CREATE TABLE IF NOT EXISTS personal_kpi_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_kpi_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  avg_order_value DECIMAL(15,2),
  working_days_per_month INTEGER,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personal_kpi_history_user ON personal_kpi_history(user_id, changed_at DESC);

-- ================== AUDIT CRITICAL ==================
CREATE TABLE IF NOT EXISTS audit_critical (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_critical_entity ON audit_critical(company_id, entity_type, entity_id, created_at DESC);

-- ================== REFRESH TOKENS ==================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  token_hash TEXT NOT NULL,
  device_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);