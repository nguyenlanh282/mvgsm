import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

export const companyRoutes = new Hono<AuthContext>();

// Get company info
companyRoutes.get('/', async (c) => {
  try {
    const companyId = c.get('companyId');

    const company = await db.query.companies.findFirst({
      where: eq(schema.companies.id, companyId),
    });

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
    const companyId = c.get('companyId');
    const updates = await c.req.json();

    const setData: Partial<{
      name: string;
      mission: string | null;
      vision: string | null;
      coreValues: string | null;
      rewardPolicy: string | null;
      updatedAt: Date;
    }> = {};

    if (updates.name !== undefined) {
      setData.name = updates.name;
    }
    if (updates.mission !== undefined) {
      setData.mission = updates.mission;
    }
    if (updates.vision !== undefined) {
      setData.vision = updates.vision;
    }
    if (updates.core_values !== undefined) {
      setData.coreValues = updates.core_values;
    }
    if (updates.reward_policy !== undefined) {
      setData.rewardPolicy = updates.reward_policy;
    }

    if (Object.keys(setData).length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    setData.updatedAt = new Date();

    const [updated] = await db.update(schema.companies)
      .set(setData)
      .where(eq(schema.companies.id, companyId))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update company error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
