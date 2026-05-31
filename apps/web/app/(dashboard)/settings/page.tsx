'use client'

import { useState, useEffect } from 'react'
import { companyApi, usersApi, departmentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { User } from '@/lib/api'

export default function SettingsPage() {
  const { user } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [activeTab, setActiveTab] = useState('company')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [companyRes, usersRes, deptsRes] = await Promise.all([
        companyApi.get(),
        usersApi.list(),
        departmentsApi.list(),
      ])
      if (companyRes.success) setCompany(companyRes.data)
      if (usersRes.success) setUsers(usersRes.data)
      if (deptsRes.success) setDepartments(deptsRes.data)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    try {
      setIsSavingCompany(true)
      const res = await companyApi.update(company)
      if (res.success) {
        setCompany(res.data)
      }
    } catch (err) {
      console.error('Failed to save company:', err)
    } finally {
      setIsSavingCompany(false)
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cài Đặt</h1>
        <p className="text-slate-500 mt-1">Quản lý công ty, người dùng và phòng ban</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'company'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Công ty
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'departments'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          Phòng ban ({departments.length})
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Thông tin Công ty</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên công ty</label>
              <input
                type="text"
                className="input max-w-md"
                value={company?.name || ''}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mission</label>
              <textarea
                className="input min-h-[80px] max-w-lg"
                value={company?.mission || ''}
                onChange={(e) => setCompany({ ...company, mission: e.target.value })}
                placeholder="Sứ mệnh của công ty..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vision</label>
              <textarea
                className="input min-h-[80px] max-w-lg"
                value={company?.vision || ''}
                onChange={(e) => setCompany({ ...company, vision: e.target.value })}
                placeholder="Tầm nhìn của công ty..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Core Values</label>
              <textarea
                className="input min-h-[80px] max-w-lg"
                value={company?.core_values || ''}
                onChange={(e) => setCompany({ ...company, core_values: e.target.value })}
                placeholder="Giá trị cốt lõi..."
              />
            </div>
            <button
              onClick={handleSaveCompany}
              disabled={isSavingCompany}
              className="btn btn-primary btn-md"
            >
              {isSavingCompany ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Người dùng</h2>
            <button className="btn btn-primary btn-sm">Thêm người dùng</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tên</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vai trò</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-danger' :
                        u.role === 'manager' ? 'badge-info' :
                        u.role === 'staff' ? 'badge-neutral' : 'badge-warning'
                      }`}>
                        {u.role === 'admin' ? 'Admin' :
                         u.role === 'manager' ? 'Trưởng BP' :
                         u.role === 'staff' ? 'Nhân viên' : 'Kế toán'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {u.is_active ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Phòng ban</h2>
            <button className="btn btn-primary btn-sm">Thêm phòng ban</button>
          </div>
          <div className="card-body">
            {departments.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Chưa có phòng ban nào</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800">{d.name}</p>
                    {d.manager_name && (
                      <p className="text-sm text-slate-500 mt-1">Trưởng BP: {d.manager_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
