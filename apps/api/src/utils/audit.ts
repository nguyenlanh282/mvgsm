import { db, schema } from '../db'
import { eq, desc } from 'drizzle-orm'

const CRITICAL_EVENTS = [
  'reward_approved',
  'reward_rejected',
  'role_changed',
  'login_failed',
  'password_changed',
  'login_success',
] as const

type EntityType = 'goal' | 'tracking' | 'financial' | 'user' | 'security'

interface AuditParams {
  companyId: string
  entityType: EntityType
  entityId: string
  action: string
  userId: string
  userName: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  isCritical?: boolean
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  const payload = {
    action: params.action,
    userId: params.userId,
    userName: params.userName,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    createdAt: new Date().toISOString(),
  }

  try {
    await db.insert(schema.auditCritical).values({
      companyId: params.companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('Failed to write audit log:', err)
  }
}

export async function getAuditLogs(
  companyId: string,
  entityType?: string,
  entityId?: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  try {
    let query = db.select().from(schema.auditCritical)

    // Build where conditions
    let results = await query
      .where(eq(schema.auditCritical.companyId, companyId))
      .orderBy(desc(schema.auditCritical.createdAt))
      .limit(limit)

    if (entityType) {
      results = results.filter(r => r.entityType === entityType)
    }
    if (entityId) {
      results = results.filter(r => r.entityId === entityId)
    }

    return results.map(r => ({
      ...JSON.parse(r.payload),
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt,
    }))
  } catch (err) {
    console.error('Failed to get audit logs:', err)
    return []
  }
}