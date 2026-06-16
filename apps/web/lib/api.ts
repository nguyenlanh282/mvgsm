// Use environment variable or default to local API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Lỗi server')
  }

  return data
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api<{ success: boolean; data: { accessToken: string; refreshToken: string; user: User } }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password } }
    ),

  register: (data: { email: string; password: string; name: string; companyName?: string }) =>
    api<{ success: boolean; data: { accessToken: string; refreshToken: string; user: User } }>(
      '/api/auth/register',
      { method: 'POST', body: data }
    ),

  refresh: (refreshToken: string) =>
    api<{ success: boolean; data: { accessToken: string } }>(
      '/api/auth/refresh',
      { method: 'POST', body: { refreshToken } }
    ),

  logout: () =>
    api<{ success: boolean }>(
      '/api/auth/logout',
      { method: 'POST', body: {} }
    ),
}

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff' | 'finance'
  companyId: string
  is_active?: number
}

export interface Goal {
  id: string
  company_id: string
  category: string
  year: number
  quarter?: number
  start_week: number
  end_week: number
  title: string
  description?: string
  measure?: string
  target_value?: number
  current_value?: number
  unit?: string
  deadline?: string
  weight: number
  owner_dept_id?: string
  collab_dept_ids?: string
  reward?: string
  reward_value?: number
  status: string
  created_by?: string
  created_at: number
  updated_at: number
  deleted_at?: number
  department_name?: string
  progress?: {
    actualProgress: number
    expectedProgress: number
    healthScore: number
    doneWeeks: number
    totalWeeks: number
    elapsedWeeks: number
  }
}

export interface Company {
  id: string
  name: string
  mission?: string
  vision?: string
  core_values?: string
  reward_policy?: string
}

export interface Department {
  id: string
  company_id: string
  name: string
  manager_id?: string
  manager_name?: string
}

export interface WeeklyTracking {
  id: string
  goal_id: string
  week_number: number
  year: number
  status: 'done' | 'in_progress' | 'not_done'
  note?: string
  updated_by?: string
  updated_at: number
  updater_name?: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  content?: string
  entity_type?: string
  entity_id?: string
  is_read: number
  created_at: number
}

export interface ActivityItem {
  id: string
  actor_name: string
  action: string
  entity_type: string
  entity_id: string
  entity_title: string
  meta?: string
  created_at: number
}

export interface RewardApproval {
  id: string
  goal_id: string
  company_id: string
  requested_by: string
  requested_at: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: number
  reject_reason?: string
  reward_description: string
  reward_value?: number
  goal_title?: string
  requester_name?: string
}

export interface PersonalKPI {
  id: string
  user_id: string
  year: number
  month?: number
  income_target?: number
  commission_rate?: number
  conversion_rate?: number
  avg_order_value?: number
  working_days_per_month: number
}

// Goals API
export const goalsApi = {
  list: (params?: { year?: number; category?: string; dept?: string; status?: string }) => {
    const query = new URLSearchParams()
    if (params?.year) query.set('year', String(params.year))
    if (params?.category) query.set('category', params.category)
    if (params?.dept) query.set('dept', params.dept)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return api<{ success: boolean; data: Goal[] }>(`/api/goals${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) =>
    api<{ success: boolean; data: Goal & { strategies: any[]; rewardApprovals: RewardApproval[] } }>(
      `/api/goals/${id}`
    ),

  create: (data: Partial<Goal>) =>
    api<{ success: boolean; data: Goal; weightWarning?: string; error?: string }>('/api/goals', { method: 'POST', body: data }),

  update: (id: string, data: Partial<Goal>) =>
    api<{ success: boolean; data: Goal }>(`/api/goals/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    api<{ success: boolean }>(`/api/goals/${id}`, { method: 'DELETE' }),

  restore: (id: string) =>
    api<{ success: boolean; data: Goal }>(`/api/goals/${id}/restore`, { method: 'POST' }),
}

// Company API
export const companyApi = {
  get: () =>
    api<{ success: boolean; data: Company }>('/api/company'),

  update: (data: Partial<Company>) =>
    api<{ success: boolean; data: Company }>('/api/company', { method: 'PUT', body: data }),
}

// Users API
export const usersApi = {
  list: () =>
    api<{ success: boolean; data: User[] }>('/api/users'),

  create: (data: { email: string; password: string; name: string; role: string; department_id?: string }) =>
    api<{ success: boolean; data: User }>('/api/users', { method: 'POST', body: data }),
}

// Departments API
export const departmentsApi = {
  list: () =>
    api<{ success: boolean; data: Department[] }>('/api/departments'),

  create: (data: { name: string; manager_id?: string }) =>
    api<{ success: boolean; data: Department }>('/api/departments', { method: 'POST', body: data }),
}

// Tracking API
export const trackingApi = {
  get: (goalId: string, year?: number) => {
    const qs = year ? `?year=${year}` : ''
    return api<{
      success: boolean
      data: {
        goal: Goal
        tracking: WeeklyTracking[]
        progress: Goal['progress']
        currentWeek: number
        currentYear: number
      }
    }>(`/api/tracking/goals/${goalId}${qs}`)
  },

  update: (goalId: string, week: number, data: { year: number; status: string; note?: string }) =>
    api<{ success: boolean }>(`/api/tracking/goals/${goalId}/week/${week}`, { method: 'PUT', body: data }),
}

// Dashboard API
export const dashboardApi = {
  getTracking: (params?: { year?: number; quarter?: number }) => {
    const query = new URLSearchParams()
    if (params?.year) query.set('year', String(params.year))
    if (params?.quarter) query.set('quarter', String(params.quarter))
    const qs = query.toString()
    return api<{ success: boolean; data: any }>(`/api/tracking/dashboard${qs ? `?${qs}` : ''}`)
  },
}

// Financial API
export const financialApi = {
  getTargets: (year: number) =>
    api<{ success: boolean; data: any }>(`/api/financial/targets/${year}`),

  updateTargets: (year: number, data: any) =>
    api<{ success: boolean; data: any }>(`/api/financial/targets/${year}`, { method: 'PUT', body: data }),

  getActuals: (year: number) =>
    api<{ success: boolean; data: { actuals: any[]; target: any; year: number } }>(
      `/api/financial/actuals/${year}`
    ),

  updateActual: (year: number, month: number, data: any) =>
    api<{ success: boolean; data: any }>(`/api/financial/actuals/${year}/${month}`, {
      method: 'PUT',
      body: data,
    }),

  getFiveWay: (year: number, quarter?: number) => {
    const qs = quarter ? `?quarter=${quarter}` : ''
    return api<{ success: boolean; data: any }>(`/api/financial/fiveway/${year}${qs}`)
  },
}

// Personal KPI API
export const personalKpiApi = {
  get: (params?: { year?: number; month?: number }) => {
    const query = new URLSearchParams()
    if (params?.year) query.set('year', String(params.year))
    if (params?.month) query.set('month', String(params.month))
    const qs = query.toString()
    return api<{ success: boolean; data: PersonalKPI[] }>(`/api/personal-kpi${qs ? `?${qs}` : ''}`)
  },

  update: (data: Partial<PersonalKPI>) =>
    api<{ success: boolean; data: PersonalKPI }>('/api/personal-kpi', { method: 'PUT', body: data }),

  calculate: (params: {
    income_target: number
    commission_rate: number
    conversion_rate: number
    avg_order_value: number
    working_days_per_month: number
  }) => {
    const query = new URLSearchParams({
      income_target: String(params.income_target),
      commission_rate: String(params.commission_rate),
      conversion_rate: String(params.conversion_rate),
      avg_order_value: String(params.avg_order_value),
      working_days_per_month: String(params.working_days_per_month),
    })
    return api<{
      success: boolean
      data: {
        income_target: number
        commission_rate: number
        conversion_rate: number
        avg_order_value: number
        working_days_per_month: number
        sales_target: number
        num_orders: number
        potential_customers_per_month: number
        potential_customers_per_day: number
      }
    }>(`/api/personal-kpi/calculate?${query.toString()}`)
  },
}

// Comments API
export const commentsApi = {
  getComments: (goalId: string) =>
    api<{ success: boolean; data: any[] }>(`/api/comments/goals/${goalId}/comments`),

  addComment: (goalId: string, content: string) =>
    api<{ success: boolean; data: any }>(`/api/comments/goals/${goalId}/comments`, {
      method: 'POST',
      body: { content },
    }),
}

// Reward Approvals API
export const rewardApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return api<{ success: boolean; data: RewardApproval[] }>(`/api/reward-approvals${qs}`)
  },

  request: (goalId: string, data: { reward_description?: string; reward_value?: number }) =>
    api<{ success: boolean; data: RewardApproval }>(`/api/reward-approvals/goals/${goalId}/request`, {
      method: 'POST',
      body: data,
    }),

  approve: (id: string) =>
    api<{ success: boolean; data: RewardApproval }>(`/api/reward-approvals/${id}/approve`, {
      method: 'PUT',
    }),

  reject: (id: string, reason: string) =>
    api<{ success: boolean; data: RewardApproval }>(`/api/reward-approvals/${id}/reject`, {
      method: 'PUT',
      body: { reason },
    }),
}

// Notifications API
export const notificationsApi = {
  list: (isRead?: boolean) => {
    const qs = isRead !== undefined ? `?is_read=${isRead}` : ''
    return api<{ success: boolean; data: Notification[] }>(`/api/notifications${qs}`)
  },

  getUnreadCount: () =>
    api<{ success: boolean; data: { count: number } }>('/api/notifications/count-unread'),

  markRead: (id: string) =>
    api<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: () =>
    api<{ success: boolean }>('/api/notifications/read-all', { method: 'PUT' }),
}

// Activity Feed API
export const activityApi = {
  list: (limit = 20, page = 1) =>
    api<{ success: boolean; data: { items: ActivityItem[]; total: number; page: number; pageSize: number } }>(
      `/api/activity-feed?limit=${limit}&page=${page}`
    ),
}

// Products API
export const productsApi = {
  list: (year?: number) => {
    const qs = year ? `?year=${year}` : ''
    return api<{ success: boolean; data: any[] }>(`/api/products${qs}`)
  },

  create: (data: any) =>
    api<{ success: boolean; data: any }>('/api/products', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    api<{ success: boolean; data: any }>(`/api/products/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    api<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),
}

// Reports API
export const reportsApi = {
  getQuarterly: (year: number, quarter: number) =>
    api<{ success: boolean; data: any }>(`/api/reports/quarterly?year=${year}&quarter=${quarter}`),

  getDepartment: (deptId: string, year: number, quarter?: number) => {
    const qs = new URLSearchParams({ year: String(year) })
    if (quarter) qs.set('quarter', String(quarter))
    return api<{ success: boolean; data: any }>(`/api/reports/department/${deptId}?${qs}`)
  },
}

export { ApiError }
export { api }
