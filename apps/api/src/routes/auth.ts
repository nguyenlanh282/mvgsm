import type { AuthContext } from '../index';
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { db, schema } from '../db'
import { eq, or, isNull, sql } from 'drizzle-orm'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt'
import { writeAuditLog } from '../utils/audit'

export const authRoutes = new Hono<AuthContext>()

// Helper to get user context from token
async function getAuthPayload(c: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ success: false, error: 'Email và mật khẩu là bắt buộc' }, 400)
    }

    // Find user by email
    const userResult = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    })

    if (!userResult || userResult.isActive === 0) {
      await writeAuditLog({
        companyId: 'unknown',
        entityType: 'security',
        entityId: email,
        action: 'login_failed',
        userId: 'unknown',
        userName: email,
        isCritical: true,
      })
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401)
    }

    // Verify password using bcrypt
    const passwordValid = await bcrypt.compare(password, userResult.passwordHash)
    if (!passwordValid) {
      await writeAuditLog({
        companyId: userResult.companyId || 'unknown',
        entityType: 'security',
        entityId: userResult.id,
        action: 'login_failed',
        userId: userResult.id,
        userName: userResult.name,
        isCritical: true,
      })
      return c.json({ success: false, error: 'Email hoặc mật khẩu không đúng' }, 401)
    }

    // Get device ID from header or generate
    const deviceId = c.req.header('X-Device-ID') || crypto.randomUUID()

    // Generate tokens
    const accessToken = await generateAccessToken({
      userId: userResult.id,
      companyId: userResult.companyId || '',
      role: userResult.role,
      deviceId,
    })

    const refreshToken = await generateRefreshToken(userResult.id, deviceId)

    // Store refresh token in database
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await db.insert(schema.refreshTokens).values({
      userId: userResult.id,
      tokenHash: refreshToken,
      deviceId,
      expiresAt: refreshExpires,
    })

    // Log successful login
    await writeAuditLog({
      companyId: userResult.companyId || 'unknown',
      entityType: 'security',
      entityId: userResult.id,
      action: 'login_success',
      userId: userResult.id,
      userName: userResult.name,
      isCritical: true,
    })

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
          companyId: userResult.companyId,
        },
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})

// Refresh token
authRoutes.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()

    if (!refreshToken) {
      return c.json({ success: false, error: 'Refresh token là bắt buộc' }, 400)
    }

    // Find refresh token in database
    const storedToken = await db.query.refreshTokens.findFirst({
      where: eq(schema.refreshTokens.tokenHash, refreshToken),
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return c.json({ success: false, error: 'Refresh token không hợp lệ hoặc đã hết hạn' }, 401)
    }

    // Get user info
    const userResult = await db.query.users.findFirst({
      where: sql`${schema.users.id} = ${storedToken.userId}`,
    })

    if (!userResult || userResult.isActive === 0) {
      return c.json({ success: false, error: 'Người dùng không tồn tại' }, 401)
    }

    // Generate new access token
    const accessToken = await generateAccessToken({
      userId: userResult.id,
      companyId: userResult.companyId || '',
      role: userResult.role,
      deviceId: storedToken.deviceId || '',
    })

    return c.json({
      success: true,
      data: {
        accessToken,
      },
    })
  } catch (err) {
    console.error('Refresh error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})

// Logout
authRoutes.post('/logout', async (c) => {
  try {
    const { refreshToken } = await c.req.json().catch(() => ({}))

    if (refreshToken) {
      // Delete refresh token from database
      await db.delete(schema.refreshTokens)
        .where(eq(schema.refreshTokens.tokenHash, refreshToken))
    }

    return c.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})

// Register
authRoutes.post('/register', async (c) => {
  try {
    const { email, password, name, companyName } = await c.req.json()

    if (!email || !password || !name) {
      return c.json({ success: false, error: 'Email, mật khẩu và tên là bắt buộc' }, 400)
    }

    // Validate password policy (min 8 chars)
    if (password.length < 8) {
      return c.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' }, 400)
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    })

    if (existing) {
      return c.json({ success: false, error: 'Email đã được sử dụng' }, 409)
    }

    // Create company first
    const now = new Date()
    const [company] = await db.insert(schema.companies).values({
      name: companyName || 'My Company',
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user (as admin)
    const [user] = await db.insert(schema.users).values({
      companyId: company.id,
      email,
      passwordHash,
      name,
      role: 'admin',
      createdAt: now,
    }).returning()

    // Generate tokens
    const deviceId = crypto.randomUUID()
    const accessToken = await generateAccessToken({
      userId: user.id,
      companyId: company.id,
      role: 'admin',
      deviceId,
    })
    const refreshToken = await generateRefreshToken(user.id, deviceId)

    // Store refresh token
    const refreshExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: refreshToken,
      deviceId,
      expiresAt: refreshExpires,
    })

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email,
          name,
          role: 'admin',
          companyId: company.id,
        },
      },
    }, 201)
  } catch (err) {
    console.error('Register error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})