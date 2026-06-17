import type { AuthContext } from '../index'
import { Hono } from 'hono'
import { getUser } from '../utils/roles'
import { requireAdminOrManager, requireNotFinance } from '../utils/roles'
import { writeAuditLog } from '../utils/audit'
import { calculateGoalProgress, getCurrentWeek, getCurrentYear } from '../utils/progress'
import { db, schema } from '../db'
import { eq, and, desc } from 'drizzle-orm'

export const trackingRoutes = new Hono<AuthContext>()

// Get tracking data for a goal
trackingRoutes.get('/goals/:id', async (c) => {
  try {
    const { companyId, role } = getUser(c)
    const goalId = c.req.param('id')
    const { year } = c.req.query()

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403)
    }

    const currentYear = year ? parseInt(year) : getCurrentYear()

    // Get goal info
    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    })

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404)
    }

    // Get tracking data
    const tracking = await db.query.weeklyTracking.findMany({
      where: and(
        eq(schema.weeklyTracking.goalId, goalId),
        eq(schema.weeklyTracking.year, currentYear)
      ),
      orderBy: desc(schema.weeklyTracking.weekNumber),
    })

    // Calculate progress
    const progress = calculateGoalProgress(
      goal.startWeek || 1,
      goal.endWeek || 52,
      tracking.map(t => ({
        week_number: t.weekNumber,
        status: t.status,
      })) as any[],
      getCurrentWeek(),
      currentYear
    )

    return c.json({
      success: true,
      data: {
        goal,
        tracking,
        progress,
        currentWeek: getCurrentWeek(),
        currentYear,
      },
    })
  } catch (err) {
    console.error('Get tracking error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})

// Update weekly tracking
trackingRoutes.put('/goals/:id/week/:week', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c)
    const goalId = c.req.param('id')
    const week = parseInt(c.req.param('week'))
    const { year, status, note } = await c.req.json()

    // Verify goal belongs to company
    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    })

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404)
    }

    // Validate week is within goal range
    if (week < (goal.startWeek || 1) || week > (goal.endWeek || 52)) {
      return c.json({ success: false, error: `Tuần phải từ ${goal.startWeek} đến ${goal.endWeek}` }, 400)
    }

    // Validate status
    if (!['done', 'in_progress', 'not_done'].includes(status)) {
      return c.json({ success: false, error: 'Trạng thái không hợp lệ' }, 400)
    }

    // Get existing tracking
    const existing = await db.query.weeklyTracking.findFirst({
      where: and(
        eq(schema.weeklyTracking.goalId, goalId),
        eq(schema.weeklyTracking.weekNumber, week),
        eq(schema.weeklyTracking.year, year)
      ),
    })

    const oldStatus = existing?.status
    const now = new Date()

    if (existing) {
      // Update existing
      await db.update(schema.weeklyTracking)
        .set({ status: status as any, note, updatedBy: userId, updatedAt: now })
        .where(eq(schema.weeklyTracking.id, existing.id))
    } else {
      // Insert new
      await db.insert(schema.weeklyTracking).values({
        goalId,
        weekNumber: week,
        year,
        status: status as any,
        note,
        updatedBy: userId,
        updatedAt: now,
      })
    }

    // Write audit log
    await writeAuditLog({
      companyId,
      entityType: 'tracking',
      entityId: `${goalId}:${week}:${year}`,
      action: 'tracking_updated',
      userId,
      userName: userId,
      oldValue: oldStatus ? { status: oldStatus } : undefined,
      newValue: { status, note, week, year },
    })

    // Add to activity feed
    await db.insert(schema.activityFeed).values({
      companyId,
      actorId: userId,
      actorName: userId,
      action: 'tracking_updated',
      entityType: 'goal',
      entityId: goalId,
      entityTitle: goal.title || 'Goal',
      meta: { week, year, status },
    })

    return c.json({ success: true })
  } catch (err) {
    console.error('Update tracking error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})

// Get dashboard tracking summary
trackingRoutes.get('/dashboard', async (c) => {
  try {
    const { companyId, role } = getUser(c)
    const { year, quarter } = c.req.query()

    const currentYear = year ? parseInt(year) : getCurrentYear()

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403)
    }

    // Build where conditions
    const conditions = [
      eq(schema.goals.companyId, companyId),
    ]

    if (year) {
      conditions.push(eq(schema.goals.year, parseInt(year)))
    }
    if (quarter) {
      conditions.push(eq(schema.goals.quarter, parseInt(quarter)))
    }

    // Get all goals for the company
    const goals = await db.query.goals.findMany({
      where: and(...conditions),
    })

    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      // Get tracking for each goal
      const tracking = await db.query.weeklyTracking.findMany({
        where: and(
          eq(schema.weeklyTracking.goalId, goal.id),
          eq(schema.weeklyTracking.year, currentYear)
        ),
      })

      const progress = calculateGoalProgress(
        goal.startWeek || 1,
        goal.endWeek || 52,
        tracking.map(t => ({
          week_number: t.weekNumber,
          status: t.status,
        })) as any[],
        getCurrentWeek(),
        currentYear
      )

      return {
        ...goal,
        progress,
      }
    }))

    // Group by category
    const byCategory: Record<string, { count: number; goals: any[] }> = {}
    for (const goal of goalsWithProgress) {
      if (!byCategory[goal.category]) {
        byCategory[goal.category] = { count: 0, goals: [] }
      }
      byCategory[goal.category].count++
      byCategory[goal.category].goals.push(goal)
    }

    return c.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        byCategory,
        currentWeek: getCurrentWeek(),
        currentYear,
      },
    })
  } catch (err) {
    console.error('Get dashboard tracking error:', err)
    return c.json({ success: false, error: 'Lỗi server' }, 500)
  }
})