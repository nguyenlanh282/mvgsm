'use client'

import { useState } from 'react'
import { reportsApi } from '@/lib/api'
import { getCurrentYear } from '@/lib/utils'

export default function ReportsPage() {
  const [year, setYear] = useState(getCurrentYear())
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = async () => {
    try {
      setIsLoading(true)
      const res = await reportsApi.getQuarterly(year, quarter)
      if (res.success) {
        setReportData(res.data)
      }
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!reportData) return

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text('BÁO CÁO QUÝ', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Q${quarter} - ${year}`, 105, 30, { align: 'center' })
    doc.text(reportData.company?.name || 'Công ty', 105, 40, { align: 'center' })

    // Mission/Vision
    if (reportData.company?.mission) {
      doc.setFontSize(14)
      doc.text('Mission:', 20, 55)
      doc.setFontSize(11)
      doc.text(reportData.company.mission, 20, 65)
    }

    // Summary stats
    doc.setFontSize(14)
    doc.text('Tổng quan:', 20, 85)
    doc.setFontSize(11)
    doc.text(`Tổng mục tiêu: ${reportData.goals?.length || 0}`, 20, 95)
    doc.text(`Số sản phẩm: ${reportData.products?.length || 0}`, 20, 105)

    // Goals by category
    doc.setFontSize(14)
    doc.text('Mục tiêu theo trụ cột:', 20, 125)
    const categories = ['tai_chinh', 'san_pham', 'khach_hang', 'thuong_hieu', 'he_thong', 'doi_ngu']
    let y = 135
    doc.setFontSize(10)
    categories.forEach((cat) => {
      const catGoals = reportData.goals?.filter((g: any) => g.category === cat) || []
      if (catGoals.length > 0) {
        doc.text(`${cat}: ${catGoals.length} mục tiêu`, 25, y)
        y += 8
      }
    })

    doc.save(`bao-cao-q${quarter}-${year}.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo Cáo</h1>
          <p className="text-slate-500 mt-1">Xuất báo cáo quý và báo cáo bộ phận</p>
        </div>
      </div>

      {/* Report Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quý</label>
              <select
                className="select w-32"
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
              >
                <option value={1}>Q1</option>
                <option value={2}>Q2</option>
                <option value={3}>Q3</option>
                <option value={4}>Q4</option>
              </select>
            </div>
            <button
              onClick={loadReport}
              disabled={isLoading}
              className="btn btn-primary btn-md"
            >
              {isLoading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
            {reportData && (
              <button
                onClick={handleExportPDF}
                className="btn btn-secondary btn-md"
              >
                Xuất PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">
              Báo cáo Q{quarter} - {year}
            </h2>
          </div>
          <div className="card-body space-y-6">
            {/* Mission/Vision */}
            {reportData.company?.mission && (
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Mission</h3>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                  {reportData.company.mission}
                </p>
              </div>
            )}

            {reportData.company?.vision && (
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Vision</h3>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-lg">
                  {reportData.company.vision}
                </p>
              </div>
            )}

            {/* Goals Summary */}
            <div>
              <h3 className="font-medium text-slate-800 mb-4">
                Tiến độ Mục tiêu ({reportData.goals?.length || 0} mục tiêu)
              </h3>
              <div className="space-y-4">
                {reportData.goals?.map((goal: any) => (
                  <div key={goal.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{goal.title}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-200 rounded">
                          {goal.category}
                        </span>
                      </div>
                      <span className="font-medium text-primary">
                        {goal.progress ? `${Math.round(goal.progress.actualProgress * 100)}%` : '-'}
                      </span>
                    </div>
                    {goal.progress && (
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill bg-primary"
                          style={{ width: `${goal.progress.actualProgress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            {reportData.financial?.actuals?.length > 0 && (
              <div>
                <h3 className="font-medium text-slate-800 mb-4">Tóm tắt Tài chính</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Tổng doanh thu</p>
                    <p className="text-xl font-bold text-slate-800">
                      {reportData.financial.actuals.reduce((sum: number, a: any) => sum + (a.revenue || 0), 0).toLocaleString()} VNĐ
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">Mục tiêu</p>
                    <p className="text-xl font-bold text-slate-800">
                      {reportData.financial.target?.revenue_target?.toLocaleString() || '-'} VNĐ
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">% Đạt</p>
                    <p className="text-xl font-bold text-primary">
                      {reportData.financial.target?.revenue_target
                        ? Math.round(
                            (reportData.financial.actuals.reduce((sum: number, a: any) => sum + (a.revenue || 0), 0) /
                              reportData.financial.target.revenue_target) *
                              100
                          )
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
