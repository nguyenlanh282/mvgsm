import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { getUser } from '../utils/roles';
import type { Env } from '../types';

export const personalKpiRoutes = new Hono<AuthContext>();

// Get personal KPI for current user
personalKpiRoutes.get('/', async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const { year, month } = c.req.query();

    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    let query = `
      SELECT pk.*, u.name as user_name
      FROM personal_kpi pk
      JOIN users u ON pk.user_id = u.id
      WHERE pk.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (year) {
      query += ' AND pk.year = ?';
      params.push(currentYear);
    }

    if (month) {
      query += ' AND pk.month = ?';
      params.push(parseInt(month));
    }

    query += ' ORDER BY pk.year DESC, pk.month DESC';

    const kpis = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: kpis.results });
  } catch (err) {
    console.error('Get personal KPI error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create or update personal KPI
personalKpiRoutes.put('/', async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const data = await c.req.json();

    const currentYear = data.year || new Date().getFullYear();
    const currentMonth = data.month || new Date().getMonth() + 1;

    // Validate working_days_per_month [C5]
    if (data.working_days_per_month !== undefined) {
      if (data.working_days_per_month < 20 || data.working_days_per_month > 31) {
        return c.json({ success: false, error: 'Số ngày làm việc phải từ 20 đến 31' }, 400);
      }
    }

    // Check if KPI exists for this year/month
    const existing = await c.env.DB.prepare(`
      SELECT * FROM personal_kpi WHERE user_id = ? AND year = ? AND (month = ? OR (month IS NULL AND ? IS NULL))
    `).bind(userId, currentYear, currentMonth, currentMonth).first();

    const now = Date.now();

    if (existing) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE personal_kpi
        SET income_target = ?, commission_rate = ?, conversion_rate = ?,
            avg_order_value = ?, working_days_per_month = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        data.income_target ?? existing.income_target,
        data.commission_rate ?? existing.commission_rate,
        data.conversion_rate ?? existing.conversion_rate,
        data.avg_order_value ?? existing.avg_order_value,
        data.working_days_per_month ?? existing.working_days_per_month,
        now,
        existing.id
      ).run();

      // Save history [C10 extension]
      await c.env.DB.prepare(`
        INSERT INTO personal_kpi_history (
          id, personal_kpi_id, user_id, year, month, income_target,
          commission_rate, conversion_rate, avg_order_value, working_days_per_month,
          changed_by, changed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(), existing.id, userId, currentYear, currentMonth,
        data.income_target ?? existing.income_target,
        data.commission_rate ?? existing.commission_rate,
        data.conversion_rate ?? existing.conversion_rate,
        data.avg_order_value ?? existing.avg_order_value,
        data.working_days_per_month ?? existing.working_days_per_month,
        userId, now
      ).run();

      const updated = await c.env.DB.prepare('SELECT * FROM personal_kpi WHERE id = ?').bind(existing.id).first();
      return c.json({ success: true, data: updated });
    } else {
      // Create new
      const kpiId = crypto.randomUUID();

      await c.env.DB.prepare(`
        INSERT INTO personal_kpi (
          id, user_id, year, month, income_target, commission_rate,
          conversion_rate, avg_order_value, working_days_per_month, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        kpiId, userId, currentYear, currentMonth || null,
        data.income_target || null, data.commission_rate || null,
        data.conversion_rate || null, data.avg_order_value || null,
        data.working_days_per_month || 26, now, now
      ).run();

      const created = await c.env.DB.prepare('SELECT * FROM personal_kpi WHERE id = ?').bind(kpiId).first();
      return c.json({ success: true, data: created }, 201);
    }
  } catch (err) {
    console.error('Update personal KPI error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Calculate KPI - returns computed values
personalKpiRoutes.get('/calculate', async (c) => {
  try {
    const { income_target, commission_rate, conversion_rate, avg_order_value, working_days_per_month } = c.req.query();

    if (!income_target) {
      return c.json({ success: false, error: 'Thiếu mục tiêu thu nhập' }, 400);
    }

    const income = parseFloat(income_target);
    const commission = (parseFloat(commission_rate) || 0) / 100;
    const conversion = (parseFloat(conversion_rate) || 0) / 100;
    const aov = parseFloat(avg_order_value) || 0;
    const workingDays = parseInt(working_days_per_month) || 26;

    if (workingDays < 20 || workingDays > 31) {
      return c.json({ success: false, error: 'Số ngày làm việc phải từ 20 đến 31' }, 400);
    }

    // Calculations [C5][M5.2]
    // Sales target = Income target / Commission rate
    const salesTarget = commission > 0 ? income / commission : 0;

    // Number of orders = Sales target / Avg order value
    const numOrders = aov > 0 ? salesTarget / aov : 0;

    // Potential customers needed = Number of orders / Conversion rate
    const potentialCustomers = conversion > 0 ? numOrders / conversion : 0;

    // Daily prospects = Ceiling(potential customers / working days) [C5]
    const dailyProspects = Math.ceil(potentialCustomers / workingDays);

    return c.json({
      success: true,
      data: {
        income_target: income,
        commission_rate: commission * 100,
        conversion_rate: conversion * 100,
        avg_order_value: aov,
        working_days_per_month: workingDays,
        sales_target: Math.round(salesTarget),
        num_orders: Math.round(numOrders),
        potential_customers_per_month: Math.round(potentialCustomers),
        potential_customers_per_day: dailyProspects,
      },
    });
  } catch (err) {
    console.error('Calculate KPI error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
