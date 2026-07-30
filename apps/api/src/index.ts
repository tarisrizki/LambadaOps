import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initEnv, getEnv } from './lib/env.js';
import { HTTPException } from 'hono/http-exception';

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Validate env at startup — app refuses to start with invalid configuration
initEnv();

const env = getEnv();

// ─── App ──────────────────────────────────────────────────────────────────────
const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Required for Vercel health checks and UptimeRobot keep-alive pings.
app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ─── API Routes ──────────────────────────────────────────────────────────────
import { authRoutes } from './routes/auth.routes.js';
import { assetRouter } from './routes/asset.route.js';
import { webhookRoutes } from './routes/webhook.routes.js';
import { maintenanceRouter } from './routes/maintenance.route.js';
import { ticketRouter } from './routes/ticket.route.js';
import { importRouter } from './routes/import.route.js';
import { notificationRouter } from './routes/notification.route.js';
import { exportRouter } from './routes/export.route.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/assets', assetRouter)
  .route('/api/maintenance', maintenanceRouter)
  .route('/api/tickets', ticketRouter)
  .route('/api/import', importRouter)
  .route('/api/export', exportRouter)
  .route('/api/notifications', notificationRouter)
  .route('/api/webhooks', webhookRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ statusCode: 404, message: 'Not Found' }, 404));

// ─── Error Handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error('[unhandled error]', err);
  return c.json({ statusCode: 500, message: 'Internal Server Error' }, 500);
});

// ─── Exports ──────────────────────────────────────────────────────────────────
// AppType is consumed by apps/web via hono/client for end-to-end type safety.
export type AppType = typeof routes;

// Default export required by Vercel Functions runtime.
export default app;
