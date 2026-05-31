import type { Env } from '../types';

const CRITICAL_EVENTS = [
  'reward_approved',
  'reward_rejected',
  'role_changed',
  'login_failed',
  'password_changed'
] as const;

type EntityType = 'goal' | 'tracking' | 'financial' | 'user' | 'security';
type AuditAction = string;

interface AuditParams {
  companyId: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  isCritical?: boolean;
}

export async function writeAuditLog(env: Env, params: AuditParams): Promise<void> {
  const payload = {
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    createdAt: new Date().toISOString(),
  };

  // Critical events: dual-write to D1 first (strongly consistent)
  if (params.isCritical || CRITICAL_EVENTS.includes(params.action as typeof CRITICAL_EVENTS[number])) {
    try {
      await env.DB.prepare(`
        INSERT INTO audit_critical (id, company_id, entity_type, entity_id, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        params.companyId,
        params.entityType,
        params.entityId,
        JSON.stringify(payload),
        Date.now()
      ).run();
    } catch (err) {
      console.error('Failed to write audit_critical:', err);
    }
  }

  // KV write async - non-blocking, TTL 365 days
  const key = `audit:${params.companyId}:${params.entityType}:${params.entityId}:${Date.now()}`;
  try {
    await env.AUDIT_KV.put(key, JSON.stringify(payload), { expirationTtl: 31536000 });
  } catch (err) {
    console.error('Failed to write audit KV:', err);
  }
}

export async function getAuditLogs(
  env: Env,
  companyId: string,
  entityType: string,
  entityId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const prefix = `audit:${companyId}:${entityType}:${entityId}:`;

  try {
    const list = await env.AUDIT_KV.list({ prefix, limit });
    const logs = await Promise.all(
      list.keys.map(async (k) => {
        const value = await env.AUDIT_KV.get(k.name);
        return value ? JSON.parse(value) : null;
      })
    );

    return logs
      .filter(Boolean)
      .sort((a, b) =>
        new Date((b as { createdAt: string }).createdAt).getTime() -
        new Date((a as { createdAt: string }).createdAt).getTime()
      );
  } catch (err) {
    console.error('Failed to get audit logs:', err);
    return [];
  }
}
