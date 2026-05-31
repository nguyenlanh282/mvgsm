import { Context, MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import type { Env, JWTPayload } from '../types';
import type { UserRole } from '@mvgsm/shared';

export const authMiddleware = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    try {
      const secret = c.env.JWT_SECRET || 'default-secret-change-me';
      const payload = await verify(token, secret) as JWTPayload;

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return c.json({ success: false, error: 'Token expired' }, 401);
      }

      // Attach user info to context
      c.set('userId', payload.userId);
      c.set('companyId', payload.companyId);
      c.set('userRole', payload.role);
      c.set('deviceId', payload.deviceId);

      await next();
    } catch (err) {
      console.error('Auth error:', err);
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
  };
};

// Helper to get current user from context
export function getUser(c: Context<{ Bindings: Env }>) {
  return {
    userId: c.get('userId') as string,
    companyId: c.get('companyId') as string,
    role: c.get('userRole') as UserRole,
    deviceId: c.get('deviceId') as string,
  };
}
