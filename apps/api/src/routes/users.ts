import { Hono } from 'hono';
import { hashPassword, validatePasswordPolicy } from '../utils/jwt';
import { getUser } from '../middleware/auth';
import { requireAdmin, requireAdminOrManager } from '../middleware/roles';
import { writeAuditLog } from '../utils/audit';
import type { Env } from '../types';
import type { User } from '@mvgsm/shared';

export const userRoutes = new Hono<{ Bindings: Env }>();

// Get all users in company
userRoutes.get('/', requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);

    const users = await c.env.DB.prepare(
      `SELECT id, company_id, email, name, role, department_id, is_active, created_at
       FROM users WHERE company_id = ? ORDER BY created_at DESC`
    ).bind(companyId).all();

    return c.json({ success: true, data: users.results });
  } catch (err) {
    console.error('Get users error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create user (admin only)
userRoutes.post('/', requireAdmin(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const { email, password, name, role, department_id } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ success: false, error: 'Thông tin không đầy đủ' }, 400);
    }

    // Validate password policy [C33]
    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.valid) {
      return c.json({ success: false, error: passwordCheck.error }, 400);
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ success: false, error: 'Email đã được sử dụng' }, 409);
    }

    // Validate role
    if (!['admin', 'manager', 'staff', 'finance'].includes(role)) {
      return c.json({ success: false, error: 'Vai trò không hợp lệ' }, 400);
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO users (id, company_id, email, password_hash, name, role, department_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, companyId, email, passwordHash, name, role, department_id || null, now).run();

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'user',
      entityId: userId,
      action: 'user_created',
      userId: getUser(c).userId,
      userName: getUser(c).userId,
      newValue: { email, name, role },
    });

    return c.json({
      success: true,
      data: {
        id: userId,
        company_id: companyId,
        email,
        name,
        role,
        department_id,
        created_at: now,
      },
    }, 201);
  } catch (err) {
    console.error('Create user error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update user
userRoutes.put('/:id', requireAdmin(), async (c) => {
  try {
    const { companyId, userId: currentUserId } = getUser(c);
    const targetUserId = c.req.param('id');
    const updates = await c.req.json();

    // Check if user exists and belongs to company
    const existing = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND company_id = ?'
    ).bind(targetUserId, companyId).first<User>();

    if (!existing) {
      return c.json({ success: false, error: 'Người dùng không tồn tại' }, 404);
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.role !== undefined) {
      if (!['admin', 'manager', 'staff', 'finance'].includes(updates.role)) {
        return c.json({ success: false, error: 'Vai trò không hợp lệ' }, 400);
      }
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(updates.department_id || null);
    }
    if (updates.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.password !== undefined) {
      // Validate password policy [C33]
      const passwordCheck = validatePasswordPolicy(updates.password);
      if (!passwordCheck.valid) {
        return c.json({ success: false, error: passwordCheck.error }, 400);
      }
      const passwordHash = await hashPassword(updates.password);
      fields.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    values.push(targetUserId);

    await c.env.DB.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    await writeAuditLog(c.env, {
      companyId,
      entityType: 'user',
      entityId: targetUserId,
      action: updates.role !== existing.role ? 'role_changed' : 'user_updated',
      userId: currentUserId,
      userName: currentUserId,
      oldValue: { role: existing.role },
      newValue: { role: updates.role },
      isCritical: updates.role !== existing.role,
    });

    const updated = await c.env.DB.prepare(
      `SELECT id, company_id, email, name, role, department_id, is_active, created_at
       FROM users WHERE id = ?`
    ).bind(targetUserId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
