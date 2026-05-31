import { Hono } from 'hono';
import { hashPassword, validatePasswordPolicy } from '../utils/jwt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { writeAuditLog } from '../utils/audit';
import type { Env } from '../types';
import type { User } from '@mvgsm/shared';

export const authRoutes = new Hono<{ Bindings: Env }>();

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email và mật khẩu là bắt buộc' }, 400);
    }

    // Find user by email
    const userResult = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first<User>();

    if (!userResult) {
      // Log failed login attempt
      await writeAuditLog(c.env, {
        companyId: 'unknown',
        entityType: 'security',
        entityId: email,
        action: 'login_failed',
        userId: 'unknown',
        userName: email,
        isCritical: true,
      });
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }

    // Verify password using bcrypt comparison
    // In production, use bcrypt.compare - for now using hash comparison as placeholder
    const passwordValid = await verifyPasswordHash(password, userResult.password_hash);
    if (!passwordValid) {
      await writeAuditLog(c.env, {
        companyId: userResult.company_id,
        entityType: 'security',
        entityId: userResult.id,
        action: 'login_failed',
        userId: userResult.id,
        userName: userResult.name,
        isCritical: true,
      });
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401);
    }

    // Get device ID from header or generate
    const deviceId = c.req.header('X-Device-ID') || crypto.randomUUID();

    // Generate tokens
    const accessToken = await generateAccessToken(c.env, {
      userId: userResult.id,
      companyId: userResult.company_id,
      role: userResult.role as 'admin' | 'manager' | 'staff' | 'finance',
      deviceId,
    });

    const refreshToken = await generateRefreshToken(c.env, userResult.id, deviceId);

    // Store refresh token in KV - key: rt:{userId}:{deviceId}
    const rtKey = `rt:${userResult.id}:${deviceId}`;
    await c.env.CACHE.put(rtKey, refreshToken, { expirationTtl: 2592000 }); // 30 days

    // Log successful login
    await writeAuditLog(c.env, {
      companyId: userResult.company_id,
      entityType: 'security',
      entityId: userResult.id,
      action: 'login_success',
      userId: userResult.id,
      userName: userResult.name,
      isCritical: true,
    });

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userResult.id,
          email: userResult.email,
          name: userResult.name,
          role: userResult.role,
          companyId: userResult.company_id,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Refresh token
authRoutes.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json({ success: false, error: 'Refresh token là bắt buộc' }, 400);
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken, c.env.JWT_SECRET || 'default-secret');
    if (!payload) {
      return c.json({ success: false, error: 'Refresh token không hợp lệ' }, 401);
    }

    // Check if refresh token exists in KV
    const rtKey = `rt:${payload.userId}:${payload.deviceId}`;
    const storedToken = await c.env.CACHE.get(rtKey);

    if (storedToken !== refreshToken) {
      return c.json({ success: false, error: 'Refresh token đã bị thu hồi' }, 401);
    }

    // Get user info
    const userResult = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND is_active = 1'
    ).bind(payload.userId).first<User>();

    if (!userResult) {
      return c.json({ success: false, error: 'Người dùng không tồn tại' }, 401);
    }

    // Generate new access token
    const accessToken = await generateAccessToken(c.env, {
      userId: userResult.id,
      companyId: userResult.company_id,
      role: userResult.role as 'admin' | 'manager' | 'staff' | 'finance',
      deviceId: payload.deviceId,
    });

    return c.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Logout
authRoutes.post('/logout', async (c) => {
  try {
    const { userId, deviceId } = await c.req.json().catch(() => ({}));

    if (userId && deviceId) {
      const rtKey = `rt:${userId}:${deviceId}`;
      await c.env.CACHE.delete(rtKey);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Register (admin only in production, open for demo)
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, name, companyName } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Email, mật khẩu và tên là bắt buộc' }, 400);
    }

    // Validate password policy [C33]
    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      return c.json({ success: false, error: passwordCheck.error }, 400);
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ success: false, error: 'Email đã được sử dụng' }, 409);
    }

    // Create company first
    const companyId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO companies (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(companyId, companyName || 'My Company', now, now).run();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user (as admin)
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO users (id, company_id, email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).bind(userId, companyId, email, passwordHash, name, now).run();

    // Generate tokens
    const deviceId = crypto.randomUUID();
    const accessToken = await generateAccessToken(c.env, {
      userId,
      companyId,
      role: 'admin',
      deviceId,
    });
    const refreshToken = await generateRefreshToken(c.env, userId, deviceId);

    // Store refresh token
    const rtKey = `rt:${userId}:${deviceId}`;
    await c.env.CACHE.put(rtKey, refreshToken, { expirationTtl: 2592000 });

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          name,
          role: 'admin',
          companyId,
        },
      },
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Password hash verification using SHA-256 (matching registration)
async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashedPassword === hash;
}
