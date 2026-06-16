# Migration Plan: Cloudflare Workers + D1 to Dokploy + PostgreSQL

## Context

MVGSM currently runs on Cloudflare Workers with D1 (SQLite), KV (CACHE, AUDIT_KV), and R2 storage. Migration to Dokploy + PostgreSQL is required for better SQL capabilities (PostgreSQL vs SQLite), easier self-hosting, and reduced vendor lock-in.

**Current Stack:**
- API: Cloudflare Workers (Hono framework)
- Database: D1 (Cloudflare's SQLite)
- Cache: KV Namespace (CACHE - refresh tokens, AUDIT_KV - audit logs)
- Storage: R2 Bucket (defined but NOT actively used in code)
- Auth: JWT with refresh tokens stored in KV

**Target Stack:**
- API: Dokploy (Node.js/Express or keep Hono with adapter)
- Database: PostgreSQL
- Cache: Redis (replace KV)
- Storage: Local filesystem or S3-compatible (replace R2)

---

## 1. API Routes Overview

### Public Routes (No Auth)
| Route | Method | Function |
|-------|--------|----------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Register new user+company |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout (clear refresh token) |
| `/api/health` | GET | Health check |

### Protected Routes (Auth Required)
| Route | Methods | Function |
|-------|---------|----------|
| `/api/company` | GET, PUT | Company info CRUD |
| `/api/users` | GET, POST | User management |
| `/api/departments` | GET, POST, PUT | Department CRUD |
| `/api/goals` | GET, POST, PUT, DELETE | Goal CRUD, soft delete, restore |
| `/api/goals/:id/strategies` | POST | Add strategy to goal |
| `/api/tracking/goals/:id` | GET | Get goal tracking data |
| `/api/tracking/goals/:id/week/:week` | PUT | Update weekly tracking |
| `/api/tracking/dashboard` | GET | Dashboard with all goals progress |
| `/api/financial/targets/:year` | GET, PUT | Financial targets |
| `/api/financial/actuals/:year` | GET | Monthly actuals |
| `/api/financial/actuals/:year/:month` | PUT | Update monthly actual |
| `/api/financial/fiveway/:year` | GET | Five-way analysis |
| `/api/products` | GET, POST, PUT, DELETE | BCG product matrix |
| `/api/personal-kpi` | GET | Personal KPI list |
| `/api/personal-kpi/calculate` | GET | Calculate KPI targets |
| `/api/reward-approvals` | GET | List reward approvals |
| `/api/reward-approvals/goals/:id/request` | POST | Request reward |
| `/api/reward-approvals/:id/approve` | PUT | Approve reward |
| `/api/reward-approvals/:id/reject` | PUT | Reject reward |
| `/api/notifications` | GET | List notifications |
| `/api/notifications/count-unread` | GET | Unread count |
| `/api/notifications/:id/read` | PUT | Mark as read |
| `/api/notifications/read-all` | PUT | Mark all as read |
| `/api/activity-feed` | GET | Activity feed |
| `/api/comments/goals/:id/comments` | GET, POST | Goal comments |
| `/api/reports/quarterly` | GET | Quarterly reports |
| `/api/reports/department/:id` | GET | Department reports |

---

## 2. Database Schema (Current D1/SQLite)

### Tables
1. **companies** - Company info
2. **users** - User accounts with bcrypt password_hash
3. **departments** - Departments with manager reference
4. **goals** - Goals with soft delete, quarter/week tracking, weight system
5. **strategies** - Strategies linked to goals
6. **evidences** - Evidence files/links for goals
7. **weekly_tracking** - Weekly progress tracking
8. **financial_targets** - Yearly financial targets
9. **monthly_actuals** - Monthly revenue/cost/profit
10. **products** - BCG matrix products
11. **personal_kpi** - Personal KPI settings
12. **personal_kpi_history** - KPI change history
13. **reward_approvals** - Reward request workflow
14. **notifications** - User notifications
15. **activity_feed** - Activity log
16. **goal_comments** - Comments on goals
17. **audit_critical** - Critical audit events

### Key Constraints
- SQLite uses `INTEGER` for booleans (0/1)
- Timestamps stored as Unix milliseconds (INTEGER)
- Foreign keys for company/user isolation
- Unique constraints for unique rewards per pending goal

---

## 3. Bindings Usage Summary

### D1 Database (`DB`)
Used in ALL routes for CRUD operations. All queries use D1 prepared statements:
```typescript
c.env.DB.prepare('SELECT ...').bind(...).first()
c.env.DB.prepare('SELECT ...').bind(...).all()
c.env.DB.prepare('INSERT ...').bind(...).run()
```

### KV Namespace (`CACHE`)
- **Purpose**: Refresh token storage
- **Key format**: `rt:{userId}:{deviceId}`
- **Value**: Refresh token string
- **TTL**: 30 days (2592000 seconds)
- **Operations**: GET (read token), PUT (store token), DELETE (logout)

### KV Namespace (`AUDIT_KV`)
- **Purpose**: Audit log storage
- **Key format**: `audit:{companyId}:{entityType}:{entityId}:{timestamp}`
- **Value**: JSON payload with action, user, old/new values
- **TTL**: 365 days
- **Operations**: PUT (write), list + get (read)
- **Dual-write pattern**: Critical events also written to `audit_critical` D1 table

### R2 Bucket (`STORAGE`)
- **Status**: DEFINED in wrangler.toml but NOT USED in current code
- **Intended for**: Evidence file uploads (evidences table has `type: 'file'`)
- **Action needed**: Can be stubbed/ignored for MVP migration

---

## 4. Suggested PostgreSQL Schema

### Direct Mappings (Minor Changes)
```sql
-- companies (unchanged)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mission TEXT,
  vision TEXT,
  core_values TEXT,
  reward_policy TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- users (add constraint)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','manager','staff','finance')),
  department_id UUID,
  is_active INTEGER DEFAULT 1,
  created_at BIGINT NOT NULL
);

-- departments (add constraint)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  manager_id UUID REFERENCES users(id)
);

-- goals (add constraint, change REAL to DECIMAL)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  category TEXT NOT NULL CHECK(category IN ('tai_chinh','san_pham','khach_hang','thuong_hieu','he_thong','doi_ngu')),
  year INTEGER NOT NULL,
  quarter INTEGER,
  start_week INTEGER NOT NULL DEFAULT 1,
  end_week INTEGER NOT NULL DEFAULT 52,
  title TEXT NOT NULL,
  description TEXT,
  measure TEXT,
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  deadline TEXT,
  weight INTEGER NOT NULL DEFAULT 10,
  owner_dept_id UUID REFERENCES departments(id),
  collab_dept_ids JSONB DEFAULT '[]',
  reward TEXT,
  reward_value DECIMAL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','archived','cancelled')),
  created_by UUID REFERENCES users(id),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT,
  CONSTRAINT chk_weeks CHECK (end_week >= start_week),
  CONSTRAINT chk_weight CHECK (weight BETWEEN 1 AND 100)
);

-- strategies (add constraint)
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- evidences (add constraint)
CREATE TABLE evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('file','link','note')),
  value TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at BIGINT NOT NULL
);

-- weekly_tracking (add constraint)
CREATE TABLE weekly_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('done','in_progress','not_done')),
  note TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at BIGINT NOT NULL,
  UNIQUE(goal_id, week_number, year)
);

-- financial_targets (add constraint)
CREATE TABLE financial_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INTEGER NOT NULL,
  revenue_target DECIMAL NOT NULL,
  cost_ratio_target DECIMAL,
  profit_ratio_target DECIMAL,
  UNIQUE(company_id, year)
);

-- monthly_actuals (add constraint)
CREATE TABLE monthly_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
  revenue DECIMAL,
  cost DECIMAL,
  profit DECIMAL,
  updated_by UUID REFERENCES users(id),
  updated_at BIGINT NOT NULL,
  UNIQUE(company_id, year, month)
);

-- products (add constraint)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  quantity_sold INTEGER,
  unit_price DECIMAL,
  revenue DECIMAL,
  profit_margin DECIMAL,
  growth_rate DECIMAL,
  bcg_category TEXT CHECK(bcg_category IN ('star','cow','question','dog')),
  is_active INTEGER DEFAULT 1
);

-- personal_kpi (add constraint)
CREATE TABLE personal_kpi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target DECIMAL,
  commission_rate DECIMAL,
  conversion_rate DECIMAL,
  avg_order_value DECIMAL,
  working_days_per_month INTEGER DEFAULT 26,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- reward_approvals (add constraint)
CREATE TABLE reward_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  requested_by UUID REFERENCES users(id),
  requested_at BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at BIGINT,
  reject_reason TEXT,
  reward_description TEXT NOT NULL,
  reward_value DECIMAL
);

CREATE UNIQUE INDEX idx_unique_pending_reward ON reward_approvals(goal_id) WHERE status = 'pending';
CREATE INDEX idx_reward_approvals_company_status ON reward_approvals(company_id, status);
CREATE INDEX idx_reward_approvals_goal ON reward_approvals(goal_id);

-- notifications (add constraint)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('reward_request','reward_approved','reward_rejected','goal_alert','goal_completed','mention')),
  title TEXT NOT NULL,
  content TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- activity_feed (add constraint)
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  actor_id UUID REFERENCES users(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('tracking_updated','goal_created','goal_status_changed','goal_completed','reward_requested','reward_approved','reward_rejected','comment_added','financial_updated')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_title TEXT NOT NULL,
  meta JSONB,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_activity_feed_company ON activity_feed(company_id, created_at DESC);

-- goal_comments (add constraint)
CREATE TABLE goal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  mentions JSONB,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  deleted_at BIGINT
);

CREATE INDEX idx_goal_comments_goal ON goal_comments(goal_id, created_at ASC);

-- personal_kpi_history (add constraint)
CREATE TABLE personal_kpi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_kpi_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  year INTEGER NOT NULL,
  month INTEGER,
  income_target DECIMAL,
  commission_rate DECIMAL,
  conversion_rate DECIMAL,
  avg_order_value DECIMAL,
  working_days_per_month INTEGER,
  changed_by UUID REFERENCES users(id),
  changed_at BIGINT NOT NULL
);

CREATE INDEX idx_personal_kpi_history_user ON personal_kpi_history(user_id, changed_at DESC);

-- audit_critical (add constraint)
CREATE TABLE audit_critical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_audit_critical_entity ON audit_critical(company_id, entity_type, entity_id, created_at DESC);
```

### New Tables for Redis Replacement
```sql
-- refresh_tokens: replace KV CACHE namespace
CREATE TABLE refresh_tokens (
  key TEXT PRIMARY KEY,  -- format: rt:{userId}:{deviceId}
  token TEXT NOT NULL,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, device_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- audit_logs: replace KV AUDIT_KV namespace
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  key TEXT NOT NULL,  -- format: audit:{companyId}:{entityType}:{entityId}:{timestamp}
  payload JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX idx_audit_logs_key ON audit_logs(key);
CREATE INDEX idx_audit_logs_entity ON audit_logs(company_id, entity_type, entity_id, created_at DESC);
```

---

## 5. Key Code Changes Required

### A. Database Layer
1. **Replace D1 client with PostgreSQL client** (use `pg` or `postgres.js` or Drizzle ORM)
2. **Convert all queries** from D1 prepared statements to PostgreSQL
3. **Replace `crypto.randomUUID()`** with database UUID generation or `gen_random_uuid()`
4. **Handle `JSON.stringify/parse`** for `collab_dept_ids`, `mentions`, `meta` fields (use PostgreSQL JSONB)

### B. Authentication Changes
| Cloudflare | PostgreSQL Alternative |
|------------|----------------------|
| `c.env.CACHE.put(rtKey, token, {expirationTtl})` | `INSERT INTO refresh_tokens (key, token, user_id, device_id, expires_at, created_at) VALUES (...) ON CONFLICT(key) DO UPDATE SET token=...` |
| `c.env.CACHE.get(rtKey)` | `SELECT token FROM refresh_tokens WHERE key = ? AND expires_at > ?` |
| `c.env.CACHE.delete(rtKey)` | `DELETE FROM refresh_tokens WHERE key = ?` |

### C. Audit Log Changes
| Cloudflare | PostgreSQL Alternative |
|------------|----------------------|
| `c.env.AUDIT_KV.put(key, JSON.stringify(payload), {expirationTtl})` | `INSERT INTO audit_logs (id, company_id, entity_type, entity_id, key, payload, created_at) VALUES (gen_random_uuid(), ..., to_jsonb(?), ...)` |
| `c.env.AUDIT_KV.list({prefix, limit})` | `SELECT * FROM audit_logs WHERE key LIKE ? ORDER BY created_at DESC LIMIT ?` |
| `c.env.AUDIT_KV.get(key.name)` | `SELECT payload FROM audit_logs WHERE key = ?` |

### D. R2 Storage (Not Currently Used)
- R2 bucket is defined but NO file uploads exist in current code
- `evidences` table has `type: 'file'` but no R2 operations found
- **Action**: Stub R2 operations or implement S3-compatible storage later

### E. Framework Adapter
- Hono runs on Cloudflare Workers and Node.js
- Can keep Hono but swap Cloudflare-specific bindings
- Consider using `@hono/node-server` adapter for Dokploy

---

## 6. Web App Changes (`apps/web/lib/api.ts`)

### Current State
```typescript
const API_BASE = 'https://goal-manager-api.admin-tripower-account.workers.dev'
```
Hardcoded Cloudflare Workers URL.

### Required Changes
1. **Environment-based API URL**:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

2. **Update environment variables**:
   - Add `NEXT_PUBLIC_API_URL` for web app
   - Remove Cloudflare-specific bindings

3. **No changes to API interface** - endpoints remain the same

---

## 7. Migration Phases

### Phase 1: Schema & Infrastructure
- [ ] Set up Dokploy project with PostgreSQL database
- [ ] Create PostgreSQL schema (tables + indexes)
- [ ] Create migration scripts from SQLite to PostgreSQL
- [ ] Set up Redis for refresh tokens (or use PostgreSQL)
- [ ] Configure environment variables

### Phase 2: API Migration
- [ ] Install PostgreSQL client (`postgres` or `pg` or Drizzle)
- [ ] Replace all `c.env.DB.prepare()` with PostgreSQL queries
- [ ] Replace KV CACHE operations with `refresh_tokens` table
- [ ] Replace KV AUDIT_KV operations with `audit_logs` table
- [ ] Update `types.ts` to remove Cloudflare bindings
- [ ] Test all endpoints with new database

### Phase 3: Web App Updates
- [ ] Update `api.ts` to use environment variable for API URL
- [ ] Update deployment configuration for Dokploy
- [ ] Test authentication flow (login, refresh, logout)
- [ ] Test all major workflows

### Phase 4: Data Migration
- [ ] Export data from D1 (SQLite)
- [ ] Transform and import into PostgreSQL
- [ ] Validate data integrity
- [ ] Switch DNS/traffic to new API

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| UUID vs string IDs | Medium | Use `gen_random_uuid()` or cast |
| SQLite INTEGER booleans | Low | Use `0/1` or add CHECK constraint |
| Timestamp format | Low | Keep as BIGINT milliseconds |
| KV TTL/expiration | Medium | Use `expires_at` column in PostgreSQL |
| JSON fields | Low | Use PostgreSQL JSONB type |
| Real to Decimal precision | Low | Minor precision changes acceptable |

---

## 9. Unresolved Questions

1. **Password hashing**: Currently using SHA-256 (not bcrypt). Should we migrate to bcrypt for better security?
2. **R2 file uploads**: Since R2 is not used, should we implement S3-compatible storage now or later?
3. **Data migration**: Need access to existing D1 database for data export
4. **Redis vs PostgreSQL**: Use PostgreSQL for refresh tokens (simpler) or add Redis (more authentic to original)?
5. **API deployment**: Continue using Hono on Dokploy or switch to Express/Fastify?

---

## Files Reference

**API Source:**
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/index.ts` - Main entry
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/types.ts` - Env bindings
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/routes/*.ts` - All routes (14 files)
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/middleware/auth.ts` - Auth middleware
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/utils/jwt.ts` - JWT utilities
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/src/utils/audit.ts` - Audit log utility

**Database:**
- `/home/nguyenlanh/vibe-code/mvgsm/migrations/0001_init.up.sql` - Full schema

**Web App:**
- `/home/nguyenlanh/vibe-code/mvgsm/apps/web/lib/api.ts` - API client

**Config:**
- `/home/nguyenlanh/vibe-code/mvgsm/apps/api/wrangler.toml` - Cloudflare bindings
