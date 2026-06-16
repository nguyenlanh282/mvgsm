import { Hono } from 'hono';
import { hashPassword, validatePasswordPolicy } from '../utils/jwt';
import { requireAdmin, requireAdminOrManager } from '../middleware/roles';
import { writeAuditLog } from '../utils/audit';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import type { User } from '@mvgsm/shared';

export const userRoutes = new Hono();

// Get all users in company
userRoutes.get('/', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId');

    const users = await db.query.users.findMany({
      where: eq(schema.users.companyId, companyId),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return c.json({ success: true, data: users });
  } catch (err) {
    console.error('Get users error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create user (admin only)
userRoutes.post('/', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const currentUserId = c.get('userId');
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
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existing) {
      return c.json({ success: false, error: 'Email đã được sử dụng' }, 409);
    }

    // Validate role
    if (!['admin', 'manager', 'staff', 'finance'].includes(role)) {
      return c.json({ success: false, error: 'Vai trò không hợp lệ' }, 400);
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const [user] = await db.insert(schema.users).values({
      companyId,
      email,
      passwordHash,
      name,
      role,
      departmentId: department_id || null,
      createdAt: now,
    }).returning();

    await writeAuditLog({
      companyId,
      entityType: 'user',
      entityId: user.id,
      action: 'user_created',
      userId: currentUserId,
      userName: currentUserId,
      newValue: { email, name, role },
    });

    return c.json({
      success: true,
      data: {
        id: user.id,
        company_id: user.companyId,
        email: user.email,
        name: user.name,
        role: user.role,
        department_id: user.departmentId,
        created_at: user.createdAt,
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
    const companyId = c.get('companyId');
    const currentUserId = c.get('userId');
    const targetUserId = c.req.param('id');
    const updates = await c.req.json();

    // Check if user exists and belongs to company
    const existing = await db.query.users.findFirst({
      where: eq(schema.users.id, targetUserId),
    });

    if (!existing || existing.companyId !== companyId) {
      return c.json({ success: false, error: 'Người dùng không tồn tại' }, 404);
    }

    const setData: Partial<{
      name: string;
      role: 'admin' | 'manager' | 'staff' | 'finance';
      departmentId: string | null;
      isActive: number;
      passwordHash: string;
    }> = {};

    if (updates.name !== undefined) {
      setData.name = updates.name;
    }
    if (updates.role !== undefined) {
      if (!['admin', 'manager', 'staff', 'finance'].includes(updates.role)) {
        return c.json({ success: false, error: 'Vai trò không hợp lệ' }, 400);
      }
      setData.role = updates.role;
    }
    if (updates.department_id !== undefined) {
      setData.departmentId = updates.department_id || null;
    }
    if (updates.is_active !== undefined) {
      setData.isActive = updates.is_active ? 1 : 0;
    }
    if (updates.password !== undefined) {
      // Validate password policy [C33]
      const passwordCheck = validatePasswordPolicy(updates.password);
      if (!passwordCheck.valid) {
        return c.json({ success: false, error: passwordCheck.error }, 400);
      }
      setData.passwordHash = await hashPassword(updates.password);
    }

    if (Object.keys(setData).length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    const [updated] = await db.update(schema.users)
      .set(setData)
      .where(eq(schema.users.id, targetUserId))
      .returning();

    await writeAuditLog({
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

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
