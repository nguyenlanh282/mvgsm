import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format currency in VND
export function formatCurrency(amount: number): string {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(1)}B`
  }
  if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(1)}M`
  }
  if (amount >= 1e3) {
    return `${(amount / 1e3).toFixed(0)}K`
  }
  return amount.toFixed(0)
}

// Format date
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Format date time
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  return formatDate(timestamp)
}

// Get ISO week number
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// Get current week
export function getCurrentWeek(): number {
  return getISOWeek(new Date())
}

// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  tai_chinh: 'Tài Chính',
  san_pham: 'Sản Phẩm',
  khach_hang: 'Khách Hàng',
  thuong_hieu: 'Thương Hiệu',
  he_thong: 'Hệ Thống',
  doi_ngu: 'Đội Ngũ',
}

// Category colors
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  tai_chinh: { bg: 'bg-blue-50', text: 'text-blue-600' },
  san_pham: { bg: 'bg-purple-50', text: 'text-purple-600' },
  khach_hang: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  thuong_hieu: { bg: 'bg-pink-50', text: 'text-pink-600' },
  he_thong: { bg: 'bg-orange-50', text: 'text-orange-600' },
  doi_ngu: { bg: 'bg-green-50', text: 'text-green-600' },
}

// Status labels
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  active: 'Đang hoạt động',
  completed: 'Hoàn thành',
  archived: 'Đã lưu trữ',
  cancelled: 'Đã hủy',
}

// Tracking status labels
export const TRACKING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  done: { label: 'Hoàn thành', color: 'bg-success' },
  in_progress: { label: 'Đang làm', color: 'bg-warning' },
  not_done: { label: 'Chưa làm', color: 'bg-danger' },
}

// Health score colors
export function getHealthColor(score: number): string {
  if (score >= 1) return 'text-success'
  if (score >= 0.7) return 'text-warning'
  return 'text-danger'
}

// Progress percentage formatting
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

// Get quarter from month
export function getQuarter(month: number): number {
  return Math.ceil(month / 3)
}

// Get quarter weeks
export function getQuarterWeeks(quarter: number): { start: number; end: number } {
  switch (quarter) {
    case 1: return { start: 1, end: 13 }
    case 2: return { start: 14, end: 26 }
    case 3: return { start: 27, end: 39 }
    case 4: return { start: 40, end: 52 }
    default: return { start: 1, end: 52 }
  }
}
