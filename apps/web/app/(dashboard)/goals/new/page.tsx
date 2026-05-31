'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { goalsApi, departmentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { CATEGORY_LABELS, getQuarterWeeks, getCurrentYear } from '@/lib/utils'

export default function NewGoalPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    year: getCurrentYear(),
    quarter: '',
    start_week: 1,
    end_week: 52,
    weight: 10,
    measure: '',
    target_value: '',
    unit: '',
    owner_dept_id: '',
    reward: '',
    reward_value: '',
    status: 'draft',
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const res = await departmentsApi.list()
      if (res.success) setDepartments(res.data)
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  const handleQuarterChange = (quarter: string) => {
    if (quarter) {
      const q = parseInt(quarter)
      const weeks = getQuarterWeeks(q)
      setFormData({
        ...formData,
        quarter,
        start_week: weeks.start,
        end_week: weeks.end,
      })
    } else {
      setFormData({
        ...formData,
        quarter: '',
        start_week: 1,
        end_week: 52,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await goalsApi.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        year: formData.year,
        quarter: formData.quarter ? parseInt(formData.quarter) : undefined,
        start_week: formData.start_week,
        end_week: formData.end_week,
        weight: formData.weight,
        measure: formData.measure || undefined,
        target_value: formData.target_value ? parseFloat(formData.target_value) : undefined,
        unit: formData.unit || undefined,
        owner_dept_id: formData.owner_dept_id || undefined,
        reward: formData.reward || undefined,
        reward_value: formData.reward_value ? parseFloat(formData.reward_value) : undefined,
        status: formData.status,
      })

      if (res.success) {
        router.push(`/goals/${res.data.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/goals" className="inline-flex items-center gap-2 text-slate-600 hover:text-primary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại
      </Link>

      <div className="card">
        <div className="card-header">
          <h1 className="text-xl font-bold text-slate-800">Tạo Mục tiêu Mới</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tên mục tiêu <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Tăng 20% doanh thu năm 2026"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
              <textarea
                className="input min-h-[80px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết mục tiêu..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trụ cột <span className="text-danger">*</span>
                </label>
                <select
                  className="select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Chọn trụ cột</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bộ phận phụ trách
                </label>
                <select
                  className="select"
                  value={formData.owner_dept_id}
                  onChange={(e) => setFormData({ ...formData, owner_dept_id: e.target.value })}
                >
                  <option value="">Chọn bộ phận</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
                <select
                  className="select"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                >
                  {[getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quý</label>
                <select
                  className="select"
                  value={formData.quarter}
                  onChange={(e) => handleQuarterChange(e.target.value)}
                >
                  <option value="">Cả năm</option>
                  <option value="1">Q1 (T1-T13)</option>
                  <option value="2">Q2 (T14-T26)</option>
                  <option value="3">Q3 (T27-T39)</option>
                  <option value="4">Q4 (T40-T52)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trọng số (%) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  min={1}
                  max={100}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tuần bắt đầu
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.start_week}
                  onChange={(e) => setFormData({ ...formData, start_week: parseInt(e.target.value) })}
                  min={1}
                  max={53}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tuần kết thúc
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.end_week}
                  onChange={(e) => setFormData({ ...formData, end_week: parseInt(e.target.value) })}
                  min={1}
                  max={53}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Measure (KPI)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.measure}
                  onChange={(e) => setFormData({ ...formData, measure: e.target.value })}
                  placeholder="VD: % doanh thu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị mục tiêu</label>
                <input
                  type="number"
                  className="input"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="VD: 1000000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                <input
                  type="text"
                  className="input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="VD: VNĐ, %, sản phẩm"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-medium text-slate-800 mb-4">Phần thưởng (tuỳ chọn)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả phần thưởng</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                    placeholder="VD: Thưởng trip team building"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị (VNĐ)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.reward_value}
                    onChange={(e) => setFormData({ ...formData, reward_value: e.target.value })}
                    placeholder="VD: 5000000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Link href="/goals" className="btn btn-secondary btn-md">
                Hủy
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.category}
                className="btn btn-primary btn-md"
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo Mục tiêu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
