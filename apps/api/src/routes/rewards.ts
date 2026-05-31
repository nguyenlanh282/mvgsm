import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { requireAdmin, requireAdminOrManager } from '../middleware/roles';
import { writeAuditLog } from '../utils/audit';
import type { Env } from '../types';

export const rewardRoutes = new Hono<{ Bindings: Env }>();

// Get reward approvals
rewardRoutes.get('/', requireAdminOrManager(), async (c) => {
  try {
    const { companyId, role } = getUser(c);
    const { status } = c.req.query();

    let query = `
      SELECT ra.*, g.title as goal_title, g.category, u.name as requester_name
      FROM reward_approvals ra
      JOIN goals g ON ra.goal_id = g.id
      JOIN users u ON ra.requested_by = u.id
      WHERE ra.company_id = ?
    `;
    const params: (string | number)[] = [companyId];

    if (status) {
      query += ' AND ra.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ra.requested_at DESC';

    const approvals = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: approvals.results });
  } catch (err) {
    console.error('Get reward approvals error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Request reward - Trưởng BP đề nghị [C10]
rewardRoutes.post('/goals/:id/request', requireAdminOrManager(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const goalId = c.req.param('id');
    const { reward_description, reward_value } = await c.req.json();

    // Verify goal exists and belongs to company
    const goal = await c.env.DB.prepare(
      'SELECT * FROM goals WHERE id = ? AND company_id = ?'
    ).bind(goalId, companyId).first();

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Check if goal has reward attached
    if (!goal.reward && !reward_description) {
      return c.json({ success: false, error: 'Mục tiêu này không có phần thưởng' }, 400);
    }

    // Check if there's already a pending request [C13]
    const pending = await c.env.DB.prepare(`
      SELECT id FROM reward_approvals WHERE goal_id = ? AND status = 'pending'
    `).bind(goalId).first();

    if (pending) {
      return c.json({ success: false, error: 'Đã có đề nghị đang chờ duyệt' }, 409);
    }

    const approvalId = crypto.randomUUID();
    const now = Date.now();

    await c.env.DB.prepare(`
      INSERT INTO reward_approvals (
        id, goal_id, company_id, requested_by, requested_at, status,
        reward_description, reward_value
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      approvalId, goalId, companyId, userId, now,
      reward_description || goal.reward,
      reward_value || goal.reward_value
    ).run();

    // Create notification for admin [C19]
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) SELECT
        ?, ?, u.id, 'reward_request',
        'Yêu cầu phê duyệt phần thưởng mới',
        ?, 'reward_approval', ?, 0, ?
      FROM users u WHERE u.role = 'admin' AND u.company_id = ?
    `).bind(
      crypto.randomUUID(), companyId,
      `Yêu cầu phê duyệt phần thưởng cho mục tiêu: ${goal.title}`,
      approvalId, now, companyId
    ).run();

    // Write to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_requested', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, goal.title, now).run();

    // Audit log [C2]
    await writeAuditLog(c.env, {
      companyId,
      entityType: 'financial',
      entityId: approvalId,
      action: 'reward_requested',
      userId,
      userName: userId,
      newValue: { goal_id: goalId, reward_description: reward_description || goal.reward },
    });

    const approval = await c.env.DB.prepare('SELECT * FROM reward_approvals WHERE id = ?').bind(approvalId).first();

    return c.json({ success: true, data: approval }, 201);
  } catch (err) {
    console.error('Request reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Approve reward [C10]
rewardRoutes.put('/:id/approve', requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const approvalId = c.req.param('id');

    const approval = await c.env.DB.prepare(
      'SELECT * FROM reward_approvals WHERE id = ? AND company_id = ?'
    ).bind(approvalId, companyId).first();

    if (!approval) {
      return c.json({ success: false, error: 'Yêu cầu không tồn tại' }, 404);
    }

    if (approval.status !== 'pending') {
      return c.json({ success: false, error: 'Yêu cầu này đã được xử lý' }, 400);
    }

    const now = Date.now();

    await c.env.DB.prepare(`
      UPDATE reward_approvals SET status = 'approved', reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `).bind(userId, now, approvalId).run();

    // Notify requester [C19]
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) VALUES (?, ?, ?, 'reward_approved', 'Phần thưởng đã được duyệt!', ?, 'reward_approval', ?, 0, ?)
    `).bind(
      crypto.randomUUID(), companyId, approval.requested_by,
      `Phần thưởng cho mục tiêu đã được duyệt`, approvalId, now
    ).run();

    // Update goal to show reward claimed [C10]
    await c.env.DB.prepare(`
      UPDATE goals SET updated_at = ? WHERE id = ?
    `).bind(now, approval.goal_id).run();

    // Write to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_approved', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, approval.goal_title || 'Goal', now).run();

    // Audit log [C2][C18]
    await writeAuditLog(c.env, {
      companyId,
      entityType: 'financial',
      entityId: approvalId,
      action: 'reward_approved',
      userId,
      userName: userId,
      newValue: { status: 'approved' },
      isCritical: true,
    });

    const updated = await c.env.DB.prepare('SELECT * FROM reward_approvals WHERE id = ?').bind(approvalId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Approve reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Reject reward [C10]
rewardRoutes.put('/:id/reject', requireAdmin(), async (c) => {
  try {
    const { companyId, userId } = getUser(c);
    const approvalId = c.req.param('id');
    const { reason } = await c.req.json();

    if (!reason) {
      return c.json({ success: false, error: 'Lý do từ chối là bắt buộc' }, 400);
    }

    const approval = await c.env.DB.prepare(
      'SELECT * FROM reward_approvals WHERE id = ? AND company_id = ?'
    ).bind(approvalId, companyId).first();

    if (!approval) {
      return c.json({ success: false, error: 'Yêu cầu không tồn tại' }, 404);
    }

    if (approval.status !== 'pending') {
      return c.json({ success: false, error: 'Yêu cầu này đã được xử lý' }, 400);
    }

    const now = Date.now();

    await c.env.DB.prepare(`
      UPDATE reward_approvals SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, reject_reason = ?
      WHERE id = ?
    `).bind(userId, now, reason, approvalId).run();

    // Notify requester [C19]
    await c.env.DB.prepare(`
      INSERT INTO notifications (
        id, company_id, user_id, type, title, content, entity_type, entity_id, is_read, created_at
      ) VALUES (?, ?, ?, 'reward_rejected', 'Phần thưởng bị từ chối', ?, 'reward_approval', ?, 0, ?)
    `).bind(
      crypto.randomUUID(), companyId, approval.requested_by,
      `Lý do: ${reason}`, approvalId, now
    ).run();

    // Write to activity feed
    await c.env.DB.prepare(`
      INSERT INTO activity_feed (id, company_id, actor_id, actor_name, action, entity_type, entity_id, entity_title, created_at)
      VALUES (?, ?, ?, ?, 'reward_rejected', 'reward_approval', ?, ?, ?)
    `).bind(crypto.randomUUID(), companyId, userId, userId, approvalId, approval.goal_title || 'Goal', now).run();

    // Audit log [C2][C18]
    await writeAuditLog(c.env, {
      companyId,
      entityType: 'financial',
      entityId: approvalId,
      action: 'reward_rejected',
      userId,
      userName: userId,
      oldValue: { status: 'pending' },
      newValue: { status: 'rejected', reason },
      isCritical: true,
    });

    const updated = await c.env.DB.prepare('SELECT * FROM reward_approvals WHERE id = ?').bind(approvalId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reject reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
