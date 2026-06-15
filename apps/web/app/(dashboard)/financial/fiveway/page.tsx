'use client'

import { useState, useEffect } from 'react'
import { financialApi } from '@/lib/api'
import { getCurrentYear, formatCurrency } from '@/lib/utils'

export default function FiveWayPage() {
  const [year, setYear] = useState(getCurrentYear())
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [year])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await financialApi.getFiveWay(year)
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load five-way data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const fw = data?.fiveWay || {}
  const summary = data?.summary || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Five-Way Analysis</h1>
          <p className="text-slate-500 mt-1">Phân tích 5 yếu tố ảnh hưởng doanh thu</p>
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
            <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalRevenue)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Mục tiêu năm</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(data?.target?.revenue_target || 0)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">So với năm trước</p>
            <p className={`text-2xl font-bold ${summary.revenueGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
              {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Tổng chi phí</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(summary.totalCost)}</p>
          </div>
        </div>
      </div>

      {/* Five-Way Formula */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-800">Công thức 5 yếu tố</h2>
        </div>
        <div className="card-body">
          <div className="bg-slate-50 p-4 rounded-lg mb-6 text-center">
            <p className="text-lg font-medium text-slate-700">
              Doanh thu = <span className="text-blue-700">KHTN</span> × <span className="text-green-700">Tỷ lệ CĐ</span> × <span className="text-purple-700">Số lần GD</span> × <span className="text-amber-700">DT TB đơn</span> × <span className="text-rose-700">Tỷ suất LN</span>
            </p>
          </div>

          {/* 5 Factors Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">KHTN (Khách hàng tiềm năng)</p>
              <p className="text-xl font-bold text-blue-700">{fw.khtn?.toLocaleString() || '-'}</p>
              <p className="text-xs text-slate-500 mt-1">Số khách cần tiếp cận</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Tỷ lệ chuyển đổi</p>
              <p className="text-xl font-bold text-green-700">{fw.conversionRate?.toFixed(1) || '-'}%</p>
              <p className="text-xs text-slate-500 mt-1">Tỷ lệ khách mua hàng</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Số lần giao dịch/KH</p>
              <p className="text-xl font-bold text-purple-700">{fw.transactionsPerCustomer || '-'}</p>
              <p className="text-xs text-slate-500 mt-1">Trung bình 1 khách mua</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Doanh thu TB/đơn</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(fw.avgOrderValue || 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Giá trị trung bình 1 đơn</p>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Tỷ suất lợi nhuận</p>
              <p className="text-xl font-bold text-rose-700">{fw.profitMargin?.toFixed(1) || '-'}%</p>
              <p className="text-xs text-slate-500 mt-1">Biên lợi nhuận</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {data?.suggestions && data.suggestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">💡 Gợi ý chiến lược</h2>
          </div>
          <div className="card-body">
            <ul className="space-y-2">
              {data.suggestions.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span className="text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {data?.actuals && data.actuals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Doanh thu theo tháng</h2>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-sm font-medium text-slate-600">Tháng</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-slate-600">Doanh thu</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-slate-600">Chi phí</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-slate-600">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {data.actuals.map((a: any) => (
                    <tr key={a.month} className="border-b border-slate-100">
                      <td className="px-4 py-2 text-slate-800">Tháng {a.month}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(a.revenue)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(a.cost)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(a.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
