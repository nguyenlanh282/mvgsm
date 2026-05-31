'use client'

import { useState, useEffect } from 'react'
import { notificationsApi } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  content?: string
  is_read: number
  created_at: number
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      if (res.success) {
        setUnreadCount(res.data.count)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setUnreadCount(0)
      setNotifications([])
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Control Center</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fadeIn">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-primary hover:underline"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Không có thông báo mới
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 ${
                          !notif.is_read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                        {notif.content && (
                          <p className="text-sm text-slate-500 mt-1">{notif.content}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {formatRelativeTime(notif.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">A</span>
        </div>
      </div>
    </header>
  )
}
