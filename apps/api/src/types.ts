import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  AUDIT_KV: KVNamespace;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  APP_ENV: string;
  JWT_EXPIRES_IN: string;
  REFRESH_EXPIRES_IN: string;
}

export interface JWTPayload {
  userId: string;
  companyId: string;
  role: 'admin' | 'manager' | 'staff' | 'finance';
  deviceId: string;
  exp: number;
  iat: number;
}

export interface CachedUser {
  id: string;
  company_id: string;
  email: string;
  name: string;
  role: string;
  department_id?: string;
}
