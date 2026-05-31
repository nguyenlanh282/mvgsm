import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { requireAdminOrManager } from '../middleware/roles';
import { writeAuditLog } from '../utils/audit';
import { getCurrentYear } from '../utils/progress';
import type { Env } from '../types';

export const financialRoutes = new Hono<{ Bindings: Env }>();

// Get financial targets for a year
financialRoutes.get('/targets/:year', async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param('year'));

    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();

    return c.json({ success: true, data: target || null });
  } catch (err) {
    console.error('Get financial targets error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update financial targets
financialRoutes.put('/targets/:year', requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const year = parseInt(c.req.param('year'));
    const data = await c.req.json();

    const existing = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();

    const now = Date.now();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE financial_targets
        SET revenue_target = ?, cost_ratio_target = ?, profit_ratio_target = ?
        WHERE company_id = ? AND year = ?
      `).bind(
        data.revenue_target ?? existing.revenue_target,
        data.cost_ratio_target ?? existing.cost_ratio_target,
        data.profit_ratio_target ?? existing.profit_ratio_target,
        companyId, year
      ).run();
    } else {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO financial_targets (id, company_id, year, revenue_target, cost_ratio_target, profit_ratio_target)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, companyId, year, data.revenue_target, data.cost_ratio_target || null, data.profit_ratio_target || null).run();
    }

    const updated = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update financial targets error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get monthly actuals
financialRoutes.get('/actuals/:year', async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param('year'));

    const actuals = await c.env.DB.prepare(`
      SELECT m.*, u.name as updater_name
      FROM monthly_actuals m
      LEFT JOIN users u ON m.updated_by = u.id
      WHERE m.company_id = ? AND m.year = ?
      ORDER BY m.month
    `).bind(companyId, year).all();

    // Also get targets
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();

    return c.json({
      success: true,
      data: {
        actuals: actuals.results,
        target,
        year,
      },
    });
  } catch (err) {
    console.error('Get monthly actuals error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update monthly actual
financialRoutes.put('/actuals/:year/:month', requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    const data = await c.req.json();

    if (month < 1 || month > 12) {
      return c.json({ success: false, error: 'Tháng không hợp lệ' }, 400);
    }

    const now = Date.now();

    const existing = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ? AND month = ?
    `).bind(companyId, year, month).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE monthly_actuals
        SET revenue = ?, cost = ?, profit = ?, updated_by = ?, updated_at = ?
        WHERE company_id = ? AND year = ? AND month = ?
      `).bind(
        data.revenue ?? existing.revenue,
        data.cost ?? existing.cost,
        data.profit ?? existing.profit,
        userId, now,
        companyId, year, month
      ).run();
    } else {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO monthly_actuals (id, company_id, year, month, revenue, cost, profit, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, companyId, year, month, data.revenue || null, data.cost || null, data.profit || null, userId, now).run();
    }

    // Write to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, meta, created_at)
      VALUES (?, ?, ?, ?, 'financial_updated', 'monthly_actuals', ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(), companyId, userId, userId,
      `${year}-${month}`, `Doanh thu tháng ${month}`,
      JSON.stringify({ revenue: data.revenue }), now
    ).run();

    const updated = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ? AND month = ?
    `).bind(companyId, year, month).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update monthly actual error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Five-way analysis
financialRoutes.get('/fiveway/:year', async (c) => {
  try {
    const { companyId } = getUser(c);
    const year = parseInt(c.req.param('year'));
    const { quarter } = c.req.query();

    // Get monthly actuals
    const actuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ?
      ORDER BY month
    `).bind(companyId, year).all();

    // Get targets
    const target = await c.env.DB.prepare(`
      SELECT * FROM financial_targets WHERE company_id = ? AND year = ?
    `).bind(companyId, year).first();

    // Calculate five-way metrics
    const monthlyData = actuals.results as any[];

    // For now, return aggregated data
    // In production, this would calculate:
    // - KHTN (Leads)
    // - Conversion Rate
    // - Transactions per customer
    // - AOV (Average Order Value)
    // - Profit Margin

    return c.json({
      success: true,
      data: {
        year,
        quarter: quarter ? parseInt(quarter) : null,
        actuals: monthlyData,
        target,
        summary: {
          totalRevenue: monthlyData.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0),
          totalCost: monthlyData.reduce((sum: number, m: any) => sum + (m.cost || 0), 0),
          totalProfit: monthlyData.reduce((sum: number, m: any) => sum + (m.profit || 0), 0),
        },
      },
    });
  } catch (err) {
    console.error('Five-way analysis error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
