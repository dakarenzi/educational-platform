// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes, type AppContext } from './user-routes';
import { Env, GlobalDurableObject } from './core-utils';
// Need to export GlobalDurableObject to make it available in wrangler
export { GlobalDurableObject };
export interface ClientErrorReport {
    message: string;
    url: string;
    userAgent: string;
    timestamp: string;
    stack?: string;
    componentStack?: string;
    errorBoundary?: boolean;
    errorBoundaryProps?: Record<string, unknown>;
    source?: string;
    lineno?: number;
    colno?: number;
    error?: unknown;
  }
const app = new Hono<{ Bindings: Env; Variables: AppContext['Variables'] }>();
app.use('*', logger());
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization', 'X-Mock-Role'] }));
// Custom monitoring middleware
app.use('/api/*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const path = c.req.path;
  let eventType = 'general_api_call';
  if (path.includes('/auth/register')) eventType = 'user_registration';
  if (path.includes('/auth/login')) eventType = 'user_login';
  if (path.includes('/quiz/submit')) eventType = 'quiz_submission';
  if (path.includes('/resources') && c.req.method === 'POST') eventType = 'resource_upload';
  if (path.includes('/tenant-request')) eventType = 'tenant_request';
  const tenantId = c.get('tenantId') || 'unknown';
  const userRole = c.get('userRole') || 'unknown';
  // Structured log for monitoring (simulates sending to an analytics engine)
  console.log(
    `[MONITOR] method=${c.req.method} path=${path} status=${c.res.status} duration_ms=${duration} tenant_id=${tenantId} role=${userRole} event=${eventType}`
  );
});
userRoutes(app);
app.post('/api/client-errors', async (c) => {
  try {
    const e = await c.req.json<ClientErrorReport>();
    if (!e.message) return c.json({ success: false, error: 'Missing required fields' }, 400);
    console.error('[CLIENT ERROR]', JSON.stringify(e, null, 2));
    return c.json({ success: true });
  } catch (error) {
    console.error('[CLIENT ERROR HANDLER] Failed:', error);
    return c.json({ success: false, error: 'Failed to process' }, 500);
  }
});
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => { console.error(`[ERROR] ${err}`); return c.json({ success: false, error: 'Internal Server Error' }, 500); });
console.log(`Server is running`)
export default { fetch: app.fetch } satisfies ExportedHandler<Env>;