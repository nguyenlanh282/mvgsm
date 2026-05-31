import { sign, verify, hash } from 'hono/jwt';
import type { Env } from '../types';
import type { JWTPayload } from '@mvgsm/shared';

const ALGORITHM = 'HS256';

export async function generateAccessToken(
  env: Env,
  payload: Omit<JWTPayload, 'exp' | 'iat'>
): Promise<string> {
  const expiresIn = parseInt(env.JWT_EXPIRES_IN || '28800', 10); // 8 hours default
  const now = Math.floor(Date.now() / 1000);

  const tokenPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  return await sign(tokenPayload, env.JWT_SECRET || 'default-secret', ALGORITHM);
}

export async function generateRefreshToken(
  env: Env,
  userId: string,
  deviceId: string
): Promise<string> {
  const expiresIn = parseInt(env.REFRESH_EXPIRES_IN || '2592000', 10); // 30 days
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    userId,
    deviceId,
    type: 'refresh',
    iat: now,
    exp: now + expiresIn,
  };

  return await sign(payload, env.JWT_SECRET || 'default-secret', ALGORITHM);
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, secret, ALGORITHM);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate password policy: min 8 chars, at least 1 uppercase, 1 number
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 8 ký tự' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 1 chữ hoa' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Mật khẩu cần ít nhất 1 số' };
  }
  return { valid: true };
}
