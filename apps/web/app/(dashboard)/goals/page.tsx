'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { goalsApi, departmentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  formatPercent,
  getHealthColor,
  getCurrentYear,
} from '@/lib/utils'
import type { Goal } from '@/lib/api'

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    year: getCurrentYear(),
    category: '',
    dept: '',
    status: '',
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [goalsRes, deptsRes] = await Promise.all([
        goalsApi.list({ year: filters.year, category: filters.category, dept: filters.dept, status: filters.status }),
        departmentsApi.list(),
      ])
      if (goalsRes.success) setGoals(goalsRes.data)
      if (deptsRes.success) setDepartments(deptsRes.data)
    } catch (err) {
      console.error('Failed to load goals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const canManageGoals = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Mục tiêu</h1>
          <p className="text-slate-500 mt-1">
            {goals.length} mục tiêu | Năm {filters.year}
          </p>
        </div>
        {canManageGoals && (
          <Link href="/goals/new" className="btn-primary btn-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm Mục tiêu
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
            <select
              className="select w-32"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
            >
              {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trụ cột</label>
            <select
              className="select w-40"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Tất cả</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bộ phận</label>
            <select
              className="select w-40"
              value={filters.dept}
              onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
            >
              <option value="">Tất cả</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
            <select
              className="select w-40"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Goals Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Mục tiêu & Trụ cột
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Thời gian
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Thực tế / Kỳ vọng
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Health
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Bộ phận
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const colors = CATEGORY_COLORS[goal.category] || { bg: 'bg-slate-50', text: 'text-slate-600' }
                const progress = goal.progress
                const healthScore = progress?.healthScore || 0

                return (
                  <tr
                    key={goal.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {CATEGORY_LABELS[goal.category]}
                        </span>
                        <Link
                          href={`/goals/${goal.id}`}
                          className="font-medium text-slate-800 hover:text-primary"
                        >
                          {goal.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {goal.quarter ? `Q${goal.quarter}` : 'Cả năm'}
                      <br />
                      <span className="text-xs text-slate-400">
                        T{goal.start_week} - T{goal.end_week}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 progress-bar">
                          <div
                            className="progress-bar-fill bg-primary"
                            style={{ width: `${(progress?.actualProgress || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {formatPercent(progress?.actualProgress || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          healthScore >= 1 ? 'bg-success' :
                          healthScore >= 0.7 ? 'bg-warning' : 'bg-danger'
                        }`} />
                        <span className={`text-sm font-medium ${getHealthColor(healthScore)}`}>
                          {formatPercent(healthScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {goal.department_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        goal.status === 'completed' ? 'badge-success' :
                        goal.status === 'active' ? 'badge-info' :
                        goal.status === 'draft' ? 'badge-neutral' : 'badge-warning'
                      }`}>
                        {STATUS_LABELS[goal.status] || goal.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {goals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Chưa có mục tiêu nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
