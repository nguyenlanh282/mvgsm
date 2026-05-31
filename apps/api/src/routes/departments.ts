import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { requireAdminOrManager, requireAdmin } from '../middleware/roles';
import type { Env } from '../types';

export const departmentRoutes = new Hono<{ Bindings: Env }>();

// Get all departments
departmentRoutes.get('/', async (c) => {
  try {
    const { companyId } = getUser(c);

    const departments = await c.env.DB.prepare(
      `SELECT d.*, u.name as manager_name
       FROM departments d
       LEFT JOIN users u ON d.manager_id = u.id
       WHERE d.company_id = ?
       ORDER BY d.name`
    ).bind(companyId).all();

    return c.json({ success: true, data: departments.results });
  } catch (err) {
    console.error('Get departments error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create department
departmentRoutes.post('/', requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const { name, manager_id } = await c.req.json();

    if (!name) {
      return c.json({ success: false, error: 'Tên phòng ban là bắt buộc' }, 400);
    }

    const deptId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO departments (id, company_id, name, manager_id)
      VALUES (?, ?, ?, ?)
    `).bind(deptId, companyId, name, manager_id || null).run();

    const dept = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ?'
    ).bind(deptId).first();

    return c.json({ success: true, data: dept }, 201);
  } catch (err) {
    console.error('Create department error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update department
departmentRoutes.put('/:id', requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const deptId = c.req.param('id');
    const { name, manager_id } = await c.req.json();

    const existing = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ? AND company_id = ?'
    ).bind(deptId, companyId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (manager_id !== undefined) {
      fields.push('manager_id = ?');
      values.push(manager_id || null);
    }

    if (fields.length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    values.push(deptId);

    await c.env.DB.prepare(`
      UPDATE departments SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ?'
    ).bind(deptId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update department error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Reassign manager [C22]
departmentRoutes.put('/:id/manager', requireAdmin(), async (c) => {
  try {
    const { companyId, userId: currentUserId } = getUser(c);
    const deptId = c.req.param('id');
    const { manager_id } = await c.req.json();

    const existing = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ? AND company_id = ?'
    ).bind(deptId, companyId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE departments SET manager_id = ? WHERE id = ?
    `).bind(manager_id || null, deptId).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM departments WHERE id = ?'
    ).bind(deptId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reassign manager error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
