'use client'

import { useState, useEffect } from 'react'
import { financialApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { getCurrentYear, formatCurrency } from '@/lib/utils'

export default function FinancialPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(getCurrentYear())
  const [target, setTarget] = useState<any>(null)
  const [actuals, setActuals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [editData, setEditData] = useState({ revenue: '' })
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'finance'

  useEffect(() => {
    loadFinancialData()
  }, [year])

  const loadFinancialData = async () => {
    try {
      setIsLoading(true)
      const [targetRes, actualsRes] = await Promise.all([
        financialApi.getTargets(year),
        financialApi.getActuals(year),
      ])
      if (targetRes.success) setTarget(targetRes.data)
      if (actualsRes.success) {
        setActuals(actualsRes.data.actuals || [])
      }
    } catch (err) {
      console.error('Failed to load financial data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTarget = async () => {
    try {
      const res = await financialApi.updateTargets(year, {
        revenue_target: target?.revenue_target || 0,
        cost_ratio_target: target?.cost_ratio_target || 0,
        profit_ratio_target: target?.profit_ratio_target || 0,
      })
      if (res.success) {
        setTarget(res.data)
        setIsEditing(false)
      }
    } catch (err) {
      console.error('Failed to update target:', err)
    }
  }

  const handleUpdateActual = async (month: number) => {
    try {
      const res = await financialApi.updateActual(year, month, {
        revenue: editData.revenue ? parseFloat(editData.revenue) : undefined,
      })
      if (res.success) {
        await loadFinancialData()
        setEditingMonth(null)
        setEditData({ revenue: '' })
      }
    } catch (err) {
      console.error('Failed to update actual:', err)
    }
  }

  const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

  const totalRevenue = actuals.reduce((sum, a) => sum + (a.revenue || 0), 0)
  const targetRevenue = target?.revenue_target || 0
  const percentAchieved = targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0
  const monthsRemaining = 12 - actuals.filter(a => a.revenue !== null).length
  const remainingTarget = targetRevenue - totalRevenue
  const monthlyAvgNeeded = monthsRemaining > 0 ? remainingTarget / monthsRemaining : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tài Chính</h1>
          <p className="text-slate-500 mt-1">Năm {year}</p>
        </div>
        <select
          className="select w-32"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Doanh thu thực tế</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Mục tiêu năm</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(targetRevenue)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">% Đạt</p>
            <p className={`text-2xl font-bold ${percentAchieved >= 100 ? 'text-success' : percentAchieved >= 70 ? 'text-warning' : 'text-danger'}`}>
              {percentAchieved.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">DT TB cần đạt/tháng</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(monthlyAvgNeeded)}</p>
          </div>
        </div>
      </div>

      {/* Target Setup */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Mục tiêu Tài chính Năm {year}</h2>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-sm btn-secondary"
            >
              Chỉnh sửa
            </button>
          )}
        </div>
        <div className="card-body">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Doanh thu mục tiêu (VNĐ)
                </label>
                <input
                  type="number"
                  className="input max-w-xs"
                  value={target?.revenue_target || ''}
                  onChange={(e) => setTarget({ ...target, revenue_target: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateTarget} className="btn btn-primary btn-md">
                  Lưu
                </button>
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-md">
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Doanh thu mục tiêu</p>
                <p className="text-lg font-semibold text-slate-800">
                  {formatCurrency(target?.revenue_target || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">% Chi phí mục tiêu</p>
                <p className="text-lg font-semibold text-slate-800">
                  {target?.cost_ratio_target || 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">% Lợi nhuận mục tiêu</p>
                <p className="text-lg font-semibold text-slate-800">
                  {target?.profit_ratio_target || 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Actuals */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-800">Doanh thu Thực tế theo Tháng</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {months.map((month, index) => {
              const monthNum = index + 1
              const actual = actuals.find(a => a.month === monthNum)
              const isEditingThis = editingMonth === monthNum

              return (
                <div key={month} className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">{month}</p>
                  {isEditingThis ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        className="input text-sm"
                        value={editData.revenue}
                        onChange={(e) => setEditData({ revenue: e.target.value })}
                        placeholder="Nhập DT"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateActual(monthNum)}
                          className="btn btn-sm btn-primary"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => {
                            setEditingMonth(null)
                            setEditData({ revenue: '' })
                          }}
                          className="btn btn-sm btn-secondary"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-lg font-bold text-slate-800">
                        {actual?.revenue ? formatCurrency(actual.revenue) : '-'}
                      </p>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingMonth(monthNum)
                            setEditData({ revenue: actual?.revenue?.toString() || '' })
                          }}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Cập nhật
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
