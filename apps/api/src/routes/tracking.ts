import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { getUser } from '../utils/roles';
import { requireAdminOrManager, requireNotFinance } from '../utils/roles';
import { writeAuditLog } from '../utils/audit';
import { calculateGoalProgress, getCurrentWeek, getCurrentYear } from '../utils/progress';
import type { Env } from '../types';

export const trackingRoutes = new Hono<AuthContext>();

// Get tracking data for a goal
trackingRoutes.get('/goals/:id', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param('id');
    const { year } = c.req.query();

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    const currentYear = year ? parseInt(year) : getCurrentYear();

    // Get goal info
    const goal = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Get tracking data
    const tracking = await c.env.DB.prepare(`
      SELECT t.*, u.name as updater_name
      FROM weekly_tracking t
      LEFT JOIN users u ON t.updated_by = u.id
      WHERE t.goal_id = ? AND t.year = ?
      ORDER BY t.week_number
    `).bind(goalId, currentYear).all();

    // Calculate progress [C15]
    const progress = calculateGoalProgress(
      goal.start_week,
      goal.end_week,
      tracking.results as any[],
      getCurrentWeek(),
      currentYear
    );

    return c.json({
      success: true,
      data: {
        goal,
        tracking: tracking.results,
        progress,
        currentWeek: getCurrentWeek(),
        currentYear,
      },
    });
  } catch (err) {
    console.error('Get tracking error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update weekly tracking
trackingRoutes.put('/goals/:id/week/:week', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');
    const week = parseInt(c.req.param('week'));
    const { year, status, note } = await c.req.json();

    // Verify goal belongs to company
    const goal = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Validate week is within goal range [C1]
    if (week < goal.start_week || week > goal.end_week) {
      return c.json({ success: false, error: `Tuần phải từ ${goal.start_week} đến ${goal.end_week}` }, 400);
    }

    // Validate status
    if (!['done', 'in_progress', 'not_done'].includes(status)) {
      return c.json({ success: false, error: 'Trạng thái không hợp lệ' }, 400);
    }

    // Get existing tracking
    const existing = await c.env.DB.prepare(`
      SELECT * FROM weekly_tracking WHERE goal_id = ? AND week_number = ? AND year = ?
    `).bind(goalId, week, year).first();

    const now = Date.now();
    const oldStatus = existing?.status;

    if (existing) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE weekly_tracking SET status = ?, note = ?, updated_by = ?, updated_at = ?
        WHERE goal_id = ? AND week_number = ? AND year = ?
      `).bind(status, note || null, userId, now, goalId, week, year).run();
    } else {
      // Insert new
      const trackingId = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO weekly_tracking (id, goal_id, week_number, year, status, note, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(trackingId, goalId, week, year, status, note || null, userId, now).run();
    }

    // Write audit log to KV [C2][C4]
    await writeAuditLog(c.env, {
      companyId,
      entityType: 'tracking',
      entityId: `${goalId}:${week}:${year}`,
      action: 'tracking_updated',
      userId,
      userName: userId,
      oldValue: oldStatus ? { status: oldStatus } : null,
      newValue: { status, note, week, year },
    });

    // Add to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, meta, created_at)
      VALUES (?, ?, ?, ?, 'tracking_updated', 'goal', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), companyId, userId, userId,
      goalId, goal.title, JSON.stringify({ week, year, status }), now
    ).run();

    return c.json({ success: true });
  } catch (err) {
    console.error('Update tracking error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get dashboard tracking summary
trackingRoutes.get('/dashboard', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, quarter } = c.req.query();

    const currentYear = year ? parseInt(year) : getCurrentYear();

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    // Get all goals for the company
    let goalsQuery = `
      SELECT g.*, d.name as department_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      WHERE g.company_id = ? AND g.deleted_at IS NULL AND g.year = ?
    `;
    const params: (string | number)[] = [companyId, currentYear];

    if (quarter) {
      goalsQuery += ' AND g.quarter = ?';
      params.push(parseInt(quarter));
    }

    const goals = await c.env.DB.prepare(goalsQuery).bind(...params).all();

    // Get tracking for all goals
    const goalIds = goals.results.map((g: any) => g.id);
    let trackingMap: Record<string, any[]> = {};

    if (goalIds.length > 0) {
      const placeholders = goalIds.map(() => '?').join(',');
      const trackingData = await c.env.DB.prepare(`
        SELECT * FROM weekly_tracking
        WHERE goal_id IN (${placeholders}) AND year = ?
      `).bind(...goalIds, currentYear).all();

      for (const t of trackingData.results) {
        if (!trackingMap[t.goal_id]) trackingMap[t.goal_id] = [];
        trackingMap[t.goal_id].push(t);
      }
    }

    // Calculate progress for each goal
    const goalsWithProgress = goals.results.map((goal: any) => {
      const tracking = trackingMap[goal.id] || [];
      const progress = calculateGoalProgress(
        goal.start_week,
        goal.end_week,
        tracking,
        getCurrentWeek(),
        currentYear
      );
      return {
        ...goal,
        progress,
      };
    });

    // Group by category
    const byCategory: Record<string, { count: number; goals: any[] }> = {};
    for (const goal of goalsWithProgress) {
      if (!byCategory[goal.category]) {
        byCategory[goal.category] = { count: 0, goals: [] };
      }
      byCategory[goal.category].count++;
      byCategory[goal.category].goals.push(goal);
    }

    return c.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        byCategory,
        currentWeek: getCurrentWeek(),
        currentYear,
      },
    });
  } catch (err) {
    console.error('Get dashboard tracking error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
