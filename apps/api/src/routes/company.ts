import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import type { Env } from '../types';

export const companyRoutes = new Hono<{ Bindings: Env }>();

// Get company info
companyRoutes.get('/', async (c) => {
  try {
    const { companyId } = getUser(c);

    const company = await c.env.DB.prepare(
      'SELECT * FROM companies WHERE id = ?'
    ).bind(companyId).first();

    if (!company) {
      return c.json({ success: false, error: 'Công ty không tồn tại' }, 404);
    }

    return c.json({ success: true, data: company });
  } catch (err) {
    console.error('Get company error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update company info (admin only)
companyRoutes.put('/', async (c) => {
  try {
    const { companyId } = getUser(c);
    const updates = await c.req.json();
    const now = Date.now();

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.mission !== undefined) {
      fields.push('mission = ?');
      values.push(updates.mission);
    }
    if (updates.vision !== undefined) {
      fields.push('vision = ?');
      values.push(updates.vision);
    }
    if (updates.core_values !== undefined) {
      fields.push('core_values = ?');
      values.push(updates.core_values);
    }
    if (updates.reward_policy !== undefined) {
      fields.push('reward_policy = ?');
      values.push(updates.reward_policy);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(companyId);

    await c.env.DB.prepare(`
      UPDATE companies SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM companies WHERE id = ?'
    ).bind(companyId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update company error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
