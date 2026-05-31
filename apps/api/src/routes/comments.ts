import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { parseMentions } from '../utils/progress';
import type { Env } from '../types';

export const commentRoutes = new Hono<{ Bindings: Env }>();

// Get comments for a goal
commentRoutes.get('/goals/:id/comments', async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const goalId = c.req.param('id');

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    const comments = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM goal_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.goal_id = ? AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
    `).bind(goalId).all();

    return c.json({ success: true, data: comments.results });
  } catch (err) {
    console.error('Get comments error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Add comment to a goal [C24]
commentRoutes.post('/goals/:id/comments', async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');
    const { content } = await c.req.json();

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'Nội dung bình luận là bắt buộc' }, 400);
    }

    // Verify goal exists
    const goal = await c.env.DB.prepare(
      'SELECT id, title FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Parse mentions [C24]
    const mentions = parseMentions(content);

    const commentId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO goal_comments (id, goal_id, company_id, author_id, content, mentions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(commentId, goalId, companyId, userId, content, JSON.stringify(mentions), now, now).run();

    // Create notifications for mentioned users [C19]
    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        // Check if user exists in company
        const mentionedUser = await c.env.DB.prepare(`
          SELECT id FROM users WHERE id = ? AND company_id = ?
        `).bind(mentionedUserId, companyId).first();

        if (mentionedUser) {
          await c.env.DB.prepare(`
            INSERT INTO notifications (
              id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
            ) VALUES (?, ?, ?, 'mention', 'Bạn được nhắc đến trong bình luận', ?, 'comment', ?, 0, ?)
          `).bind(
            crypto.randomUUID(), companyId, mentionedUserId,
            `Nhắc đến bạn trong "${goal.title}"`, commentId, now
          ).run();
        }
      }
    }

    // Add to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'comment_added', 'comment', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, commentId, goal.title, now).run();

    const comment = await c.env.DB.prepare(`
      SELECT c.*, u.name as author_name
      FROM goal_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).bind(commentId).first();

    return c.json({ success: true, data: comment }, 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update comment (author only, within 5 minutes)
commentRoutes.put('/:id', async (c) => {
  try {
    const { userId } = getUser(c);
    const commentId = c.req.param('id');
    const { content } = await c.req.json();

    const comment = await c.env.DB.prepare(
      'SELECT * FROM goal_comments WHERE id = ? AND author_id = ?'
    ).bind(commentId, userId).first();

    if (!comment) {
      return c.json({ success: false, error: 'Bình luận không tồn tại hoặc bạn không có quyền sửa' }, 404);
    }

    // Check 5-minute window
    const ageMinutes = (Date.now() - comment.created_at) / 1000 / 60;
    if (ageMinutes > 5) {
      return c.json({ success: false, error: 'Chỉ có thể sửa bình luận trong 5 phút đầu' }, 400);
    }

    const mentions = parseMentions(content);

    await c.env.DB.prepare(`
      UPDATE goal_comments SET content = ?, mentions = ?, updated_at = ?
      WHERE id = ?
    `).bind(content, JSON.stringify(mentions), Date.now(), commentId).run();

    const updated = await c.env.DB.prepare('SELECT * FROM goal_comments WHERE id = ?').bind(commentId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Delete comment (soft delete)
commentRoutes.delete('/:id', async (c) => {
  try {
    const { userId, role } = getUser(c);
    const commentId = c.req.param('id');

    const comment = await c.env.DB.prepare(
      'SELECT * FROM goal_comments WHERE id = ?'
    ).bind(commentId).first();

    if (!comment) {
      return c.json({ success: false, error: 'Bình luận không tồn tại' }, 404);
    }

    // Only author or admin can delete
    if (comment.author_id !== userId && role !== 'admin') {
      return c.json({ success: false, error: 'Bạn không có quyền xóa bình luận này' }, 403);
    }

    await c.env.DB.prepare(`
      UPDATE goal_comments SET deleted_at = ? WHERE id = ?
    `).bind(Date.now(), commentId).run();

    return c.json({ success: true });
  } catch (err) {
    console.error('Delete comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
