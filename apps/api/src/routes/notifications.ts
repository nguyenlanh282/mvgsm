import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import type { AuthContext } from '../index';

export const notificationRoutes = new Hono<AuthContext>();

// Get notifications for current user
notificationRoutes.get('/', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const companyId = c.get('companyId') as string;
    const { is_read, limit } = c.req.query();

    const conditions = [
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.companyId, companyId),
    ];

    if (is_read !== undefined) {
      conditions.push(eq(schema.notifications.isRead, is_read === 'true' ? 1 : 0));
    }

    let notifications;
    if (limit) {
      notifications = await db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt))
        .limit(parseInt(limit));
    } else {
      notifications = await db
        .select()
        .from(schema.notifications)
        .where(and(...conditions))
        .orderBy(desc(schema.notifications.createdAt));
    }

    return c.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Get unread count
notificationRoutes.get('/count-unread', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const result = await db
      .select({ count: schema.notifications.id })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, 0)));

    return c.json({ success: true, data: { count: result.length } });
  } catch (err) {
    console.error('Get unread count error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Mark as read
notificationRoutes.put('/:id/read', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const notificationId = c.req.param('id');

    await db
      .update(schema.notifications)
      .set({ isRead: 1 })
      .where(and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId)));

    return c.json({ success: true });
  } catch (err) {
    console.error('Mark as read error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Mark all as read
notificationRoutes.put('/read-all', async (c) => {
  try {
    const userId = c.get('userId') as string;

    await db
      .update(schema.notifications)
      .set({ isRead: 1 })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, 0)));

    return c.json({ success: true });
  } catch (err) {
    console.error('Mark all as read error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
