import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import type { Env } from './types';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/company';
import { userRoutes } from './routes/users';
import { departmentRoutes } from './routes/departments';
import { goalRoutes } from './routes/goals';
import { trackingRoutes } from './routes/tracking';
import { financialRoutes } from './routes/financial';
import { productRoutes } from './routes/products';
import { personalKpiRoutes } from './routes/personal-kpi';
import { rewardRoutes } from './routes/rewards';
import { notificationRoutes } from './routes/notifications';
import { activityRoutes } from './routes/activity';
import { commentRoutes } from './routes/comments';
import { reportRoutes } from './routes/reports';
import { authMiddleware } from './middleware/auth';

const app = new Hono<{ Bindings: Env }>();

app.use('*', poweredBy());
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true,
}));

// Public routes (no auth required)
app.route('/api/auth', authRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

// Protected routes
app.use('/api/*', authMiddleware());

// Company routes
app.route('/api/company', companyRoutes);

// User routes
app.route('/api/users', userRoutes);
app.route('/api/departments', departmentRoutes);

// Goal routes
app.route('/api/goals', goalRoutes);

// Tracking routes
app.route('/api/tracking', trackingRoutes);

// Financial routes
app.route('/api/financial', financialRoutes);

// Product routes
app.route('/api/products', productRoutes);

// Personal KPI routes
app.route('/api/personal-kpi', personalKpiRoutes);

// Reward approval routes
app.route('/api/reward-approvals', rewardRoutes);

// Notification routes
app.route('/api/notifications', notificationRoutes);

// Activity feed routes
app.route('/api/activity-feed', activityRoutes);

// Comment routes
app.route('/api/comments', commentRoutes);

// Report routes
app.route('/api/reports', reportRoutes);

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ success: false, error: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

export default app;
export { app };
