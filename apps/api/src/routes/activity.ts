import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import type { AuthContext } from '../index';

export const activityRoutes = new Hono<AuthContext>();

// Get activity feed
activityRoutes.get('/', async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const { limit, page } = c.req.query();

    const pageSize = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * pageSize;

    const activities = await db
      .select()
      .from(schema.activityFeed)
      .where(eq(schema.activityFeed.companyId, companyId))
      .orderBy(desc(schema.activityFeed.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: schema.activityFeed.id })
      .from(schema.activityFeed)
      .where(eq(schema.activityFeed.companyId, companyId));

    return c.json({
      success: true,
      data: {
        items: activities,
        total: totalResult.length,
        page: pageNum,
        pageSize,
      },
    });
  } catch (err) {
    console.error('Get activity feed error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
