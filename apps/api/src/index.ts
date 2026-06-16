import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { authRoutes } from './routes/auth'
import { companyRoutes } from './routes/company'
import { userRoutes } from './routes/users'
import { departmentRoutes } from './routes/departments'
import { goalRoutes } from './routes/goals'
import { trackingRoutes } from './routes/tracking'
import { financialRoutes } from './routes/financial'
import { productRoutes } from './routes/products'
import { personalKpiRoutes } from './routes/personal-kpi'
import { rewardRoutes } from './routes/rewards'
import { notificationRoutes } from './routes/notifications'
import { activityRoutes } from './routes/activity'
import { commentRoutes } from './routes/comments'
import { reportRoutes } from './routes/reports'

// Type for authenticated context
type AuthContext = {
  Variables: {
    userId: string
    companyId: string
    role: string
    deviceId: string
  }
}

const app = new Hono<AuthContext>()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

// Public routes (no auth required)
app.route('/api/auth', authRoutes)

// Protected routes middleware
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const { verifyToken } = await import('./utils/jwt')
    const payload = await verifyToken(token)
    if (!payload) {
      return c.json({ success: false, error: 'Invalid token' }, 401)
    }
    c.set('userId', payload.userId)
    c.set('companyId', payload.companyId)
    c.set('role', payload.role)
    c.set('deviceId', payload.deviceId)
    await next()
  } catch (err) {
    console.error('Auth error:', err)
    return c.json({ success: false, error: 'Invalid token' }, 401)
  }
})

// Protected routes
app.route('/api/company', companyRoutes)
app.route('/api/users', userRoutes)
app.route('/api/departments', departmentRoutes)
app.route('/api/goals', goalRoutes)
app.route('/api/tracking', trackingRoutes)
app.route('/api/financial', financialRoutes)
app.route('/api/products', productRoutes)
app.route('/api/personal-kpi', personalKpiRoutes)
app.route('/api/reward-approvals', rewardRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/activity-feed', activityRoutes)
app.route('/api/comments', commentRoutes)
app.route('/api/reports', reportRoutes)

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ success: false, error: err.message || 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3001', 10)

console.log(`🚀 API Server starting on port ${port}...`)

serve({
  fetch: app.fetch,
  port,
})

console.log(`✅ API Server running on http://localhost:${port}`)

export default app