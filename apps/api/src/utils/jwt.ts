import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'

const ALGORITHM = 'HS256'

interface TokenPayload {
  userId: string
  companyId: string
  role: 'admin' | 'manager' | 'staff' | 'finance'
  deviceId: string
  iat?: number
  exp?: number
}

interface RefreshPayload {
  userId: string
  deviceId: string
  type: 'refresh'
  iat: number
  exp: number
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10)
  const now = Math.floor(Date.now() / 1000)
  const secret = process.env.JWT_SECRET || 'default-secret'

  const tokenPayload = {
    userId: payload.userId,
    companyId: payload.companyId,
    role: payload.role,
    deviceId: payload.deviceId,
    iat: now,
    exp: now + expiresIn,
  }

  return await sign(tokenPayload, secret, ALGORITHM)
}

export async function generateRefreshToken(
  userId: string,
  deviceId: string
): Promise<string> {
  const expiresIn = parseInt(process.env.REFRESH_EXPIRES_IN || '2592000', 10)
  const now = Math.floor(Date.now() / 1000)
  const secret = process.env.JWT_SECRET || 'default-secret'

  const payload: RefreshPayload = {
    userId,
    deviceId,
    type: 'refresh',
    iat: now,
    exp: now + expiresIn,
  }

  return await sign(payload as unknown as TokenPayload, secret, ALGORITHM)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret'
    const payload = await verify(token, secret, ALGORITHM) as any
    return {
      userId: payload.userId,
      companyId: payload.companyId,
      role: payload.role,
      deviceId: payload.deviceId,
    }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 8 ký tự' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 1 chữ hoa' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 1 số' }
  }
  return { valid: true }
}