import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { writeAuditLog } from '../utils/audit';
import type { AuthContext } from '../index';

const requireAdminOrManager = () => async (c: any, next: any) => {
  const role = c.get('role');
  if (role !== 'admin' && role !== 'manager') {
    return c.json({ success: false, error: 'Không có quyền' }, 403);
  }
  await next();
};

const requireAdmin = () => async (c: any, next: any) => {
  const role = c.get('role');
  if (role !== 'admin') {
    return c.json({ success: false, error: 'Không có quyền' }, 403);
  }
  await next();
};

export const rewardRoutes = new Hono<AuthContext>();

// Get reward approvals
rewardRoutes.get('/', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const { status } = c.req.query();

    let conditions = [eq(schema.rewardApprovals.companyId, companyId)];
    if (status) {
      conditions.push(eq(schema.rewardApprovals.status, status as 'pending' | 'approved' | 'rejected'));
    }

    const approvals = await db
      .select({
        id: schema.rewardApprovals.id,
        goalId: schema.rewardApprovals.goalId,
        companyId: schema.rewardApprovals.companyId,
        requestedBy: schema.rewardApprovals.requestedBy,
        requestedAt: schema.rewardApprovals.requestedAt,
        status: schema.rewardApprovals.status,
        reviewedBy: schema.rewardApprovals.reviewedBy,
        reviewedAt: schema.rewardApprovals.reviewedAt,
        rejectReason: schema.rewardApprovals.rejectReason,
        rewardDescription: schema.rewardApprovals.rewardDescription,
        rewardValue: schema.rewardApprovals.rewardValue,
        goalTitle: schema.goals.title,
        category: schema.goals.category,
        requesterName: schema.users.name,
      })
      .from(schema.rewardApprovals)
      .leftJoin(schema.goals, eq(schema.rewardApprovals.goalId, schema.goals.id))
      .leftJoin(schema.users, eq(schema.rewardApprovals.requestedBy, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.rewardApprovals.requestedAt));

    return c.json({ success: true, data: approvals });
  } catch (err) {
    console.error('Get reward approvals error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Request reward - Trưởng BP đề nghị [C10]
rewardRoutes.post('/goals/:id/request', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const userId = c.get('userId') as string;
    const goalId = c.req.param('id');
    const { reward_description, reward_value } = await c.req.json();

    // Verify goal exists and belongs to company
    const goal = await db.query.goals.findFirst({
      where: and(eq(schema.goals.id, goalId), eq(schema.goals.companyId, companyId)),
    });

    if (!goal) {
      return c.json({ success: false, error: 'Mục tiêu không tồn tại' }, 404);
    }

    // Check if goal has reward attached
    if (!goal.reward && !reward_description) {
      return c.json({ success: false, error: 'Mục tiêu này không có phần thưởng' }, 400);
    }

    // Check if there's already a pending request [C13]
    const pending = await db.query.rewardApprovals.findFirst({
      where: and(eq(schema.rewardApprovals.goalId, goalId), eq(schema.rewardApprovals.status, 'pending')),
    });

    if (pending) {
      return c.json({ success: false, error: 'Đã có đề nghị đang chờ duyệt' }, 409);
    }

    const approvalId = crypto.randomUUID();
    const now = new Date();

    await db.insert(schema.rewardApprovals).values({
      id: approvalId,
      goalId: goalId,
      companyId: companyId,
      requestedBy: userId,
      requestedAt: now,
      status: 'pending',
      rewardDescription: reward_description || goal.reward,
      rewardValue: reward_value || goal.rewardValue,
    });

    // Create notification for admin [C19]
    const admins = await db.query.users.findMany({
      where: and(eq(schema.users.role, 'admin'), eq(schema.users.companyId, companyId)),
    });

    for (const admin of admins) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(),
        companyId: companyId,
        userId: admin.id,
        type: 'reward_request',
        title: 'Yêu cầu phê duyệt phần thưởng mới',
        content: `Yêu cầu phê duyệt phần thưởng cho mục tiêu: ${goal.title}`,
        entityType: 'reward_approval',
        entityId: approvalId,
        isRead: 0,
        createdAt: now,
      });
    }

    // Create notification for manager
    const managers = await db.query.users.findMany({
      where: and(eq(schema.users.role, 'manager'), eq(schema.users.companyId, companyId)),
    });

    for (const manager of managers) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(),
        companyId: companyId,
        userId: manager.id,
        type: 'reward_request',
        title: 'Yêu cầu phê duyệt phần thưởng mới',
        content: `Yêu cầu phê duyệt phần thưởng cho mục tiêu: ${goal.title}`,
        entityType: 'reward_approval',
        entityId: approvalId,
        isRead: 0,
        createdAt: now,
      });
    }

    // Write to activity feed
    await db.insert(schema.activityFeed).values({
      id: crypto.randomUUID(),
      companyId: companyId,
      actorId: userId,
      actorName: userId,
      action: 'reward_requested',
      entityType: 'reward_approval',
      entityId: approvalId,
      entityTitle: goal.title,
      createdAt: now,
    });

    // Audit log [C2]
    await writeAuditLog({
      companyId,
      entityType: 'financial',
      entityId: approvalId,
      action: 'reward_requested',
      userId,
      userName: userId,
      newValue: { goal_id: goalId, reward_description: reward_description || goal.reward },
    });

    const approval = await db.query.rewardApprovals.findFirst({
      where: eq(schema.rewardApprovals.id, approvalId),
    });

    return c.json({ success: true, data: approval }, 201);
  } catch (err) {
    console.error('Request reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Approve reward [C10]
rewardRoutes.put('/:id/approve', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const userId = c.get('userId') as string;
    const approvalId = c.req.param('id');

    const approval = await db.query.rewardApprovals.findFirst({
      where: and(eq(schema.rewardApprovals.id, approvalId), eq(schema.rewardApprovals.companyId, companyId)),
    });

    if (!approval) {
      return c.json({ success: false, error: 'Yêu cầu không tồn tại' }, 404);
    }

    if (approval.status !== 'pending') {
      return c.json({ success: false, error: 'Yêu cầu này đã được xử lý' }, 400);
    }

    const now = new Date();

    await db
      .update(schema.rewardApprovals)
      .set({ status: 'approved', reviewedBy: userId, reviewedAt: now })
      .where(eq(schema.rewardApprovals.id, approvalId));

    // Notify requester [C19]
    if (approval.requestedBy) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(),
        companyId: companyId,
        userId: approval.requestedBy,
        type: 'reward_approved',
        title: 'Phần thưởng đã được duyệt!',
        content: 'Phần thưởng cho mục tiêu đã được duyệt',
        entityType: 'reward_approval',
        entityId: approvalId,
        isRead: 0,
        createdAt: now,
      });
    }

    // Update goal to show reward claimed [C10]
    if (approval.goalId) {
      await db
        .update(schema.goals)
        .set({ updatedAt: now })
        .where(eq(schema.goals.id, approval.goalId));
    }

    // Write to activity feed
    await db.insert(schema.activityFeed).values({
      id: crypto.randomUUID(),
      companyId: companyId,
      actorId: userId,
      actorName: userId,
      action: 'reward_approved',
      entityType: 'reward_approval',
      entityId: approvalId,
      entityTitle: approval.goalId || 'Reward Approval',
      createdAt: now,
    });

    // Audit log [C2][C18]
    await writeAuditLog({
      companyId,
      entityType: 'financial',
      entityId: approvalId,
      action: 'reward_approved',
      userId,
      userName: userId,
      newValue: { status: 'approved' },
      isCritical: true,
    });

    const updated = await db.query.rewardApprovals.findFirst({
      where: eq(schema.rewardApprovals.id, approvalId),
    });

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Approve reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Reject reward [C10]
rewardRoutes.put('/:id/reject', requireAdmin(), async (c) => {
  try {
    const companyId = c.get('companyId') as string;
    const userId = c.get('userId') as string;
    const approvalId = c.req.param('id');
    const { reason } = await c.req.json();

    if (!reason) {
      return c.json({ success: false, error: 'Lý do từ chối là bắt buộc' }, 400);
    }

    const approval = await db.query.rewardApprovals.findFirst({
      where: and(eq(schema.rewardApprovals.id, approvalId), eq(schema.rewardApprovals.companyId, companyId)),
    });

    if (!approval) {
      return c.json({ success: false, error: 'Yêu cầu không tồn tại' }, 404);
    }

    if (approval.status !== 'pending') {
      return c.json({ success: false, error: 'Yêu cầu này đã được xử lý' }, 400);
    }

    const now = new Date();

    await db
      .update(schema.rewardApprovals)
      .set({ status: 'rejected', reviewedBy: userId, reviewedAt: now, rejectReason: reason })
      .where(eq(schema.rewardApprovals.id, approvalId));

    // Notify requester [C19]
    if (approval.requestedBy) {
      await db.insert(schema.notifications).values({
        id: crypto.randomUUID(),
        companyId: companyId,
        userId: approval.requestedBy,
        type: 'reward_rejected',
        title: 'Phần thưởng bị từ chối',
        content: `Lý do: ${reason}`,
        entityType: 'reward_approval',
        entityId: approvalId,
        isRead: 0,
        createdAt: now,
      });
    }

    // Write to activity feed
    await db.insert(schema.activityFeed).values({
      id: crypto.randomUUID(),
      companyId: companyId,
      actorId: userId,
      actorName: userId,
      action: 'reward_rejected',
      entityType: 'reward_approval',
      entityId: approvalId,
      entityTitle: approval.goalId || 'Reward Approval',
      createdAt: now,
    });

    // Audit log [C2][C18]
    await writeAuditLog({
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

    const updated = await db.query.rewardApprovals.findFirst({
      where: eq(schema.rewardApprovals.id, approvalId),
    });

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Reject reward error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
