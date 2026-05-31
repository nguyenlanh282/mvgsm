'use client'

import { useState, useEffect } from 'react'
import { personalKpiApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { formatCurrency } from '@/lib/utils'

interface KPIResult {
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

export default function PersonalKPIPage() {
  const { user } = useAuth()
  const [kpi, setKpi] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<KPIResult | null>(null)
  const [formData, setFormData] = useState({
    income_target: 0,
    commission_rate: 10,
    conversion_rate: 10,
    avg_order_value: 0,
    working_days_per_month: 26,
  })

  useEffect(() => {
    loadKPI()
  }, [])

  const loadKPI = async () => {
    try {
      setIsLoading(true)
      const res = await personalKpiApi.get()
      if (res.success && res.data.length > 0) {
        const latestKpi = res.data[0]
        setKpi(latestKpi)
        setFormData({
          income_target: latestKpi.income_target || 0,
          commission_rate: latestKpi.commission_rate || 10,
          conversion_rate: latestKpi.conversion_rate || 10,
          avg_order_value: latestKpi.avg_order_value || 0,
          working_days_per_month: latestKpi.working_days_per_month || 26,
        })
      }
      calculateKPI()
    } catch (err) {
      console.error('Failed to load KPI:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateKPI = async () => {
    if (formData.income_target <= 0) {
      setResult(null)
      return
    }

    try {
      const res = await personalKpiApi.calculate(formData)
      if (res.success) {
        setResult(res.data)
      }
    } catch (err) {
      console.error('Failed to calculate KPI:', err)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateKPI()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const res = await personalKpiApi.update({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        ...formData,
      })
      if (res.success) {
        setKpi(res.data)
      }
    } catch (err) {
      console.error('Failed to save KPI:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">KPI Cá Nhân</h1>
        <p className="text-slate-500 mt-1">
          Công cụ tính toán KPI cho nhân viên Sale
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Thông số đầu vào</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mục tiêu thu nhập (VNĐ)
              </label>
              <input
                type="number"
                className="input"
                value={formData.income_target || ''}
                onChange={(e) => setFormData({ ...formData, income_target: parseFloat(e.target.value) || 0 })}
                placeholder="VD: 30000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tỷ lệ hoa hồng (%)
              </label>
              <input
                type="number"
                className="input"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tỷ lệ chuyển đổi (%)
              </label>
              <input
                type="number"
                className="input"
                value={formData.conversion_rate}
                onChange={(e) => setFormData({ ...formData, conversion_rate: parseFloat(e.target.value) || 0 })}
                min={0}
                max={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giá trị đơn hàng TB (VNĐ)
              </label>
              <input
                type="number"
                className="input"
                value={formData.avg_order_value || ''}
                onChange={(e) => setFormData({ ...formData, avg_order_value: parseFloat(e.target.value) || 0 })}
                placeholder="VD: 500000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Số ngày làm việc/tháng (20-31)
              </label>
              <input
                type="number"
                className="input"
                value={formData.working_days_per_month}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 26
                  if (days >= 20 && days <= 31) {
                    setFormData({ ...formData, working_days_per_month: days })
                  }
                }}
                min={20}
                max={31}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary btn-md w-full"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Kết quả tính toán</h2>
          </div>
          <div className="card-body space-y-4">
            {result ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Doanh số MT</p>
                    <p className="text-xl font-bold text-blue-700">
                      {formatCurrency(result.sales_target)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Số đơn hàng</p>
                    <p className="text-xl font-bold text-purple-700">
                      {result.num_orders.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">KH tiềm năng/tháng</p>
                    <p className="text-xl font-bold text-green-700">
                      {result.potential_customers_per_month.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-600">KH tiềm năng/ngày</p>
                    <p className="text-xl font-bold text-amber-700">
                      {result.potential_customers_per_day.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Giả định:</p>
                  <p className="text-xs text-slate-500">
                    Tính trên {result.working_days_per_month} ngày làm việc/tháng
                  </p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <p className="text-sm text-primary font-medium">Hành động cụ thể hôm nay</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {result.potential_customers_per_day} KH cần tiếp cận
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Nhập mục tiêu thu nhập để xem kết quả
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
