import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, isNull } from 'drizzle-orm';
import { parseMentions } from '../utils/progress';
import type { AuthContext } from '../index';

export const commentRoutes = new Hono<AuthContext>();

// Get comments for a goal
commentRoutes.get('/goals/:id/comments', async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const role = c.get('role') as string;
    const goalId = c.req.param('id');

    if (role === 'finance') {
      return c.json({ success: false, error: 'Finance không có quyền truy cập' }, 403);
    }

    const comments = await db
      .select({
        id: schema.goalComments.id,
        goalId: schema.goalComments.goalId,
        companyId: schema.goalComments.companyId,
        authorId: schema.goalComments.authorId,
        content: schema.goalComments.content,
        mentions: schema.goalComments.mentions,
        createdAt: schema.goalComments.createdAt,
        updatedAt: schema.goalComments.updatedAt,
        deletedAt: schema.goalComments.deletedAt,
        authorName: schema.users.name,
      })
      .from(schema.goalComments)
      .leftJoin(schema.users, eq(schema.goalComments.authorId, schema.users.id))
      .where(and(eq(schema.goalComments.goalId, goalId), isNull(schema.goalComments.deletedAt)));

    return c.json({ success: true, data: comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Add comment to a goal [C24]
commentRoutes.post('/goals/:id/comments', async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const userId = c.get('userId') as string;
    const goalId = c.req.param('id');
    const { content } = await c.req.json();

    if (!content || content.trim().length === 0) {
      return c.json({ success: false, error: 'Nội dung bình luận là bắt buộc' }, 400);
    }

    // Verify goal exists
    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Parse mentions [C24]
    const mentions = parseMentions(content);

    const commentId = crypto.randomUUID();
    const now = new Date();

    await db.insert(schema.goalComments).values({
      id: commentId,
      goalId: goalId,
      companyId: companyId,
      authorId: userId,
      content: content,
      mentions: mentions,
      createdAt: now,
      updatedAt: now,
    });

    // Create notifications for mentioned users [C19]
    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        // Check if user exists in company
        const mentionedUser = await db.query.users.findFirst({
          where: and(eq(schema.users.id, mentionedUserId), eq(schema.users.companyId, companyId)),
        });

        if (mentionedUser) {
          await db.insert(schema.notifications).values({
            id: crypto.randomUUID(),
            companyId: companyId,
            userId: mentionedUserId,
            type: 'mention',
            title: 'Bạn được nhắc đến trong bình luận',
            content: `Nhắc đến bạn trong "${goal.title}"`,
            entityType: 'comment',
            entityId: commentId,
            isRead: 0,
            createdAt: now,
          });
        }
      }
    }

    // Add to activity feed
    await db.insert(schema.activityFeed).values({
      id: crypto.randomUUID(),
      companyId: companyId,
      actorId: userId,
      actorName: userId,
      action: 'comment_added',
      entityType: 'comment',
      entityId: commentId,
      entityTitle: goal.title,
      createdAt: now,
    });

    const comment = await db
      .select({
        id: schema.goalComments.id,
        goalId: schema.goalComments.goalId,
        companyId: schema.goalComments.companyId,
        authorId: schema.goalComments.authorId,
        content: schema.goalComments.content,
        mentions: schema.goalComments.mentions,
        createdAt: schema.goalComments.createdAt,
        updatedAt: schema.goalComments.updatedAt,
        authorName: schema.users.name,
      })
      .from(schema.goalComments)
      .leftJoin(schema.users, eq(schema.goalComments.authorId, schema.users.id))
      .where(eq(schema.goalComments.id, commentId));

    return c.json({ success: true, data: comment[0] }, 201);
  } catch (err) {
    console.error('Add comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update comment (author only, within 5 minutes)
commentRoutes.put('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const commentId = c.req.param('id');
    const { content } = await c.req.json();

    const comment = await db.query.goalComments.findFirst({
      where: and(eq(schema.goalComments.id, commentId), eq(schema.goalComments.authorId, userId)),
    });

    if (!comment) {
      return c.json({ success: false, error: 'Bình luận không tồn tại hoặc bạn không có quyền sửa' }, 404);
    }

    // Check 5-minute window
    const ageMinutes = (Date.now() - comment.createdAt.getTime()) / 1000 / 60;
    if (ageMinutes > 5) {
      return c.json({ success: false, error: 'Chỉ có thể sửa bình luận trong 5 phút đầu' }, 400);
    }

    const mentions = parseMentions(content);

    await db
      .update(schema.goalComments)
      .set({ content: content, mentions: mentions, updatedAt: new Date() })
      .where(eq(schema.goalComments.id, commentId));

    const updated = await db.query.goalComments.findFirst({
      where: eq(schema.goalComments.id, commentId),
    });

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Delete comment (soft delete)
commentRoutes.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const role = c.get('role') as string;
    const commentId = c.req.param('id');

    const comment = await db.query.goalComments.findFirst({
      where: eq(schema.goalComments.id, commentId),
    });

    if (!comment) {
      return c.json({ success: false, error: 'Bình luận không tồn tại' }, 404);
    }

    // Only author or admin can delete
    if (comment.authorId !== userId && role !== 'admin') {
      return c.json({ success: false, error: 'Bạn không có quyền xóa bình luận này' }, 403);
    }

    await db
      .update(schema.goalComments)
      .set({ deletedAt: new Date() })
      .where(eq(schema.goalComments.id, commentId));

    return c.json({ success: true });
  } catch (err) {
    console.error('Delete comment error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
