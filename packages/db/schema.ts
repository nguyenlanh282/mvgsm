import { pgTable, text, integer, real, timestamp, uuid, jsonb, index, unique, check } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// ================== COMPANIES ==================
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  mission: text('mission'),
  vision: text('vision'),
  coreValues: text('core_values'),
  rewardPolicy: text('reward_policy'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ================== USERS ==================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().$type<'admin' | 'manager' | 'staff' | 'finance'>(),
  departmentId: uuid('department_id'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ================== DEPARTMENTS ==================
export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  name: text('name').notNull(),
  managerId: uuid('manager_id'),
})

// ================== GOALS ==================
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  category: text('category').notNull().$type<'tai_chinh' | 'san_pham' | 'khach_hang' | 'thuong_hieu' | 'he_thong' | 'doi_ngu'>(),
  year: integer('year').notNull(),
  quarter: integer('quarter'),
  startWeek: integer('start_week').notNull().default(1),
  endWeek: integer('end_week').notNull().default(52),
  title: text('title').notNull(),
  description: text('description'),
  measure: text('measure'),
  targetValue: real('target_value'),
  currentValue: real('current_value'),
  unit: text('unit'),
  deadline: text('deadline'),
  weight: integer('weight').notNull().default(10),
  ownerDeptId: uuid('owner_dept_id').references(() => departments.id),
  collabDeptIds: jsonb('collab_dept_ids').$type<string[]>().default(sql`'[]'`),
  reward: text('reward'),
  rewardValue: real('reward_value'),
  status: text('status').notNull().default('draft').$type<'draft' | 'active' | 'completed' | 'archived' | 'cancelled'>(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('goals_company_idx').on(table.companyId),
  index('goals_year_idx').on(table.year),
  index('goals_status_idx').on(table.status),
  check('goals_weeks_check', sql`end_week >= start_week`),
  check('goals_weight_check', sql`weight >= 1 AND weight <= 100`),
])

// ================== STRATEGIES ==================
export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
})

// ================== EVIDENCES ==================
export const evidences = pgTable('evidences', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  type: text('type').$type<'file' | 'link' | 'note'>(),
  value: text('value').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ================== WEEKLY TRACKING ==================
export const weeklyTracking = pgTable('weekly_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull().$type<'done' | 'in_progress' | 'not_done'>(),
  note: text('note'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique('weekly_tracking_unique').on(table.goalId, table.weekNumber, table.year),
])

// ================== FINANCIAL TARGETS ==================
export const financialTargets = pgTable('financial_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  year: integer('year').notNull(),
  revenueTarget: real('revenue_target').notNull(),
  costRatioTarget: real('cost_ratio_target'),
  profitRatioTarget: real('profit_ratio_target'),
}, (table) => [
  unique('financial_targets_unique').on(table.companyId, table.year),
])

// ================== MONTHLY ACTUALS ==================
export const monthlyActuals = pgTable('monthly_actuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  revenue: real('revenue'),
  cost: real('cost'),
  profit: real('profit'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique('monthly_actuals_unique').on(table.companyId, table.year, table.month),
])

// ================== PRODUCTS (BCG) ==================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  quantitySold: integer('quantity_sold'),
  unitPrice: real('unit_price'),
  revenue: real('revenue'),
  profitMargin: real('profit_margin'),
  growthRate: real('growth_rate'),
  bcgCategory: text('bcg_category').$type<'star' | 'cow' | 'question' | 'dog'>(),
  isActive: integer('is_active').default(1),
})

// ================== PERSONAL KPI ==================
export const personalKpi = pgTable('personal_kpi', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  year: integer('year').notNull(),
  month: integer('month'),
  incomeTarget: real('income_target'),
  commissionRate: real('commission_rate'),
  conversionRate: real('conversion_rate'),
  avgOrderValue: real('avg_order_value'),
  workingDaysPerMonth: integer('working_days_per_month').default(26),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  unique('personal_kpi_unique').on(table.userId, table.year, table.month),
])

// ================== REWARD APPROVALS ==================
export const rewardApprovals = pgTable('reward_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id),
  requestedBy: uuid('requested_by').references(() => users.id),
  requestedAt: timestamp('requested_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  status: text('status').notNull().default('pending').$type<'pending' | 'approved' | 'rejected'>(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  rejectReason: text('reject_reason'),
  rewardDescription: text('reward_description').notNull(),
  rewardValue: real('reward_value'),
}, (table) => [
  unique('reward_approvals_pending_unique').on(table.goalId),
  index('reward_approvals_company_status_idx').on(table.companyId, table.status),
])

// ================== NOTIFICATIONS ==================
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  userId: uuid('user_id').references(() => users.id),
  type: text('type').notNull().$type<'reward_request' | 'reward_approved' | 'reward_rejected' | 'goal_alert' | 'goal_completed' | 'mention'>(),
  title: text('title').notNull(),
  content: text('content'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  isRead: integer('is_read').notNull().default(0),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('notifications_user_unread_idx').on(table.userId, table.isRead, table.createdAt),
])

// ================== ACTIVITY FEED ==================
export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  actorId: uuid('actor_id').references(() => users.id),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull().$type<'tracking_updated' | 'goal_created' | 'goal_status_changed' | 'goal_completed' | 'reward_requested' | 'reward_approved' | 'reward_rejected' | 'comment_added' | 'financial_updated'>(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  entityTitle: text('entity_title').notNull(),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('activity_feed_company_idx').on(table.companyId, table.createdAt),
])

// ================== GOAL COMMENTS ==================
export const goalComments = pgTable('goal_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id),
  authorId: uuid('author_id').references(() => users.id),
  content: text('content').notNull(),
  mentions: jsonb('mentions').$type<string[]>().default(sql`'[]'`),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('goal_comments_goal_idx').on(table.goalId, table.createdAt),
])

// ================== PERSONAL KPI HISTORY ==================
export const personalKpiHistory = pgTable('personal_kpi_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  personalKpiId: uuid('personal_kpi_id').notNull(),
  userId: uuid('user_id').references(() => users.id),
  year: integer('year').notNull(),
  month: integer('month'),
  incomeTarget: real('income_target'),
  commissionRate: real('commission_rate'),
  conversionRate: real('conversion_rate'),
  avgOrderValue: real('avg_order_value'),
  workingDaysPerMonth: integer('working_days_per_month'),
  changedBy: uuid('changed_by').references(() => users.id),
  changedAt: timestamp('changed_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('personal_kpi_history_user_idx').on(table.userId, table.changedAt),
])

// ================== AUDIT CRITICAL ==================
export const auditCritical = pgTable('audit_critical', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: text('company_id').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  payload: text('payload').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('audit_critical_entity_idx').on(table.companyId, table.entityType, table.entityId, table.createdAt),
])

// ================== REFRESH TOKENS ==================
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  deviceId: text('device_id'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index('refresh_tokens_user_idx').on(table.userId),
  index('refresh_tokens_expires_idx').on(table.expiresAt),
])

// ================== RELATIONS ==================
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  departments: many(departments),
  goals: many(goals),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  personalKpis: many(personalKpi),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  company: one(companies, { fields: [goals.companyId], references: [companies.id] }),
  ownerDept: one(departments, { fields: [goals.ownerDeptId], references: [departments.id] }),
  creator: one(users, { fields: [goals.createdBy], references: [users.id] }),
  strategies: many(strategies),
  weeklyTracking: many(weeklyTracking),
  rewardApprovals: many(rewardApprovals),
  comments: many(goalComments),
}))