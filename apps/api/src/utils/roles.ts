import type { AuthContext } from '../index'

export function requireAdmin(c: any): boolean {
  return c.get('role') === 'admin'
}

export function requireAdminOrManager(c: any): boolean {
  const role = c.get('role')
  return role === 'admin' || role === 'manager'
}

export function requireNotFinance(c: any): boolean {
  return c.get('role') !== 'finance'
}

export function getCompanyId(c: any): string {
  return c.get('companyId') || ''
}

export function getUserId(c: any): string {
  return c.get('userId') || ''
}

export function getRole(c: any): string {
  return c.get('role') || ''
}