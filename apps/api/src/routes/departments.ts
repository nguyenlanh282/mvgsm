import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { requireAdminOrManager, requireAdmin } from '../utils/roles';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

export const departmentRoutes = new Hono<AuthContext>();

// Get all departments
departmentRoutes.get('/', async (c) => {
  try {
    const companyId = c.get('companyId');

    const departments = await db.query.departments.findMany({
      where: eq(schema.departments.companyId, companyId),
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });

    // Get manager names
    const managerIds = departments.map(d => d.managerId).filter(Boolean);
    const managers = managerIds.length > 0
      ? await db.query.users.findMany({
          where: eq(schema.users.id, managerIds[0]),
        })
      : [];

    const result = departments.map(dept => {
      const manager = managers.find(m => m.id === dept.managerId);
      return {
        ...dept,
        manager_name: manager?.name || null,
      };
    });

    return c.json({ success: true, data: result });
  } catch (err) {
    console.error('Get departments error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create department
departmentRoutes.post('/', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const { name, manager_id } = await c.req.json();

    if (!name) {
      return c.json({ success: false, error: 'Tên phòng ban là bắt buộc' }, 400);
    }

    const [dept] = await db.insert(schema.departments).values({
      companyId,
      name,
      managerId: manager_id || null,
    }).returning();

    return c.json({ success: true, data: dept }, 201);
  } catch (err) {
    console.error('Create department error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update department
departmentRoutes.put('/:id', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const deptId = c.req.param('id');
    const { name, manager_id } = await c.req.json();

    const existing = await db.query.departments.findFirst({
      where: eq(schema.departments.id, deptId),
    });

    if (!existing || existing.companyId !== companyId) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    const setData: Partial<{
      name: string;
      managerId: string | null;
    }> = {};

    if (name !== undefined) {
      setData.name = name;
    }
    if (manager_id !== undefined) {
      setData.managerId = manager_id || null;
    }

    if (Object.keys(setData).length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    const [updated] = await db.update(schema.departments)
      .set(setData)
      .where(eq(schema.departments.id, deptId))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update department error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Reassign manager [C22]
departmentRoutes.put('/:id/manager', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const deptId = c.req.param('id');
    const { manager_id } = await c.req.json();

    const existing = await db.query.departments.findFirst({
      where: eq(schema.departments.id, deptId),
    });

    if (!existing || existing.companyId !== companyId) {
      return c.json({ success: false, error: 'Phòng ban không tồn tại' }, 404);
    }

    const [updated] = await db.update(schema.departments)
      .set({ managerId: manager_id || null })
      .where(eq(schema.departments.id, deptId))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reassign manager error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
