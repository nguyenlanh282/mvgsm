import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import type { Env } from '../types';

export const notificationRoutes = new Hono<{ Bindings: Env }>();

// Get notifications for current user
notificationRoutes.get('/', async (c) => {
  try {
    const { userId, companyId } = getUser(c);
    const { is_read, limit } = c.req.query();

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ? AND company_id = ?
    `;
    const params: (string | number)[] = [userId, companyId];

    if (is_read !== undefined) {
      query += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const notifications = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: notifications.results });
  } catch (err) {
    console.error('Get notifications error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get unread count
notificationRoutes.get('/count-unread', async (c) => {
  try {
    const { userId } = getUser(c);

    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first<{ count: number }>();

    return c.json({ success: true, data: { count: result?.count || 0 } });
  } catch (err) {
    console.error('Get unread count error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Mark as read
notificationRoutes.put('/:id/read', async (c) => {
  try {
    const { userId } = getUser(c);
    const notificationId = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();

    return c.json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Mark all as read
notificationRoutes.put('/read-all', async (c) => {
  try {
    const { userId } = getUser(c);

    await c.env.DB.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();

    return c.json({ success: true });
  } catch (err) {
    console.error('Mark all as read error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
