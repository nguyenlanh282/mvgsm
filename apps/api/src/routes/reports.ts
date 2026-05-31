import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { calculateGoalProgress, getCurrentWeek, getCurrentYear } from '../utils/progress';
import type { Env } from '../types';

export const reportRoutes = new Hono<{ Bindings: Env }>();

// Get quarterly report data [C8]
reportRoutes.get('/quarterly', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { year, quarter } = c.req.query();

    const currentYear = year ? parseInt(year) : getCurrentYear();
    const currentQuarter = quarter ? parseInt(quarter) : Math.ceil((new Date().getMonth() + 1) / 3);

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập báo cáo' }, 403);
    }

    // Get company info
    const company = await c.env.DB.prepare(
      'SELECT * FROM companies WHERE id = ?'
    ).bind(companyId).first();

    // Get goals for this quarter
    const goals = await c.env.DB.prepare(`
      SELECT g.*, d.name as department_name
      FROM goals g
      LEFT JOIN departments d ON g.owner_dept_id = d.id
      WHERE g.company_id = ? AND g.year = ? AND g.quarter = ?
      AND g.deleted_at IS NULL
    `).bind(companyId, currentYear, currentQuarter).all();

    // Get tracking for each goal
    const goalsWithProgress = await Promise.all(
      (goals.results || []).map(async (goal: any) => {
        const tracking = await c.env.DB.prepare(`
          SELECT * FROM weekly_tracking
          WHERE goal_id = ? AND year = ?
        `).bind(goal.id, currentYear).all();

        const progress = calculateGoalProgress(
          goal.start_week,
          goal.end_week,
          tracking.results as any[],
          getCurrentWeek(),
          currentYear
        );

        return {
          ...goal,
          progress,
          tracking: tracking.results,
        };
      })
    );

    // Get financial data
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, currentYear).first();

    const monthStart = (currentQuarter - 1) * 3 + 1;
    const monthEnd = currentQuarter * 3;

    const actuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals
      WHERE company_id = ? AND year = ? AND month >= ? AND month <= ?
      ORDER BY month
    `).bind(companyId, currentYear, monthStart, monthEnd).all();

    // Calculate BCG products
    const products = await c.env.DB.prepare(`
      SELECT * FROM products WHERE company_id = ? AND year = ? AND is_active = 1
    `).bind(companyId, currentYear).all();

    return c.json({
      success: true,
      data: {
        company,
        year: currentYear,
        quarter: currentQuarter,
        goals: goalsWithProgress,
        financial: {
          target,
          actuals: actuals.results,
        },
        products: products.results,
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
    const { companyId, role } = getUser(c);
    const deptId = c.req.param('deptId');
    const { year, quarter } = c.req.query();

    const currentYear = year ? parseInt(year) : getCurrentYear();

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    // Get department info
    const department = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ? AND company_id = ?'
    ).bind(deptId, companyId).first();

    if (!department) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    // Get goals for this department
    let goalsQuery = `
      SELECT g.*, u.name as manager_name
      FROM goals g
      LEFT JOIN users u ON g.owner_dept_id = u.department_id
      WHERE g.company_id = ? AND g.owner_dept_id = ? AND g.year = ? AND g.deleted_at IS NULL
    `;
    const params: (string | number)[] = [companyId, deptId, currentYear];

    if (quarter) {
      goalsQuery += ' AND g.quarter = ?';
      params.push(parseInt(quarter));
    }

    const goals = await c.env.DB.prepare(goalsQuery).bind(...params).all();

    // Get tracking for each goal
    const goalsWithProgress = await Promise.all(
      (goals.results || []).map(async (goal: any) => {
        const tracking = await c.env.DB.prepare(`
          SELECT * FROM weekly_tracking WHERE goal_id = ? AND year = ?
        `).bind(goal.id, currentYear).all();

        const progress = calculateGoalProgress(
          goal.start_week,
          goal.end_week,
          tracking.results as any[],
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
