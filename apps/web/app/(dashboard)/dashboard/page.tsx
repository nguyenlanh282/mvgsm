'use client'

import { useState, useEffect } from 'react'
import { dashboardApi, activityApi, rewardApi, notificationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatPercent,
  getHealthColor,
  formatRelativeTime,
  getCurrentYear,
  getCurrentWeek,
  formatCurrency,
} from '@/lib/utils'

interface GoalProgress {
  actualProgress: number
  expectedProgress: number
  healthScore: number
  doneWeeks: number
  totalWeeks: number
  elapsedWeeks: number
}

interface Goal {
  id: string
  title: string
  category: string
  progress?: GoalProgress
  weight?: number
  department_name?: string
  status?: string
}

interface ActivityItem {
  id: string
  actor_name: string
  action: string
  entity_title: string
  meta?: string
  created_at: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [pendingRewards, setPendingRewards] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const currentYear = getCurrentYear()
  const currentWeek = getCurrentWeek()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [trackingRes, activityRes, rewardsRes, notifRes] = await Promise.all([
        dashboardApi.getTracking({ year: currentYear }),
        activityApi.list(5),
        rewardApi.list('pending'),
        notificationsApi.getUnreadCount(),
      ])

      if (trackingRes.success) {
        setGoals(trackingRes.data.goals || [])
      }
      if (activityRes.success) {
        setActivities(activityRes.data.items || [])
      }
      if (rewardsRes.success) {
        setPendingRewards(rewardsRes.data || [])
      }
      if (notifRes.success) {
        setUnreadCount(notifRes.data.count)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate category stats
  const categoryStats = goals.reduce((acc, goal) => {
    if (!acc[goal.category]) {
      acc[goal.category] = { count: 0, totalProgress: 0 }
    }
    acc[goal.category].count++
    acc[goal.category].totalProgress += goal.progress?.actualProgress || 0
    return acc
  }, {} as Record<string, { count: number; totalProgress: number }>)

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      tracking_updated: 'cập nhật tiến độ',
      goal_created: 'tạo mục tiêu',
      goal_status_changed: 'thay đổi trạng thái',
      goal_completed: 'hoàn thành mục tiêu',
      reward_requested: 'yêu cầu thưởng',
      reward_approved: 'duyệt thưởng',
      reward_rejected: 'từ chối thưởng',
      comment_added: 'bình luận',
      financial_updated: 'cập nhật tài chính',
    }
    return labels[action] || action
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
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Chào mừng, {user?.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Trạng thái sức khoẻ doanh nghiệp - Tuần {currentWeek}, {currentYear}
        </p>
      </div>

      {/* Reward approval banner for admin */}
      {pendingRewards.length > 0 && user?.role === 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                Có {pendingRewards.length} yêu cầu phê duyệt phần thưởng
              </p>
              <p className="text-sm text-amber-600">
                Nhấn để xem chi tiết
              </p>
            </div>
          </div>
          <a href="/goals?filter=rewards" className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600">
            Xem ngay
          </a>
        </div>
      )}

      {/* 6 Pillars Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const stats = categoryStats[key]
          const progress = stats ? stats.totalProgress / stats.count : 0
          const colors = CATEGORY_COLORS[key]

          return (
            <div key={key} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {label}
                  </span>
                  <span className="text-sm text-slate-500">
                    {stats?.count || 0} mục tiêu
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-800">
                      {formatPercent(progress)}
                    </span>
                    <span className={`text-sm font-medium ${getHealthColor(progress)}`}>
                      {progress >= 1 ? 'Tốt' : progress >= 0.7 ? 'Khá' : 'Cần cải thiện'}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progress * 100}%`,
                        backgroundColor: progress >= 1 ? '#22C55E' : progress >= 0.7 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Hoạt động gần đây</h2>
          </div>
          <div className="card-body">
            {activities.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Chưa có hoạt động nào</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-600">
                        {activity.actor_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">
                        <span className="font-medium">{activity.actor_name}</span>{' '}
                        {getActionLabel(activity.action)}{' '}
                        <span className="font-medium">{activity.entity_title}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-800">Cảnh báo</h2>
          </div>
          <div className="card-body">
            {/* Goals at risk */}
            {goals
              .filter((g) => g.progress && g.progress.healthScore < 0.7)
              .slice(0, 5)
              .map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg mb-2"
                >
                  <div className="w-2 h-2 bg-danger rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {goal.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      Health: {formatPercent(goal.progress?.healthScore || 0)}
                    </p>
                  </div>
                </div>
              ))}
            {goals.filter((g) => g.progress && g.progress.healthScore < 0.7).length === 0 && (
              <p className="text-slate-500 text-center py-4">Không có cảnh báo</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
