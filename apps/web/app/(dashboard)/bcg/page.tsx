'use client'

import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { getCurrentYear, formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  revenue: number
  profit_margin: number
  growth_rate: number
  bcg_category: 'star' | 'cow' | 'question' | 'dog'
}

const BCG_COLORS = {
  star: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Ngôi sao' },
  cow: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Bò sữa' },
  question: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Chấm hỏi' },
  dog: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Con chó' },
}

export default function BCGPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const res = await dashboardApi.getTracking({ year: getCurrentYear() })
      if (res.success) {
        // For now, products are shown from goals or separate API
        // This is a placeholder - in production would have separate products API
        setProducts([])
      }
    } catch (err) {
      console.error('Failed to load products:', err)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ma trận BCG</h1>
          <p className="text-slate-500 mt-1">Phân loại sản phẩm theo doanh thu và tăng trưởng</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary btn-md">
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* BCG Matrix Visual */}
      <div className="card">
        <div className="card-body">
          <div className="relative h-96 bg-slate-50 rounded-xl">
            {/* Y-axis label */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full -rotate-90 text-sm font-medium text-slate-600">
              Tăng trưởng thị trường
            </div>

            {/* X-axis label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600">
              Thị phần tương đối
            </div>

            {/* Quadrant labels */}
            <div className="absolute top-4 left-4 text-xs text-slate-500">Cao</div>
            <div className="absolute bottom-4 left-4 text-xs text-slate-500">Thấp</div>
            <div className="absolute top-4 right-4 text-xs text-slate-500">Cao</div>
            <div className="absolute bottom-4 right-4 text-xs text-slate-500">Thấp</div>

            {/* Dividers */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300" />

            {/* Products as dots */}
            {products.map((product) => (
              <div
                key={product.id}
                className={`absolute w-12 h-12 rounded-full ${BCG_COLORS[product.bcg_category]?.bg || 'bg-slate-100'} border-2 ${BCG_COLORS[product.bcg_category]?.border || 'border-slate-300'} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                style={{
                  left: `${Math.min(90, Math.max(10, (product.revenue || 0) / 10000000))}%`,
                  top: `${Math.min(90, Math.max(10, 100 - (product.growth_rate || 0)))}%`,
                }}
                title={product.name}
              >
                <span className="text-xs font-medium truncate px-1">
                  {product.name.substring(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(BCG_COLORS).map(([key, { bg, text, label }]) => (
          <div key={key} className={`p-4 rounded-lg ${bg}`}>
            <div className={`font-medium ${text}`}>{label}</div>
            <div className="text-xs text-slate-600 mt-1">
              {key === 'star' && 'Tăng trưởng cao, thị phần lớn'}
              {key === 'cow' && 'Tăng trưởng thấp, thị phần lớn'}
              {key === 'question' && 'Tăng trưởng cao, thị phần nhỏ'}
              {key === 'dog' && 'Tăng trưởng thấp, thị phần nhỏ'}
            </div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-800">Danh sách Sản phẩm</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Doanh thu</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tăng trưởng</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Biên lợi nhuận</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Phân loại BCG</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Chưa có sản phẩm nào. Liên hệ admin để thêm sản phẩm.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(product.revenue)}</td>
                    <td className="px-4 py-3 text-slate-600">{product.growth_rate}%</td>
                    <td className="px-4 py-3 text-slate-600">{product.profit_margin}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${BCG_COLORS[product.bcg_category]?.bg || 'bg-slate-100'} ${BCG_COLORS[product.bcg_category]?.text || 'text-slate-600'}`}>
                        {BCG_COLORS[product.bcg_category]?.label || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
