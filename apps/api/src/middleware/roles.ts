import { Context, MiddlewareHandler } from 'hono';
import type { Env } from '../types';
import type { UserRole } from '@mvgsm/shared';

type Role = UserRole | UserRole[];

// Middleware to check if user has required role(s)
export function requireRole(...allowedRoles: Role[]): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const userRole = c.get('userRole') as UserRole;

    const roles = allowedRoles;
    if (!roles.includes(userRole)) {
      return c.json({ success: false, error: 'Forbidden - Insufficient permissions' }, 403);
    }

    await next();
  };
}

// Middleware to check if user is NOT finance (finance has very limited access)
export function requireNotFinance(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const userRole = c.get('userRole') as UserRole;
    if (userRole === 'finance') {
      return c.json({ success: false, error: 'Forbidden - Finance role cannot access this resource' }, 403);
    }
    await next();
  };
}

// Middleware to check if user is admin or manager
export function requireAdminOrManager(): MiddlewareHandler<{ Bindings: Env }> {
  return requireRole('admin', 'manager');
}

// Middleware to check if user is admin only
export function requireAdmin(): MiddlewareHandler<{ Bindings: Env }> {
  return requireRole('admin');
}
