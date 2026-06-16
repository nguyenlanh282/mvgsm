import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { getUser } from '../utils/roles';
import { requireAdmin, requireAdminOrManager, requireNotFinance } from '../utils/roles';
import { writeAuditLog } from '../utils/audit';
import { getQuarterWeeks, has53Weeks } from '../utils/progress';
import type { Env } from '../types';
import type { Goal, GoalCategory } from '@mvgsm/shared';

export const goalRoutes = new Hono<AuthContext>();

// Get goals with filters
goalRoutes.get('/', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, category, dept, status, include_deleted } = c.req.query();

    // Finance role cannot access goals [C4]
    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập mục tiêu' }, 403);
    }

    let query = `
      SELECT g.*, d.name as department_name, u.name as creator_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.company_id = ?
    `;
    const params: (string | number)[] = [companyId];

    // Only show non-deleted by default
    if (!include_deleted) {
      query += ' AND g.deleted_at IS NULL';
    }

    if (year) {
      query += ' AND g.year = ?';
      params.push(parseInt(year));
    }
    if (category) {
      query += ' AND g.category = ?';
      params.push(category);
    }
    if (dept) {
      query += ' AND g.owner_dept_id = ?';
      params.push(dept);
    }
    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }

    query += ' ORDER BY g.created_at DESC';

    const goals = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: goals.results });
  } catch (err) {
    console.error('Get goals error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get single goal
goalRoutes.get('/:id', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param('id');

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập mục tiêu' }, 403);
    }

    const goal = await c.env.DB.prepare(`
      SELECT g.*, d.name as department_name, u.name as creator_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ? AND g.company_id = ?
    `).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Get strategies
    const strategies = await c.env.DB.prepare(
      'SELECT * FROM strategies WHERE goal_id = ? ORDER BY sort_order'
    ).bind(goalId).all();

    // Get reward approvals for this goal
    const rewardApprovals = await c.env.DB.prepare(
      'SELECT * FROM reward_approvals WHERE goal_id = ? ORDER BY requested_at DESC'
    ).bind(goalId).all();

    return c.json({
      success: true,
      data: {
        ...goal,
        strategies: strategies.results,
        rewardApprovals: rewardApprovals.results,
      },
    });
  } catch (err) {
    console.error('Get goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create goal
goalRoutes.post('/', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const data = await c.req.json();

    // Validate required fields
    if (!data.title || !data.category || !data.year) {
      return c.json({ success: false, error: 'Thông tin không đầy đủ' }, 400);
    }

    // Validate category
    const validCategories: GoalCategory[] = ['tai_chinh', 'san_pham', 'khach_hang', 'thuong_hieu', 'he_thong', 'doi_ngu'];
    if (!validCategories.includes(data.category)) {
      return c.json({ success: false, error: 'Danh mục không hợp lệ' }, 400);
    }

    // Handle quarter and weeks [C1][C14][C26][C27]
    let startWeek = data.start_week || 1;
    let endWeek = data.end_week || 52;

    if (data.quarter) {
      const quarterWeeks = getQuarterWeeks(data.quarter);
      startWeek = quarterWeeks.startWeek;
      endWeek = quarterWeeks.endWeek;

      // If year has 53 weeks and it's Q4, extend to 53
      if (data.quarter === 4 && has53Weeks(data.year)) {
        endWeek = 53;
      }
    }

    // Validate weeks [C26][C27]
    if (startWeek < 1 || startWeek > 53 || endWeek < 1 || endWeek > 53) {
      return c.json({ success: false, error: 'Tuần phải từ 1 đến 53' }, 400);
    }
    if (endWeek < startWeek) {
      return c.json({ success: false, error: 'Tuần kết thúc phải lớn hơn hoặc bằng tuần bắt đầu' }, 400);
    }

    // [C28] Weight validation warning
    const weight = data.weight || 10;
    const existingWeights = await c.env.DB.prepare(`
      SELECT SUM(weight) as total FROM goals
      WHERE company_id = ? AND category = ? AND year = ? AND status = 'active' AND deleted_at IS NULL
    `).bind(companyId, data.category, data.year).first<{ total: number | null }>();

    const currentTotal = existingWeights?.total || 0;
    const newTotal = currentTotal + weight;
    let weightWarning: string | null = null;

    if (newTotal > 100) {
      weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (vượt quá 100%). Khuyến nghị điều chỉnh.`;
    } else if (newTotal < 100) {
      weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (thiếu ${100 - newTotal}%).`;
    }

    const goalId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO goals (
        id, company_id, category, year, quarter, start_week, end_week,
        title, description, measure, target_value, current_value, unit,
        deadline, weight, owner_dept_id, collab_dept_ids, reward, reward_value,
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      goalId, companyId, data.category, data.year, data.quarter || null,
      startWeek, endWeek, data.title, data.description || null,
      data.measure || null, data.target_value || null, data.current_value || null,
      data.unit || null, data.deadline || null, weight,
      data.owner_dept_id || null, JSON.stringify(data.collab_dept_ids || []),
      data.reward || null, data.reward_value || null,
      data.status || 'draft', userId, now, now
    ).run();

    // Add strategies if provided
    if (data.strategies && Array.isArray(data.strategies)) {
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        const strategyId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO strategies (id, goal_id, title, description, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(strategyId, goalId, strategy.title, strategy.description || null, i).run();
      }
    }

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_created',
      userId,
      userName: userId,
      newValue: { title: data.title, category: data.category },
    });

    const goal = await c.env.DB.prepare('SELECT * FROM goals WHERE id = ?').bind(goalId).first();

    return c.json({ success: true, data: goal, weightWarning }, 201);
  } catch (err) {
    console.error('Create goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update goal
goalRoutes.put('/:id', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');
    const data = await c.req.json();

    const existing = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first<Goal>();

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // [C28] Weight validation warning
    let weightWarning: string | null = null;
    if (data.weight !== undefined) {
      const category = data.category || existing.category;
      const year = data.year || existing.year;
      const existingWeights = await c.env.DB.prepare(`
        SELECT SUM(weight) as total FROM goals
        WHERE company_id = ? AND category = ? AND year = ? AND status = 'active' AND deleted_at IS NULL AND id != ?
      `).bind(companyId, category, year, goalId).first<{ total: number | null }>();

      const currentTotal = existingWeights?.total || 0;
      const newTotal = currentTotal + data.weight;
      if (newTotal > 100) {
        weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (vượt quá 100%). Khuyến nghị điều chỉnh.`;
      } else if (newTotal < 100) {
        weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (thiếu ${100 - newTotal}%).`;
      }
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    // Build update fields
    const allowedFields = [
      'title', 'description', 'category', 'year', 'quarter', 'start_week', 'end_week',
      'measure', 'target_value', 'current_value', 'unit', 'deadline', 'weight',
      'owner_dept_id', 'collab_dept_ids', 'reward', 'reward_value', 'status'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'collab_dept_ids') {
          values.push(JSON.stringify(data[field]));
        } else {
          values.push(data[field] as string | number | null);
        }
      }
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(goalId);

    await c.env.DB.prepare(`
      UPDATE goals SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Update strategies if provided
    if (data.strategies !== undefined && Array.isArray(data.strategies)) {
      // Delete existing strategies
      await c.env.DB.prepare('DELETE FROM strategies WHERE goal_id = ?').bind(goalId).run();

      // Insert new strategies
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        const strategyId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO strategies (id, goal_id, title, description, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(strategyId, goalId, strategy.title, strategy.description || null, i).run();
      }
    }

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_updated',
      userId,
      userName: userId,
      oldValue: existing,
      newValue: data,
    });

    const updated = await c.env.DB.prepare('SELECT * FROM goals WHERE id = ?').bind(goalId).first();

    return c.json({ success: true, data: updated, weightWarning });
  } catch (err) {
    console.error('Update goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Soft delete goal [C29]
goalRoutes.delete('/:id', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');

    const existing = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE goals SET deleted_at = ?, updated_at = ? WHERE id = ?
    `).bind(Date.now(), Date.now(), goalId).run();

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_deleted',
      userId,
      userName: userId,
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('Delete goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Restore deleted goal [C29]
goalRoutes.post('/:id/restore', requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');

    const existing = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE goals SET deleted_at = NULL, updated_at = ? WHERE id = ?
    `).bind(Date.now(), goalId).run();

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_restored',
      userId,
      userName: userId,
    });

    const restored = await c.env.DB.prepare('SELECT * FROM goals WHERE id = ?').bind(goalId).first();

    return c.json({ success: true, data: restored });
  } catch (err) {
    console.error('Restore goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Add strategy to goal
goalRoutes.post('/:id/strategies', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');
    const { title, description } = await c.req.json();

    // Verify goal belongs to company
    const goal = await c.env.DB.prepare(
      'SELECT id FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    const strategyId = crypto.randomUUID();

    // Get max sort_order
    const maxOrder = await c.env.DB.prepare(
      'SELECT MAX(sort_order) as max_order FROM strategies WHERE goal_id = ?'
    ).bind(goalId).first<{ max_order: number | null }>();

    const sortOrder = (maxOrder?.max_order ?? -1) + 1;

    await c.env.DB.prepare(`
      INSERT INTO strategies (id, goal_id, title, description, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(strategyId, goalId, title, description || null, sortOrder).run();

    const strategy = await c.env.DB.prepare(
      'SELECT * FROM strategies WHERE id = ?'
    ).bind(strategyId).first();

    return c.json({ success: true, data: strategy }, 201);
  } catch (err) {
    console.error('Add strategy error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
