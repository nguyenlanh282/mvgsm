import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, isNull, desc, ne } from 'drizzle-orm';
import { requireAdmin, requireAdminOrManager, requireNotFinance } from '../utils/roles';
import { writeAuditLog } from '../utils/audit';
import { getQuarterWeeks, has53Weeks } from '../utils/progress';
import type { Goal, GoalCategory } from '@mvgsm/shared';

export const goalRoutes = new Hono<AuthContext>();

// Get goals with filters
goalRoutes.get('/', async (c) => {
  try {
    const companyId = c.get('companyId');
    const role = c.get('role');
    const { year, category, dept, status, include_deleted } = c.req.query();

    // Finance role cannot access goals [C4]
    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập mục tiêu' }, 403);
    }

    const conditions = [eq(schema.goals.companyId, companyId)];

    if (!include_deleted) {
      conditions.push(isNull(schema.goals.deletedAt));
    }
    if (year) {
      conditions.push(eq(schema.goals.year, parseInt(year)));
    }
    if (category) {
      conditions.push(eq(schema.goals.category, category as GoalCategory));
    }
    if (dept) {
      conditions.push(eq(schema.goals.ownerDeptId, dept));
    }
    if (status) {
      conditions.push(eq(schema.goals.status, status as Goal['status']));
    }

    const goals = await db.query.goals.findMany({
      where: and(...conditions),
      with: {
        strategies: true,
      },
      orderBy: desc(schema.goals.createdAt),
    });

    return c.json({ success: true, data: goals });
  } catch (err) {
    console.error('Get goals error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get single goal
goalRoutes.get('/:id', async (c) => {
  try {
    const companyId = c.get('companyId');
    const role = c.get('role');
    const goalId = c.req.param('id');

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập mục tiêu' }, 403);
    }

    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
      with: {
        strategies: {
          orderBy: (strategies, { asc }) => [asc(strategies.sortOrder)],
        },
        rewardApprovals: {
          orderBy: (approvals, { desc }) => [desc(approvals.requestedAt)],
        },
      },
    });

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    return c.json({ success: true, data: goal });
  } catch (err) {
    console.error('Get goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create goal
goalRoutes.post('/', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
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

    // [C28] Weight validation warning - get all goals for this category/year and sum weights
    const weight = data.weight || 10;
    const existingGoals = await db.query.goals.findMany({
      where: and(
        eq(schema.goals.companyId, companyId),
        eq(schema.goals.category, data.category),
        eq(schema.goals.year, data.year),
        eq(schema.goals.status, 'active'),
        isNull(schema.goals.deletedAt)
      ),
      columns: {
        weight: true,
      },
    });

    const currentTotal = existingGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
    const newTotal = currentTotal + weight;
    let weightWarning: string | null = null;

    if (newTotal > 100) {
      weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (vượt quá 100%). Khuyến nghị điều chỉnh.`;
    } else if (newTotal < 100) {
      weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (thiếu ${100 - newTotal}%).`;
    }

    const goalId = crypto.randomUUID();
    const now = new Date();

    await db.insert(schema.goals).values({
      id: goalId,
      companyId,
      category: data.category,
      year: data.year,
      quarter: data.quarter || null,
      startWeek,
      endWeek,
      title: data.title,
      description: data.description || null,
      measure: data.measure || null,
      targetValue: data.target_value || null,
      currentValue: data.current_value || null,
      unit: data.unit || null,
      deadline: data.deadline || null,
      weight,
      ownerDeptId: data.owner_dept_id || null,
      collabDeptIds: data.collab_dept_ids || [],
      reward: data.reward || null,
      rewardValue: data.reward_value || null,
      status: data.status || 'draft',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add strategies if provided
    if (data.strategies && Array.isArray(data.strategies)) {
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        await db.insert(schema.strategies).values({
          id: crypto.randomUUID(),
          goalId,
          title: strategy.title,
          description: strategy.description || null,
          sortOrder: i,
        });
      }
    }

    await writeAuditLog({
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_created',
      userId,
      userName: userId,
      newValue: { title: data.title, category: data.category },
    });

    const goal = await db.query.goals.findFirst({
      where: eq(schema.goals.id, goalId),
    });

    return c.json({ success: true, data: goal, weightWarning }, 201);
  } catch (err) {
    console.error('Create goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update goal
goalRoutes.put('/:id', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const goalId = c.req.param('id');
    const data = await c.req.json();

    const existing = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // [C28] Weight validation warning
    let weightWarning: string | null = null;
    if (data.weight !== undefined) {
      const category = data.category || existing.category;
      const year = data.year || existing.year;

      const existingGoals = await db.query.goals.findMany({
        where: and(
          eq(schema.goals.companyId, companyId),
          eq(schema.goals.category, category),
          eq(schema.goals.year, year),
          eq(schema.goals.status, 'active'),
          isNull(schema.goals.deletedAt),
          ne(schema.goals.id, goalId)
        ),
        columns: {
          weight: true,
        },
      });

      const currentTotal = existingGoals.reduce((sum, g) => sum + (g.weight || 0), 0);
      const newTotal = currentTotal + data.weight;
      if (newTotal > 100) {
        weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (vượt quá 100%). Khuyến nghị điều chỉnh.`;
      } else if (newTotal < 100) {
        weightWarning = `⚠️ Trọng số trụ cột sẽ là ${newTotal}% (thiếu ${100 - newTotal}%).`;
      }
    }

    // Build update fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    const allowedFields = [
      'title', 'description', 'category', 'year', 'quarter', 'start_week', 'end_week',
      'measure', 'target_value', 'current_value', 'unit', 'deadline', 'weight',
      'owner_dept_id', 'collab_dept_ids', 'reward', 'reward_value', 'status'
    ];

    const fieldMapping: Record<string, keyof typeof schema.goals.$inferInsert> = {
      title: 'title',
      description: 'description',
      category: 'category',
      year: 'year',
      quarter: 'quarter',
      start_week: 'startWeek',
      end_week: 'endWeek',
      measure: 'measure',
      target_value: 'targetValue',
      current_value: 'currentValue',
      unit: 'unit',
      deadline: 'deadline',
      weight: 'weight',
      owner_dept_id: 'ownerDeptId',
      collab_dept_ids: 'collabDeptIds',
      reward: 'reward',
      reward_value: 'rewardValue',
      status: 'status',
    };

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const dbField = fieldMapping[field];
        if (dbField === 'collabDeptIds') {
          updateData[dbField] = JSON.stringify(data[field]);
        } else {
          updateData[dbField] = data[field];
        }
      }
    }

    await db.update(schema.goals).set(updateData as any).where(eq(schema.goals.id, goalId));

    // Update strategies if provided
    if (data.strategies !== undefined && Array.isArray(data.strategies)) {
      // Delete existing strategies
      await db.delete(schema.strategies).where(eq(schema.strategies.goalId, goalId));

      // Insert new strategies
      for (let i = 0; i < data.strategies.length; i++) {
        const strategy = data.strategies[i];
        await db.insert(schema.strategies).values({
          id: crypto.randomUUID(),
          goalId,
          title: strategy.title,
          description: strategy.description || null,
          sortOrder: i,
        });
      }
    }

    await writeAuditLog({
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_updated',
      userId,
      userName: userId,
      oldValue: existing,
      newValue: data,
    });

    const updated = await db.query.goals.findFirst({
      where: eq(schema.goals.id, goalId),
    });

    return c.json({ success: true, data: updated, weightWarning });
  } catch (err) {
    console.error('Update goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Soft delete goal [C29]
goalRoutes.delete('/:id', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const goalId = c.req.param('id');

    const existing = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    await db.update(schema.goals)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.goals.id, goalId));

    await writeAuditLog({
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
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const goalId = c.req.param('id');

    const existing = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });

    if (!existing) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    await db.update(schema.goals)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(schema.goals.id, goalId));

    await writeAuditLog({
      companyId,
      entityType: 'goal',
      entityId: goalId,
      action: 'goal_restored',
      userId,
      userName: userId,
    });

    const restored = await db.query.goals.findFirst({
      where: eq(schema.goals.id, goalId),
    });

    return c.json({ success: true, data: restored });
  } catch (err) {
    console.error('Restore goal error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Add strategy to goal
goalRoutes.post('/:id/strategies', requireAdminOrManager(), requireNotFinance(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const goalId = c.req.param('id');
    const { title, description } = await c.req.json();

    // Verify goal belongs to company
    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
      columns: { id: true },
    });

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Get max sort_order
    const strategies = await db.query.strategies.findMany({
      where: eq(schema.strategies.goalId, goalId),
      columns: { sortOrder: true },
      orderBy: (strategies, { desc }) => [desc(strategies.sortOrder)],
      limit: 1,
    });

    const maxOrder = strategies[0]?.sortOrder ?? -1;
    const sortOrder = maxOrder + 1;

    const strategyId = crypto.randomUUID();
    await db.insert(schema.strategies).values({
      id: strategyId,
      goalId,
      title,
      description: description || null,
      sortOrder,
    });

    const strategy = await db.query.strategies.findFirst({
      where: eq(schema.strategies.id, strategyId),
    });

    return c.json({ success: true, data: strategy }, 201);
  } catch (err) {
    console.error('Add strategy error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
