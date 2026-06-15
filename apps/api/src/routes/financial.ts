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
// Formula: Revenue = KHTN × Conversion Rate × Transactions per customer × AOV × Profit Margin
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

    // Get previous year data for comparison
    const prevYear = year - 1;
    const prevActuals = await c.env.DB.prepare(`
      SELECT * FROM monthly_actuals WHERE company_id = ? AND year = ?
      ORDER BY month
    `).bind(companyId, prevYear).all();

    const monthlyData = actuals.results as any[];
    const prevMonthlyData = prevActuals.results as any[];

    // Calculate totals
    const totalRevenue = monthlyData.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0);
    const totalCost = monthlyData.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
    const totalProfit = monthlyData.reduce((sum: number, m: any) => sum + (m.profit || 0), 0);
    const prevTotalRevenue = prevMonthlyData.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0);

    // Calculate five-way factors [S2.1]
    // Using annual totals for calculation
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // For a complete five-way analysis, we need actual sales data
    // These values would typically come from CRM or sales systems
    // For now, we calculate based on available data and estimate the rest

    // Get personal KPI data to estimate conversion rates
    const kpiData = await c.env.DB.prepare(`
      SELECT AVG(conversion_rate) as avg_conversion, AVG(avg_order_value) as avg_aov
      FROM personal_kpi WHERE year = ?
    `).bind(year).first();

    const conversionRate = kpiData?.avg_conversion || 5; // Default 5% if no data
    const avgOrderValue = kpiData?.avg_aov || 1000000; // Default 1M if no data

    // Estimate KHTN and transactions from revenue
    // Revenue = KHTN × Conversion × Transactions × AOV × Margin
    // We can back-calculate KHTN × Transactions if we have revenue
    const factorProduct = (conversionRate / 100) * (avgOrderValue) * (profitMargin / 100);
    const khtnTransactions = factorProduct > 0 ? totalRevenue / factorProduct : 0;

    // Assume average 3 transactions per customer
    const transactionsPerCustomer = 3;
    const estimatedKHTN = Math.sqrt(khtnTransactions / transactionsPerCustomer);

    return c.json({
      success: true,
      data: {
        year,
        quarter: quarter ? parseInt(quarter) : null,
        actuals: monthlyData,
        target,
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          prevTotalRevenue,
          revenueGrowth: prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0,
        },
        fiveWay: {
          // 5 factors [S2.1]
          khtn: Math.round(estimatedKHTN), // Khách hàng tiềm năng
          conversionRate: Math.round(conversionRate * 100) / 100,
          transactionsPerCustomer,
          avgOrderValue: Math.round(avgOrderValue),
          profitMargin: Math.round(profitMargin * 100) / 100,
          // Calculated revenue
          calculatedRevenue: totalRevenue,
          // Comparison vs previous year [S2.2]
          prevYear: {
            totalRevenue: prevTotalRevenue,
          },
        },
        // Suggestions based on factors [S2.3]
        suggestions: generateFiveWaySuggestions({
          khtn: estimatedKHTN,
          conversionRate,
          transactionsPerCustomer,
          avgOrderValue,
          profitMargin,
          totalRevenue,
          targetRevenue: target?.revenue_target || 0,
        }),
      },
    });
  } catch (err) {
    console.error('Five-way analysis error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Helper function to generate suggestions for five-way analysis [S2.3]
function generateFiveWaySuggestions(data: {
  khtn: number
  conversionRate: number
  transactionsPerCustomer: number
  avgOrderValue: number
  profitMargin: number
  totalRevenue: number
  targetRevenue: number
}): string[] {
  const suggestions: string[] = []
  const { totalRevenue, targetRevenue } = data

  // Check if revenue meets target
  if (targetRevenue > 0) {
    const percentOfTarget = (totalRevenue / targetRevenue) * 100
    if (percentOfTarget < 70) {
      suggestions.push(`⚠️ Doanh thu mới đạt ${percentOfTarget.toFixed(1)}% kế hoạch. Cần tăng cường các biện pháp thúc đẩy.`)
    }
  }

  // Check profit margin
  if (data.profitMargin < 10) {
    suggestions.push(`📉 Biên lợi nhuận thấp (${data.profitMargin.toFixed(1)}%). Cần xem xét cắt giảm chi phí hoặc tăng giá bán.`)
  } else if (data.profitMargin > 30) {
    suggestions.push(`✅ Biên lợi nhuận tốt (${data.profitMargin.toFixed(1)}%). Duy trì chiến lược hiện tại.`)
  }

  // Check conversion rate
  if (data.conversionRate < 3) {
    suggestions.push(`📊 Tỷ lệ chuyển đổi thấp (${data.conversionRate.toFixed(1)}%). Cần cải thiện chất lượng chăm sóc khách hàng.`)
  }

  // Check avg order value
  if (data.avgOrderValue < 500000) {
    suggestions.push(`💰 Giá trị đơn hàng trung bình thấp. Cân nhắc upsell/cross-sell để tăng AOV.`)
  }

  return suggestions
}
