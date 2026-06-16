import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdminOrManager } from '../middleware/roles';
import { writeAuditLog } from '../utils/audit';
import { getCurrentYear } from '../utils/progress';

export const financialRoutes = new Hono();

// Get financial targets for a year
financialRoutes.get('/targets/:year', async (c) => {
  try {
    const companyId = c.get('companyId');
    const year = parseInt(c.req.param('year'));

    const target = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year))
    });

    return c.json({ success: true, data: target || null });
  } catch (err) {
    console.error('Get financial targets error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update financial targets
financialRoutes.put('/targets/:year', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const year = parseInt(c.req.param('year'));
    const data = await c.req.json();

    const existing = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year))
    });

    if (existing) {
      await db.update(schema.financialTargets)
        .set({
          revenueTarget: data.revenueTarget ?? existing.revenueTarget,
          costRatioTarget: data.costRatioTarget ?? existing.costRatioTarget,
          profitRatioTarget: data.profitRatioTarget ?? existing.profitRatioTarget,
        })
        .where(and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year)));
    } else {
      const id = crypto.randomUUID();
      await db.insert(schema.financialTargets).values({
        id,
        companyId,
        year,
        revenueTarget: data.revenueTarget,
        costRatioTarget: data.costRatioTarget ?? null,
        profitRatioTarget: data.profitRatioTarget ?? null,
      });
    }

    const updated = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year))
    });

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update financial targets error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get monthly actuals
financialRoutes.get('/actuals/:year', async (c) => {
  try {
    const companyId = c.get('companyId');
    const year = parseInt(c.req.param('year'));

    const actuals = await db.query.monthlyActuals.findMany({
      where: and(eq(schema.monthlyActuals.companyId, companyId), eq(schema.monthlyActuals.year, year)),
      orderBy: desc(schema.monthlyActuals.month),
    });

    // Also get targets
    const target = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year))
    });

    return c.json({
      success: true,
      data: {
        actuals,
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
    const companyId = c.get('companyId');
    const userId = c.get('userId');
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    const data = await c.req.json();

    if (month < 1 || month > 12) {
      return c.json({ success: false, error: 'Tháng không hợp lệ' }, 400);
    }

    const existing = await db.query.monthlyActuals.findFirst({
      where: and(
        eq(schema.monthlyActuals.companyId, companyId),
        eq(schema.monthlyActuals.year, year),
        eq(schema.monthlyActuals.month, month)
      )
    });

    if (existing) {
      await db.update(schema.monthlyActuals)
        .set({
          revenue: data.revenue ?? existing.revenue,
          cost: data.cost ?? existing.cost,
          profit: data.profit ?? existing.profit,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(
          eq(schema.monthlyActuals.companyId, companyId),
          eq(schema.monthlyActuals.year, year),
          eq(schema.monthlyActuals.month, month)
        ));
    } else {
      const id = crypto.randomUUID();
      await db.insert(schema.monthlyActuals).values({
        id,
        companyId,
        year,
        month,
        revenue: data.revenue ?? null,
        cost: data.cost ?? null,
        profit: data.profit ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      });
    }

    // Write to activity feed
    await db.insert(schema.activityFeed).values({
      id: crypto.randomUUID(),
      companyId,
      actorId: userId,
      actorName: userId,
      action: 'financial_updated',
      entityType: 'monthly_actuals',
      entityId: `${year}-${month}`,
      entityTitle: `Doanh thu tháng ${month}`,
      meta: { revenue: data.revenue },
      createdAt: new Date(),
    });

    const updated = await db.query.monthlyActuals.findFirst({
      where: and(
        eq(schema.monthlyActuals.companyId, companyId),
        eq(schema.monthlyActuals.year, year),
        eq(schema.monthlyActuals.month, month)
      )
    });

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
    const companyId = c.get('companyId');
    const year = parseInt(c.req.param('year'));
    const { quarter } = c.req.query();

    // Get monthly actuals
    const actuals = await db.query.monthlyActuals.findMany({
      where: and(eq(schema.monthlyActuals.companyId, companyId), eq(schema.monthlyActuals.year, year)),
      orderBy: desc(schema.monthlyActuals.month),
    });

    // Get targets
    const target = await db.query.financialTargets.findFirst({
      where: and(eq(schema.financialTargets.companyId, companyId), eq(schema.financialTargets.year, year))
    });

    // Get previous year data for comparison
    const prevYear = year - 1;
    const prevActuals = await db.query.monthlyActuals.findMany({
      where: and(eq(schema.monthlyActuals.companyId, companyId), eq(schema.monthlyActuals.year, prevYear)),
      orderBy: desc(schema.monthlyActuals.month),
    });

    const monthlyData = actuals as any[];
    const prevMonthlyData = prevActuals as any[];

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
    const kpiData = await db.query.personalKpi.findFirst({
      where: eq(schema.personalKpi.year, year)
    });

    const conversionRate = kpiData?.conversionRate || 5; // Default 5% if no data
    const avgOrderValue = kpiData?.avgOrderValue || 1000000; // Default 1M if no data

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
          targetRevenue: target?.revenueTarget || 0,
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
      suggestions.push(`Doanh thu mới đạt ${percentOfTarget.toFixed(1)}% kế hoạch. Cần tăng cường các biện pháp thúc đẩy.`)
    }
  }

  // Check profit margin
  if (data.profitMargin < 10) {
    suggestions.push(`Biên lợi nhuận thấp (${data.profitMargin.toFixed(1)}%). Cần xem xét cắt giảm chi phí hoặc tăng giá bán.`)
  } else if (data.profitMargin > 30) {
    suggestions.push(`Biên lợi nhuận tốt (${data.profitMargin.toFixed(1)}%). Duy trì chiến lược hiện tại.`)
  }

  // Check conversion rate
  if (data.conversionRate < 3) {
    suggestions.push(`Tỷ lệ chuyển đổi thấp (${data.conversionRate.toFixed(1)}%). Cần cải thiện chất lượng chăm sóc khách hàng.`)
  }

  // Check avg order value
  if (data.avgOrderValue < 500000) {
    suggestions.push(`Giá trị đơn hàng trung bình thấp. Cân nhắc upsell/cross-sell để tăng AOV.`)
  }

  return suggestions
}
