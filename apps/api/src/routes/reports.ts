import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, isNull } from 'drizzle-orm';
import { calculateGoalProgress, getCurrentWeek, getCurrentYear } from '../utils/progress';
import type { WeeklyTracking } from '@mvgsm/shared';
import type { AuthContext } from '../index';

export const reportRoutes = new Hono<AuthContext>();

// Get quarterly report data [C8]
reportRoutes.get('/quarterly', async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const role = c.get('role') as string;
    const { year, quarter } = c.req.query();

    const currentYear = year ? parseInt(year) : getCurrentYear();
    const currentQuarter = quarter ? parseInt(quarter) : Math.ceil((new Date().getMonth() + 1) / 3);

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập báo cáo' }, 403);
    }

    // Get company info
    const company = await db.query.companies.findFirst({
      where: eq(schema.companies.id, companyId),
    });

    // Get goals for this quarter
    const goals = await db
      .select({
        id: schema.goals.id,
        companyId: schema.goals.companyId,
        category: schema.goals.category,
        year: schema.goals.year,
        quarter: schema.goals.quarter,
        startWeek: schema.goals.startWeek,
        endWeek: schema.goals.endWeek,
        title: schema.goals.title,
        description: schema.goals.description,
        measure: schema.goals.measure,
        targetValue: schema.goals.targetValue,
        currentValue: schema.goals.currentValue,
        unit: schema.goals.unit,
        deadline: schema.goals.deadline,
        weight: schema.goals.weight,
        ownerDeptId: schema.goals.ownerDeptId,
        collabDeptIds: schema.goals.collabDeptIds,
        reward: schema.goals.reward,
        rewardValue: schema.goals.rewardValue,
        status: schema.goals.status,
        createdBy: schema.goals.createdBy,
        createdAt: schema.goals.createdAt,
        updatedAt: schema.goals.updatedAt,
        departmentName: schema.departments.name,
      })
      .from(schema.goals)
      .leftJoin(schema.departments, eq(schema.goals.ownerDeptId, schema.departments.id))
      .where(
        and(
          eq(schema.goals.companyId, companyId),
          eq(schema.goals.year, currentYear),
          eq(schema.goals.quarter, currentQuarter),
          isNull(schema.goals.deletedAt)
        )
      );

    // Get tracking for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const trackingRaw = await db
          .select()
          .from(schema.weeklyTracking)
          .where(and(eq(schema.weeklyTracking.goalId, goal.id), eq(schema.weeklyTracking.year, currentYear)));

        // Cast drizzle result to shared WeeklyTracking format
        const tracking = trackingRaw.map(t => ({
          id: t.id,
          goal_id: t.goalId!,
          week_number: t.weekNumber,
          year: t.year,
          status: t.status,
          note: t.note ?? undefined,
          updated_by: t.updatedBy ?? undefined,
          updated_at: t.updatedAt.getTime(),
        })) as WeeklyTracking[];

        const progress = calculateGoalProgress(
          goal.startWeek,
          goal.endWeek,
          tracking,
          getCurrentWeek(),
          currentYear
        );

        return {
          ...goal,
          progress,
          tracking,
        };
      })
    );

    // Get financial data
    const target = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, currentYear)),
    });

    const monthStart = (currentQuarter - 1) * 3 + 1;
    const monthEnd = currentQuarter * 3;

    const actuals = await db
      .select()
      .from(schema.monthlyActuals)
      .where(
        and(
          eq(schema.monthlyActuals.companyId, companyId),
          eq(schema.monthlyActuals.year, currentYear)
        )
      )
      .orderBy(schema.monthlyActuals.month);

    const filteredActuals = actuals.filter((m) => m.month >= monthStart && m.month <= monthEnd);

    // Calculate BCG products
    const products = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.companyId, companyId), eq(schema.products.year, currentYear), eq(schema.products.isActive, 1)));

    return c.json({
      success: true,
      data: {
        company,
        year: currentYear,
        quarter: currentQuarter,
        goals: goalsWithProgress,
        financial: {
          target,
          actuals: filteredActuals,
        },
        products: products,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Get quarterly report error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get department report
reportRoutes.get('/department/:deptId', async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const role = c.get('role') as string;
    const deptId = c.req.param('deptId');
    const { year, quarter } = c.req.query();

    const currentYear = year ? parseInt(year) : getCurrentYear();

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    // Get department info
    const department = await db.query.departments.findFirst({
      where: and(eq(schema.departments.id, deptId), eq(schema.departments.companyId, companyId)),
    });

    if (!department) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    // Build conditions for goals
    const goalConditions = [
      eq(schema.goals.companyId, companyId),
      eq(schema.goals.ownerDeptId, deptId),
      eq(schema.goals.year, currentYear),
      isNull(schema.goals.deletedAt),
    ];

    if (quarter) {
      goalConditions.push(eq(schema.goals.quarter, parseInt(quarter)));
    }

    const goals = await db
      .select({
        id: schema.goals.id,
        companyId: schema.goals.companyId,
        category: schema.goals.category,
        year: schema.goals.year,
        quarter: schema.goals.quarter,
        startWeek: schema.goals.startWeek,
        endWeek: schema.goals.endWeek,
        title: schema.goals.title,
        description: schema.goals.description,
        measure: schema.goals.measure,
        targetValue: schema.goals.targetValue,
        currentValue: schema.goals.currentValue,
        unit: schema.goals.unit,
        deadline: schema.goals.deadline,
        weight: schema.goals.weight,
        ownerDeptId: schema.goals.ownerDeptId,
        status: schema.goals.status,
        createdBy: schema.goals.createdBy,
        createdAt: schema.goals.createdAt,
        updatedAt: schema.goals.updatedAt,
        managerName: schema.users.name,
      })
      .from(schema.goals)
      .leftJoin(schema.users, eq(schema.goals.ownerDeptId, schema.users.departmentId))
      .where(and(...goalConditions));

    // Get tracking for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const trackingRaw = await db
          .select()
          .from(schema.weeklyTracking)
          .where(and(eq(schema.weeklyTracking.goalId, goal.id), eq(schema.weeklyTracking.year, currentYear)));

        // Cast drizzle result to shared WeeklyTracking format
        const tracking = trackingRaw.map(t => ({
          id: t.id,
          goal_id: t.goalId!,
          week_number: t.weekNumber,
          year: t.year,
          status: t.status,
          note: t.note ?? undefined,
          updated_by: t.updatedBy ?? undefined,
          updated_at: t.updatedAt.getTime(),
        })) as WeeklyTracking[];

        const progress = calculateGoalProgress(
          goal.startWeek,
          goal.endWeek,
          tracking,
          getCurrentWeek(),
          currentYear
        );

        return { ...goal, progress };
      })
    );

    return c.json({
      success: true,
      data: {
        department,
        goals: goalsWithProgress,
        year: currentYear,
        quarter: quarter ? parseInt(quarter) : null,
      },
    });
  } catch (err) {
    console.error('Get department report error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
