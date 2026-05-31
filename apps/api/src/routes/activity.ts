import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import type { Env } from '../types';

export const activityRoutes = new Hono<{ Bindings: Env }>();

// Get activity feed
activityRoutes.get('/', async (c) => {
  try {
    const { companyId } = getUser(c);
    const { limit, page } = c.req.query();

    const pageSize = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * pageSize;

    const activities = await c.env.DB.prepare(`
      SELECT * FROM activity_feed
      WHERE company_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(companyId, pageSize, offset).all();

    // Get total count
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM activity_feed WHERE company_id = ?
    `).bind(companyId).first<{ total: number }>();

    return c.json({
      success: true,
      data: {
        items: activities.results,
        total: totalResult?.total || 0,
        page: pageNum,
        pageSize,
      },
    });
  } catch (err) {
    console.error('Get activity feed error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
