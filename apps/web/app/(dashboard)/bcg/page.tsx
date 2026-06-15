'use client'

import { useState, useEffect } from 'react'
import { productsApi } from '@/lib/api'
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
  dog: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Con chó' },
  question: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Chấm hỏi' },
}

export default function BCGPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    revenue: '',
    growth_rate: '',
    profit_margin: '',
  })
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const res = await productsApi.list(getCurrentYear())
      if (res.success) {
        setProducts(res.data)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        revenue: product.revenue?.toString() || '',
        growth_rate: product.growth_rate?.toString() || '',
        profit_margin: product.profit_margin?.toString() || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({ name: '', revenue: '', growth_rate: '', profit_margin: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({ name: '', revenue: '', growth_rate: '', profit_margin: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = {
        name: formData.name,
        year: getCurrentYear(),
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
        growth_rate: formData.growth_rate ? parseFloat(formData.growth_rate) : undefined,
        profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) : undefined,
      }

      if (editingProduct) {
        await productsApi.update(editingProduct.id, data)
      } else {
        await productsApi.create(data)
      }

      await loadProducts()
      handleCloseModal()
    } catch (err) {
      console.error('Failed to save product:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return
    try {
      await productsApi.delete(product.id)
      await loadProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
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
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên sản phẩm <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Sản phẩm A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Doanh thu (VNĐ)
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                  placeholder="VD: 1000000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tăng trưởng (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.growth_rate}
                  onChange={(e) => setFormData({ ...formData, growth_rate: e.target.value })}
                  placeholder="VD: 15"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Biên lợi nhuận (%)
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                  placeholder="VD: 25"
                  step="0.1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary btn-md">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting || !formData.name} className="btn btn-primary btn-md">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ma trận BCG</h1>
          <p className="text-slate-500 mt-1">Phân loại sản phẩm theo doanh thu và tăng trưởng</p>
        </div>
        {canEdit && (
          <button onClick={() => handleOpenModal()} className="btn btn-primary btn-md">
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
              Tăng trưởng thị phần
            </div>

            {/* X-axis label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600">
              Thị phần tương đối
            </div>

            {/* Quadrant labels */}
            <div className="absolute top-4 left-4 text-xs text-slate-400">Cao</div>
            <div className="absolute bottom-4 left-4 text-xs text-slate-400">Thấp</div>
            <div className="absolute top-4 right-4 text-xs text-slate-400">Cao</div>
            <div className="absolute bottom-4 right-4 text-xs text-slate-400">Thấp</div>

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
                title={`${product.name}\nDoanh thu: ${formatCurrency(product.revenue)}\nTăng trưởng: ${product.growth_rate}%\nBiên LN: ${product.profit_margin}%`}
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
                {canEdit && <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.
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
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="text-xs text-primary hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-xs text-danger hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    )}
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
