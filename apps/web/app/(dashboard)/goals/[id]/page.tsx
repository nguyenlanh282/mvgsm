'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { goalsApi, trackingApi, rewardApi, commentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STATUS_LABELS,
  TRACKING_STATUS_LABELS,
  formatPercent,
  getHealthColor,
  formatRelativeTime,
  getCurrentWeek,
  getCurrentYear,
  formatDateTime,
} from '@/lib/utils'
import type { Goal, WeeklyTracking } from '@/lib/api'

interface TrackingData {
  goal: Goal
  tracking: WeeklyTracking[]
  progress?: {
    actualProgress: number
    expectedProgress: number
    healthScore: number
    doneWeeks: number
    totalWeeks: number
    elapsedWeeks: number
  }
  currentWeek: number
  currentYear: number
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [trackingStatus, setTrackingStatus] = useState('')
  const [trackingNote, setTrackingNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    loadGoalData()
  }, [id])

  const loadGoalData = async () => {
    try {
      setIsLoading(true)
      const [trackingRes, commentsRes] = await Promise.all([
        trackingApi.get(id, getCurrentYear()),
        commentsApi.getComments(id),
      ])
      if (trackingRes.success) {
        setData(trackingRes.data)
        if (trackingRes.data.currentWeek >= trackingRes.data.goal.start_week &&
            trackingRes.data.currentWeek <= trackingRes.data.goal.end_week) {
          setSelectedWeek(trackingRes.data.currentWeek)
        }
      }
      if (commentsRes.success) {
        setComments(commentsRes.data)
      }
    } catch (err) {
      console.error('Failed to load goal:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTracking = async () => {
    if (!selectedWeek || !trackingStatus) return
    try {
      setIsUpdating(true)
      await trackingApi.update(id, selectedWeek, {
        year: data?.currentYear || getCurrentYear(),
        status: trackingStatus,
        note: trackingNote,
      })
      await loadGoalData()
      setSelectedWeek(null)
      setTrackingStatus('')
      setTrackingNote('')
    } catch (err) {
      console.error('Failed to update tracking:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      await commentsApi.addComment(id, newComment)
      setNewComment('')
      await loadGoalData()
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data?.goal) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy mục tiêu</p>
        <Link href="/goals" className="btn btn-primary mt-4">
          Quay lại
        </Link>
      </div>
    )
  }

  const { goal, tracking, progress, currentWeek, currentYear } = data
  const colors = CATEGORY_COLORS[goal.category] || { bg: 'bg-slate-50', text: 'text-slate-600' }
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  // Generate week array
  const weeks = []
  for (let w = goal.start_week; w <= goal.end_week; w++) {
    weeks.push(w)
  }

  // Get tracking for a week
  const getTrackingForWeek = (week: number) => {
    return tracking.find(t => t.week_number === week)
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/goals" className="inline-flex items-center gap-2 text-slate-600 hover:text-primary">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quay lại danh sách
      </Link>

      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                {CATEGORY_LABELS[goal.category]}
              </span>
              <h1 className="text-2xl font-bold text-slate-800 mt-2">{goal.title}</h1>
              {goal.description && (
                <p className="text-slate-600 mt-2">{goal.description}</p>
              )}
            </div>
            <span className={`badge ${
              goal.status === 'completed' ? 'badge-success' :
              goal.status === 'active' ? 'badge-info' :
              goal.status === 'draft' ? 'badge-neutral' : 'badge-warning'
            }`}>
              {STATUS_LABELS[goal.status] || goal.status}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Mục tiêu</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatPercent(data?.progress?.actualProgress ?? 0)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Thực tế</p>
            <p className="text-2xl font-bold text-primary">
              {formatPercent(data?.progress?.expectedProgress ?? 0)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Health Score</p>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                data?.progress?.healthScore ?? 0 >= 1 ? 'bg-success' :
                data?.progress?.healthScore ?? 0 >= 0.7 ? 'bg-warning' : 'bg-danger'
              }`} />
              <p className={`text-2xl font-bold ${getHealthColor(data?.progress?.healthScore ?? 0)}`}>
                {formatPercent(data?.progress?.healthScore ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-slate-500">Ngân sách</p>
            <p className="text-2xl font-bold text-slate-800">
              {goal.target_value ? `${goal.target_value}/${goal.current_value || 0}` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Tracking Grid */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Theo dõi Tuần</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-success" /> Hoàn thành
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-warning" /> Đang làm
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-danger" /> Chưa làm
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-13 md:grid-cols-13 lg:grid-cols-13 gap-1">
            {weeks.map((week) => {
              const track = getTrackingForWeek(week)
              const isCurrentWeek = week === currentWeek
              const isPast = week < goal.start_week || (week >= goal.start_week && week < currentWeek)
              const isClickable = canEdit && week >= goal.start_week && week <= goal.end_week

              return (
                <button
                  key={week}
                  onClick={() => {
                    if (isClickable) {
                      setSelectedWeek(week)
                      if (track) {
                        setTrackingStatus(track.status)
                        setTrackingNote(track.note || '')
                      } else {
                        setTrackingStatus('')
                        setTrackingNote('')
                      }
                    }
                  }}
                  disabled={!isClickable}
                  className={`
                    relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                    ${isCurrentWeek ? 'ring-2 ring-primary ring-offset-2' : ''}
                    ${track?.status === 'done' ? 'bg-success text-white' :
                      track?.status === 'in_progress' ? 'bg-warning text-white' :
                      track?.status === 'not_done' ? 'bg-danger text-white' :
                      isPast ? 'bg-slate-200 text-slate-500' : 'bg-slate-100 text-slate-400'}
                    ${isClickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {week}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Tuần hiện tại: {currentWeek} | Hiển thị {weeks.length} tuần (T{goal.start_week} - T{goal.end_week})
          </p>
        </div>
      </div>

      {/* Update Modal */}
      {selectedWeek !== null && (
        <div className="modal-overlay" onClick={() => setSelectedWeek(null)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">
                Cập nhật tuần {selectedWeek}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TRACKING_STATUS_LABELS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => setTrackingStatus(key)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors
                        ${trackingStatus === key
                          ? `border-${color} bg-${color}/10`
                          : 'border-slate-200 hover:border-slate-300'}
                      `}
                      style={{
                        borderColor: trackingStatus === key ? (key === 'done' ? '#22C55E' : key === 'in_progress' ? '#F59E0B' : '#EF4444') : undefined,
                        backgroundColor: trackingStatus === key
                          ? (key === 'done' ? '#dcfce7' : key === 'in_progress' ? '#fef3c7' : '#fee2e2')
                          : undefined,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  className="input min-h-[80px]"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedWeek(null)}
                className="btn btn-secondary btn-md"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateTracking}
                disabled={!trackingStatus || isUpdating}
                className="btn btn-primary btn-md"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-800">Bình luận ({comments.length})</h2>
        </div>
        <div className="card-body space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-slate-600">
                  {comment.author_name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{comment.author_name}</span>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                className="input flex-1"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="btn btn-primary btn-md"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
