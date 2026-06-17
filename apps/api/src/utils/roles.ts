import type { AuthContext } from '../index'
import type { MiddlewareHandler } from 'hono'

export function requireAdmin(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    if (c.get('role') !== 'admin') {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
  };
}

export function requireAdminOrManager(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    const role = c.get('role');
    if (role !== 'admin' && role !== 'manager') {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    await next();
  };
}

export function requireNotFinance(): MiddlewareHandler<AuthContext> {
  return async (c, next) => {
    if (c.get('role') === 'finance') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await next();
  };
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

export function getUser(c: any): { companyId: string; userId: string; role: string } {
  return {
    companyId: c.get('companyId') || '',
    userId: c.get('userId') || '',
    role: c.get('role') || '',
  }
}