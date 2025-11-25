import { Hono, type Context, type Next } from "hono";
import type { Env } from './core-utils';
import { InstitutionEntity, UserEntity, CourseEntity, LessonEntity, QuizEntity, FlashcardDeckEntity, EnrollmentEntity, QuizSubmissionEntity, PendingTenantEntity, MockExamEntity, MockExamSubmissionEntity, ResourceEntity, StudentSubscriptionEntity, PendingQuoteEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Course, Lesson, Quiz, FlashcardDeck, Enrollment, QuizSubmission, User, Institution, UserRole, PendingTenant, MockExam, MockExamSubmission, MockExamQuestion, Resource, JWTPayload, StudentSubscription, PendingQuote } from "@shared/types";
export type AppContext = {
  Variables: {
    tenantId: string;
    userRole: UserRole;
    userId: string;
  };
};
// --- JWT & Crypto Helpers ---
const base64UrlEncode = (data: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(data))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const base64UrlDecode = (str: string): ArrayBuffer => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const binStr = atob(base64);
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes.buffer;
};
const DEFAULT_JWT_SECRET = 'academicloud-secret-key-2024';
const getSigningKey = async (secret: string): Promise<CryptoKey> => {
  // Ensure we never try to import a key from an empty Uint8Array which causes a DataError.
  const secretToUse = (secret && secret.length > 0) ? secret : DEFAULT_JWT_SECRET;
  if (!secret || secret.length === 0) {
    console.warn('JWT secret is empty or falsy; falling back to DEFAULT_JWT_SECRET. Set JWT_SECRET in Bindings for production.');
  }
  const encoder = new TextEncoder();
  return crypto.subtle.importKey('raw', encoder.encode(secretToUse), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
};
const signJWT = async (payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInSeconds: number = 3600): Promise<string> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const normalizedSecret = secret && secret.length > 0 ? secret : DEFAULT_JWT_SECRET;
  const key = await getSigningKey(normalizedSecret);
  const signature = await crypto.subtle.sign('HMAC', key, dataToSign);
  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
};
const verifyJWT = async (token: string, secret: string): Promise<JWTPayload> => {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) throw new Error('Invalid token format');
  const normalizedSecret = secret && secret.length > 0 ? secret : DEFAULT_JWT_SECRET;
  const key = await getSigningKey(normalizedSecret);
  const dataToVerify = new TextEncoder().encode(`${header}.${payload}`);
  const signatureBuffer = base64UrlDecode(signature);
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, dataToVerify);
  if (!isValid) throw new Error('Invalid signature');
  const decodedPayload: JWTPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  if (decodedPayload.exp * 1000 < Date.now()) throw new Error('Token expired');
  return decodedPayload;
};
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- AUTH ROUTES ---
  app.post('/api/auth/register', async (c) => {
    const { email, password, name, role = 'student' } = await c.req.json();
    if (!isStr(email) || !isStr(password) || !isStr(name)) return bad(c, 'Email, password, and name are required.');
    const tenantId = 'inst-1'; // Hardcoded for prototype
    await UserEntity.ensureSeed(c.env, tenantId);
    const allUsers = await UserEntity.list(c.env, tenantId);
    if (allUsers.items.some(u => u.email === email)) return bad(c, 'An account with this email already exists.');
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: crypto.randomUUID(),
      tenantId,
      name,
      email,
      role,
      passwordHash,
      subscriptionStatus: 'free',
      subscriptionTier: 'free',
    };
    await UserEntity.create(c.env, tenantId, newUser);
    const { passwordHash: _, ...userResponse } = newUser;
    const token = await signJWT({ userId: newUser.id, tenantId, role }, c.env.JWT_SECRET);
    return ok(c, { token, user: userResponse });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password are required.');
    const tenantId = 'inst-1';
    await UserEntity.ensureSeed(c.env, tenantId);
    const allUsers = await UserEntity.list(c.env, tenantId);
    const user = allUsers.items.find(u => u.email === email);
    if (!user || !user.passwordHash) return bad(c, 'Invalid credentials.');
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) return bad(c, 'Invalid credentials.');
    const { passwordHash: _, ...userResponse } = user;
    const token = await signJWT({ userId: user.id, tenantId, role: user.role }, c.env.JWT_SECRET);
    return ok(c, { token, user: userResponse });
  });
  app.post('/api/auth/logout', (c) => {
    console.log('User logged out. In a real app, you might blacklist the token here.');
    return ok(c, { success: true });
  });
  // PUBLIC ROUTE FOR TENANT REQUESTS
  app.post('/api/tenant-request', async (c) => {
    const { name, country, curriculum, languages, adminEmail, verificationDomain } = await c.req.json<Partial<PendingTenant>>();
    if (!isStr(name) || !isStr(country) || !isStr(curriculum) || !Array.isArray(languages) || !isStr(adminEmail)) {
      return bad(c, 'Missing required fields for tenant request.');
    }
    const newPendingTenant: PendingTenant = {
      id: crypto.randomUUID(),
      name, country, curriculum, languages, adminEmail, verificationDomain,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    const created = await PendingTenantEntity.create(c.env, 'system', newPendingTenant);
    console.log(`[TENANT REQUEST] New pending tenant created: ${created.id} for ${name}. Notifying super-admins.`);
    return ok(c, created);
  });
  // STRIPE WEBHOOK (public, mocked)
  app.post('/api/webhooks/stripe', async (c) => {
    try {
      const event = await c.req.json<any>();
      console.log(`[STRIPE MOCK] Received webhook: ${event.type}`);
      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        // In a real app, you'd look up the tenantId by stripeCustomerId from the event data.
        const tenantId = 'inst-1'; // Mock for demo
        const institutionEntity = new InstitutionEntity(c.env, tenantId);
        await institutionEntity.patch({
          plan: 'pro',
          status: 'active',
          nextBilling: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
        });
        console.log(`[STRIPE MOCK] Updated tenant ${tenantId} to plan 'pro'.`);
      }
      return c.text('OK', 200);
    } catch (err) {
      console.error(`[STRIPE MOCK] Webhook error: ${(err as Error).message}`);
      return bad(c, `Webhook Error: ${(err as Error).message}`);
    }
  });
  app.post('/api/webhooks/stripe/student', async (c) => {
    const event = await c.req.json<any>();
    console.log(`[STRIPE STUDENT MOCK] Event: ${event.type}`);
    if (event.type === 'payment_intent.succeeded') {
      const { metadata: { userId, tenantId, tier } } = event.data.object;
      if (userId && tenantId) {
        const subEntity = new StudentSubscriptionEntity(c.env, `sub_${event.data.object.id}`);
        await subEntity.patch({ status: 'active', expiry: Math.floor(Date.now() / 1000) + 2592000 });
        const userEntity = new UserEntity(c.env, userId);
        await userEntity.patch({ subscriptionStatus: 'premium', subscriptionTier: tier || 'basic' });
      }
    }
    return c.text('OK', 200);
  });
  // Middleware to simulate a tenant and user role context
  const tenantMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
    let claims: JWTPayload | null = null;
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        claims = await verifyJWT(token, c.env.JWT_SECRET);
      } catch (e) {
        console.warn('JWT verification failed:', (e as Error).message);
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }
    }
    if (claims) {
      (c as any).set('userId', claims.userId);
      (c as any).set('userRole', claims.role);
      (c as any).set('tenantId', claims.tenantId);
    } else {
      // Fallback to mock role for development/testing if no JWT is provided
      const mockUserRole = c.req.header('X-Mock-Role') as UserRole || 'student';
      (c as any).set('userRole', mockUserRole);
      (c as any).set('userId', `user-${mockUserRole}-1`);
      (c as any).set('tenantId', mockUserRole === 'super-admin' ? 'global' : 'inst-1');
    }
    const userRole = (c as any).get('userRole');
    if (userRole === 'super-admin') {
      (c as any).set('tenantId', 'global');
    }
    await next();
  };
  app.use('/api/*', tenantMiddleware);
  // SUPER ADMIN ROUTES
  app.get('/api/super-admin/tenants', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    await InstitutionEntity.ensureSeed(c.env, 'system');
    const page = await InstitutionEntity.list(c.env, 'system');
    return ok(c, page.items);
  });
  app.get('/api/super-admin/pending-tenants', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const page = await PendingTenantEntity.list(c.env, 'system');
    return ok(c, page.items);
  });
  app.put('/api/super-admin/pending-tenants/:id/approve', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const id = c.req.param('id') as string;
    const pendingEntity = new PendingTenantEntity(c.env, id);
    if (!(await pendingEntity.exists())) return notFound(c, 'Pending tenant not found');
    const pending = await pendingEntity.getState();
    if (pending.status !== 'pending') return bad(c, 'Tenant request is not in pending state.');
    pending.status = 'approved';
    pending.approvedAt = new Date().toISOString();
    await pendingEntity.save(pending);
    const newInstitution: Institution = {
      id: `inst-${pending.id.substring(0, 8)}`,
      name: pending.name,
      approvedFromRequest: pending.id,
      country: pending.country,
      curriculum: pending.curriculum,
      languages: pending.languages,
      adminEmail: pending.adminEmail,
      plan: 'trial',
      status: 'trialing',
    };
    await InstitutionEntity.create(c.env, 'system', newInstitution);
    console.log(`[APPROVAL] Tenant ${newInstitution.id} activated for ${pending.name}.`);
    console.log(`[PROVISIONING] Simulating resource creation for ${newInstitution.id}: KV, R2, Vectorize...`);
    console.log(`[EMAIL SIM] Sending approval notification to ${pending.adminEmail}.`);
    return ok(c, { success: true });
  });
  app.put('/api/super-admin/pending-tenants/:id/reject', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const id = c.req.param('id') as string;
    const { notes } = await c.req.json<{ notes?: string }>();
    const pendingEntity = new PendingTenantEntity(c.env, id);
    if (!(await pendingEntity.exists())) return notFound(c, 'Pending tenant not found');
    const pending = await pendingEntity.getState();
    if (pending.status !== 'pending') return bad(c, 'Tenant request is not in pending state.');
    pending.status = 'rejected';
    pending.rejectedAt = new Date().toISOString();
    pending.notes = notes;
    await pendingEntity.save(pending);
    console.log(`[REJECT] Tenant request ${id} for ${pending.name} was rejected. Notes: ${notes}`);
    console.log(`[EMAIL SIM] Sending rejection notification to ${pending.adminEmail}.`);
    return ok(c, { success: true });
  });
  app.post('/api/super-admin/tenants', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const { name, country, curriculum, languages, adminEmail } = await c.req.json<Partial<Institution>>();
    if (!isStr(name)) return bad(c, 'name is required');
    const newInstitution: Institution = {
      id: crypto.randomUUID(),
      name,
      country: country || '',
      curriculum: curriculum || '',
      languages: languages || [],
      adminEmail: adminEmail || '',
      plan: 'trial',
      status: 'trialing',
    };
    const created = await InstitutionEntity.create(c.env, 'system', newInstitution);
    return ok(c, created);
  });
  app.get('/api/super-admin/analytics', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    // This is a mock aggregation. A real implementation would iterate through all tenants.
    const totalTenants = (await InstitutionEntity.list(c.env, 'system')).items.length;
    const totalUsers = (await UserEntity.list(c.env, 'inst-1')).items.length; // Mock for one tenant
    const mockRevenue = 599 * totalTenants;
    return ok(c, { totalTenants, totalUsers, mockRevenue });
  });
  app.get('/api/export-data', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const tenantId = c.req.query('tenantId');
    const format = c.req.query('format') || 'json'; // 'json' or 'csv'
    if (!tenantId) return bad(c, 'tenantId query parameter is required.');
    console.log(`[AUDIT] Data export requested for tenant ${tenantId} by super-admin.`);
    const users = (await UserEntity.list(c.env, tenantId)).items;
    const submissions = (await QuizSubmissionEntity.list(c.env, tenantId)).items;
    const exportData = {
      tenantId,
      exportedAt: new Date().toISOString(),
      users: users.map(u => ({ id: u.id, name: u.name, role: u.role })),
      submissions,
    };
    if (format === 'csv') {
      let csv = 'userId,userName,userRole,quizId,score,submittedAt\n';
      const userMap = new Map(users.map(u => [u.id, u]));
      submissions.forEach(s => {
        const user = userMap.get(s.studentId);
        csv += `${s.studentId},${user?.name || 'N/A'},${user?.role || 'N/A'},${s.quizId},${s.score},${s.submittedAt}\n`;
      });
      return c.text(csv, 200, { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="export-${tenantId}.csv"` });
    }
    return c.json(exportData, 200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="export-${tenantId}.json"` });
  });
  app.get('/api/super-admin/quotes', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const status = c.req.query('status');
    const page = await PendingQuoteEntity.list(c.env, 'system');
    const items = page.items.filter(q => !status || q.status === status);
    return ok(c, items);
  });
  app.put('/api/super-admin/quotes/:id/approve', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const id = c.req.param('id');
    const quoteEntity = new PendingQuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) return notFound(c, 'Quote not found');
    const quote = await quoteEntity.getState();
    if (quote.status !== 'pending') return bad(c, 'Quote not pending.');
    await quoteEntity.patch({ status: 'approved' });
    console.log(`[QUOTE APPROVED] Quote ${id} for tenant ${quote.tenantId}`);
    return ok(c, { success: true });
  });
  app.put('/api/super-admin/quotes/:id/reject', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const id = c.req.param('id');
    const { notes } = await c.req.json<{ notes?: string }>();
    const quoteEntity = new PendingQuoteEntity(c.env, id);
    if (!(await quoteEntity.exists())) return notFound(c, 'Quote not found');
    const quote = await quoteEntity.getState();
    await quoteEntity.patch({ status: 'rejected', notes });
    console.log(`[QUOTE REJECTED] Quote ${id} for tenant ${quote.tenantId}: ${notes || 'No reason provided'}`);
    return ok(c, { success: true });
  });
  // HEALTH ENDPOINT
  app.get('/api/health', async (c) => {
    if ((c as any).get('userRole') !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    await InstitutionEntity.ensureSeed(c.env, 'system');
    const tenants = await InstitutionEntity.list(c.env, 'system');
    const mockUsers = await UserEntity.list(c.env, 'inst-1');
    return ok(c, {
      status: 'ok',
      uptime: 0, // process.uptime() is not available in Workers. This is a placeholder.
      tenantCount: tenants.items.length,
      activeUsers: mockUsers.items.length, // Mock for one tenant
      timestamp: new Date().toISOString(),
    });
  });
  // BILLING (Mocked)
  app.post('/api/billing/subscribe', async (c) => {
    const userRole = (c as any).get('userRole') as UserRole;
    if (userRole !== 'admin' && userRole !== 'super-admin') return c.json({ error: 'Forbidden' }, 403);
    const tenantId = (c as any).get('tenantId') as string;
    if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_PRICE_ID_PRO) {
      console.warn('[STRIPE MOCK] Stripe environment variables are not set. Running in mock mode.');
    }
    const institutionEntity = new InstitutionEntity(c.env, tenantId);
    const institution = await institutionEntity.getState();
    const mockCustomerId = institution.stripeCustomerId || `cust_${crypto.randomUUID()}`;
    const mockSubId = `sub_${crypto.randomUUID()}`;
    await institutionEntity.patch({
      plan: 'pro',
      stripeCustomerId: mockCustomerId,
      status: 'active',
      nextBilling: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
    });
    console.log(`[STRIPE MOCK] Created subscription ${mockSubId} for tenant ${tenantId}`);
    // Simulate redirect to a success page instead of a real checkout URL
    return ok(c, { checkoutUrl: '/app/billing?success=true' });
  });
  app.post('/api/sales/request-quote', async (c) => {
    const { institutionSize, needs, timeline, adminEmail } = await c.req.json<Partial<PendingQuote>>();
    if (!isStr(institutionSize) || !isStr(needs) || !isStr(timeline) || !isStr(adminEmail)) return bad(c, 'Required fields missing.');
    const tenantId = (c as any).get('tenantId');
    const institutionEntity = new InstitutionEntity(c.env, tenantId);
    const institution = await institutionEntity.getState();
    const newQuote: PendingQuote = {
      id: crypto.randomUUID(),
      tenantId,
      institutionSize,
      needs,
      timeline: timeline as PendingQuote['timeline'],
      status: 'pending',
      submittedAt: new Date().toISOString(),
      adminEmail
    };
    await PendingQuoteEntity.create(c.env, 'system', newQuote);
    console.log(`[EMAIL TO sales@academicloud.com] New quote request from ${institution.name} (Tenant: ${tenantId}): Size: ${institutionSize}, Needs: ${needs}, Timeline: ${timeline}, Contact: ${adminEmail}`);
    return ok(c, { success: true, message: 'Quote request submitted.' });
  });
  // STUDENT SUBSCRIPTIONS
  app.get('/api/student/subscriptions', async (c) => {
    const userId = (c as any).get('userId');
    const tenantId = (c as any).get('tenantId');
    if (!userId) return bad(c, 'Unauthorized');
    const subs = await StudentSubscriptionEntity.list(c.env, tenantId);
    return ok(c, subs.items.filter(s => s.userId === userId));
  });
  app.post('/api/student/subscriptions', async (c) => {
    const { plan = 'basic' } = await c.req.json<{ plan: 'basic' | 'pro' }>();
    const userId = (c as any).get('userId');
    const tenantId = (c as any).get('tenantId');
    if (!userId) return bad(c, 'Unauthorized');
    const now = Math.floor(Date.now() / 1000);
    const expiry = plan === 'basic' ? now + 2592000 : now + 7776000; // 30 or 90 days
    const price = plan === 'basic' ? 4.99 : 7.99;
    const paymentId = `mock_stripe_${plan}_${crypto.randomUUID()}`;
    const userEntity = new UserEntity(c.env, userId);
    await userEntity.patch({ subscriptionStatus: 'premium', subscriptionTier: plan, paymentId, expiry });
    const sub: StudentSubscription = {
      id: crypto.randomUUID(),
      userId,
      tenantId,
      plan: 'premium',
      tier: plan,
      status: 'active',
      expiry,
      paymentId,
    };
    await StudentSubscriptionEntity.create(c.env, tenantId, sub);
    console.log(`[MONITOR] event=student_subscription_${plan} userId=${userId} tenantId=${tenantId} price=${price}`);
    console.log(`[STRIPE MOCK] Created ${plan} subscription for user ${userId} with price ID simulation.`);
    return ok(c, { sessionUrl: '/app/billing?success=true' });
  });
  app.put('/api/student/subscriptions/:id/cancel', async (c) => {
    const id = c.req.param('id');
    const userId = (c as any).get('userId');
    const subEntity = new StudentSubscriptionEntity(c.env, id);
    if (!(await subEntity.exists()) || (await subEntity.getState()).userId !== userId) return bad(c, 'Not found');
    await subEntity.patch({ status: 'canceled' });
    const userEntity = new UserEntity(c.env, userId);
    await userEntity.patch({ subscriptionStatus: 'free', subscriptionTier: 'free', paymentId: '', expiry: 0 });
    return ok(c, { success: true });
  });
  // INSTITUTION
  app.get('/api/institution', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await InstitutionEntity.ensureSeed(c.env, 'system');
    const institutionEntity = new InstitutionEntity(c.env, tenantId);
    if (!(await institutionEntity.exists())) return notFound(c, 'Institution not found');
    const institution = await institutionEntity.getState();
    return ok(c, institution);
  });
  app.patch('/api/institution', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const updates = await c.req.json<Partial<Institution>>();
    const institutionEntity = new InstitutionEntity(c.env, tenantId);
    if (!(await institutionEntity.exists())) return notFound(c, 'Institution not found');
    await institutionEntity.patch(updates);
    return ok(c, await institutionEntity.getState());
  });
  // USERS
  app.get('/api/users', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await UserEntity.ensureSeed(c.env, tenantId);
    const page = await UserEntity.list(c.env, tenantId);
    return ok(c, page.items);
  });
  app.get('/api/users/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id');
    const userEntity = new UserEntity(c.env, id);
    if (!(await userEntity.exists())) return notFound(c, 'User not found');
    const user = await userEntity.getState();
    if (user.tenantId !== tenantId && (c as any).get('userRole') !== 'super-admin') return notFound(c, 'User not found in this institution');
    const { passwordHash: _, ...userResponse } = user;
    return ok(c, userResponse);
  });
  // COURSES (CMS-like routes)
  app.get('/api/cms/courses', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const page = await CourseEntity.list(c.env, tenantId);
    return ok(c, page.items);
  });
  app.post('/api/cms/courses', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { title, description, teacherId } = (await c.req.json()) as Partial<Omit<Course, 'id' | 'tenantId'>>;
    if (!isStr(title) || !isStr(description) || !isStr(teacherId)) {
        return bad(c, 'title, description, and teacherId are required');
    }
    const newCourse = { id: crypto.randomUUID(), tenantId, title, description, teacherId };
    const created = await CourseEntity.create(c.env, tenantId, newCourse);
    console.log(`[WEBHOOK] Course created: ${created.id}`);
    return ok(c, created);
  });
  app.get('/api/cms/courses/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) return notFound(c, 'Course not found');
    const course = await courseEntity.getState();
    if (course.tenantId !== tenantId) return notFound(c, 'Course not found in this institution');
    await LessonEntity.ensureSeed(c.env, tenantId);
    await QuizEntity.ensureSeed(c.env, tenantId);
    const allLessons = await LessonEntity.list(c.env, tenantId);
    const allQuizzes = await QuizEntity.list(c.env, tenantId);
    const quizMap = new Map<string, Quiz>();
    allQuizzes.items.forEach(quiz => quizMap.set(quiz.lessonId, quiz));
    const courseLessons = allLessons.items
      .filter(lesson => lesson.courseId === id)
      .map(lesson => ({ ...lesson, quiz: quizMap.get(lesson.id) }));
    const courseWithLessons: Course = { ...course, lessons: courseLessons };
    return ok(c, courseWithLessons);
  });
  app.put('/api/cms/courses/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const { title, description } = (await c.req.json()) as Partial<Omit<Course, 'id' | 'tenantId' | 'teacherId'>>;
    if (!isStr(title) || !isStr(description)) return bad(c, 'title and description are required');
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) return notFound(c, 'Course not found');
    const currentCourse = await courseEntity.getState();
    if (currentCourse.tenantId !== tenantId) return notFound(c, 'Course not found in this institution');
    const updatedCourse = { ...currentCourse, title, description };
    await courseEntity.save(updatedCourse);
    console.log(`[WEBHOOK] Course updated: ${updatedCourse.id}`);
    return ok(c, updatedCourse);
  });
  app.delete('/api/cms/courses/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const deleted = await CourseEntity.delete(c.env, tenantId, id);
    if (!deleted) return notFound(c, 'Course not found');
    console.log(`[WEBHOOK] Course deleted: ${id}`);
    return ok(c, { success: true });
  });
  // Public-facing routes (re-implemented)
  app.get('/api/courses', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const page = await CourseEntity.list(c.env, tenantId);
    return ok(c, page.items);
  });
  app.get('/api/courses/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) return notFound(c, 'Course not found');
    const course = await courseEntity.getState();
    if (course.tenantId !== tenantId) return notFound(c, 'Course not found in this institution');
    await LessonEntity.ensureSeed(c.env, tenantId);
    await QuizEntity.ensureSeed(c.env, tenantId);
    const allLessons = await LessonEntity.list(c.env, tenantId);
    const allQuizzes = await QuizEntity.list(c.env, tenantId);
    const quizMap = new Map<string, Quiz>();
    allQuizzes.items.forEach(quiz => quizMap.set(quiz.lessonId, quiz));
    const courseLessons = allLessons.items
      .filter(lesson => lesson.courseId === id)
      .map(lesson => ({ ...lesson, quiz: quizMap.get(lesson.id) }));
    const courseWithLessons: Course = { ...course, lessons: courseLessons };
    return ok(c, courseWithLessons);
  });
  // TEACHER-SPECIFIC ROUTES
  app.get('/api/teacher/courses', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const teacherId = (c as any).get('userId');
    if ((c as any).get('userRole') !== 'teacher' && (c as any).get('userRole') !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const allCourses = await CourseEntity.list(c.env, tenantId);
    const teacherCourses = allCourses.items.filter(course => course.teacherId === teacherId);
    return ok(c, teacherCourses);
  });
  app.get('/api/teacher/flashcard-decks', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const teacherId = (c as any).get('userId');
    if ((c as any).get('userRole') !== 'teacher' && (c as any).get('userRole') !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    await FlashcardDeckEntity.ensureSeed(c.env, tenantId);
    const allDecks = await FlashcardDeckEntity.list(c.env, tenantId);
    const teacherDecks = allDecks.items.filter(deck => deck.userId === teacherId);
    const decksWithoutCards = teacherDecks.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
  });
  app.get('/api/teacher/quizzes', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const teacherId = (c as any).get('userId');
    if ((c as any).get('userRole') !== 'teacher' && (c as any).get('userRole') !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    await QuizEntity.ensureSeed(c.env, tenantId);
    await LessonEntity.ensureSeed(c.env, tenantId);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const allCourses = (await CourseEntity.list(c.env, tenantId)).items;
    const teacherCourseIds = new Set(allCourses.filter(c => c.teacherId === teacherId).map(c => c.id));
    const allLessons = (await LessonEntity.list(c.env, tenantId)).items;
    const teacherLessonIds = new Set(allLessons.filter(l => teacherCourseIds.has(l.courseId)).map(l => l.id));
    const allQuizzes = (await QuizEntity.list(c.env, tenantId)).items;
    const teacherQuizzes = allQuizzes.filter(q => teacherLessonIds.has(q.lessonId));
    return ok(c, teacherQuizzes);
  });
  // LESSONS
  app.post('/api/lessons', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { courseId, title, content } = (await c.req.json()) as Partial<Omit<Lesson, 'id' | 'tenantId'>>;
    if (!isStr(courseId) || !isStr(title) || !isStr(content)) return bad(c, 'courseId, title, and content are required');
    const newLesson = { id: crypto.randomUUID(), tenantId, courseId, title, content };
    const created = await LessonEntity.create(c.env, tenantId, newLesson);
    return ok(c, created);
  });
  // QUIZZES
  app.get('/api/quizzes', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await QuizEntity.ensureSeed(c.env, tenantId);
    const allQuizzes = (await QuizEntity.list(c.env, tenantId)).items;
    const allLessons = (await LessonEntity.list(c.env, tenantId)).items;
    const allCourses = (await CourseEntity.list(c.env, tenantId)).items;
    const lessonMap = new Map(allLessons.map(l => [l.id, l]));
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const enriched = allQuizzes.map(quiz => {
      const lesson = lessonMap.get(quiz.lessonId);
      const course = lesson ? courseMap.get(lesson.courseId) : undefined;
      return {
        ...quiz,
        lessonTitle: lesson?.title,
        courseTitle: course?.title,
        courseId: course?.id,
      };
    });
    return ok(c, enriched);
  });
  app.post('/api/quizzes', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { lessonId, ...quizData } = await c.req.json<Partial<Quiz>>();
    if (!isStr(quizData.title) || !Array.isArray(quizData.questions)) {
      return bad(c, 'title and questions array are required');
    }
    const id = lessonId ? `quiz-${lessonId}` : `quiz-${crypto.randomUUID()}`;
    const newQuiz: Quiz = {
      id,
      tenantId,
      lessonId: lessonId || '',
      title: quizData.title,
      questions: quizData.questions,
    };
    newQuiz.questions.forEach(q => { if (!q.id) q.id = crypto.randomUUID() });
    const created = await QuizEntity.create(c.env, tenantId, newQuiz);
    return ok(c, created);
  });
  app.get('/api/quizzes/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const quizEntity = new QuizEntity(c.env, id);
    if (!(await quizEntity.exists())) return notFound(c, 'Quiz not found');
    const quiz = await quizEntity.getState();
    if (quiz.tenantId !== tenantId) return notFound(c, 'Quiz not found in this institution');
    return ok(c, quiz);
  });
  // FLASHCARDS
  app.get('/api/flashcard-decks', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await FlashcardDeckEntity.ensureSeed(c.env, tenantId);
    const page = await FlashcardDeckEntity.list(c.env, tenantId);
    const decksWithoutCards = page.items.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
  });
  app.get('/api/flashcard-decks/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) return notFound(c, 'Flashcard deck not found');
    const deck = await deckEntity.getState();
    if (deck.tenantId !== tenantId) return notFound(c, 'Deck not found in this institution');
    return ok(c, deck);
  });
  app.post('/api/flashcard-decks', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { title, description, userId } = (await c.req.json()) as Partial<Omit<FlashcardDeck, 'id' | 'tenantId'>>;
    if (!isStr(title) || !isStr(description) || !isStr(userId)) return bad(c, 'title, description, and userId are required');
    const newDeck: FlashcardDeck = { id: crypto.randomUUID(), tenantId, title, description, userId, cards: [] };
    const created = await FlashcardDeckEntity.create(c.env, tenantId, newDeck);
    return ok(c, created);
  });
  app.put('/api/flashcard-decks/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const deckData = (await c.req.json()) as Partial<FlashcardDeck>;
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) return notFound(c, 'Flashcard deck not found');
    const currentDeck = await deckEntity.getState();
    if (currentDeck.tenantId !== tenantId) return notFound(c, 'Deck not found in this institution');
    const updatedDeck = { ...currentDeck, ...deckData };
    if (Array.isArray(updatedDeck.cards)) {
        updatedDeck.cards.forEach(card => {
            if (!card.id) card.id = crypto.randomUUID();
            card.deckId = id;
        });
    }
    await deckEntity.save(updatedDeck);
    return ok(c, updatedDeck);
  });
  app.delete('/api/flashcard-decks/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const deleted = await FlashcardDeckEntity.delete(c.env, tenantId, id);
    if (!deleted) return notFound(c, 'Flashcard deck not found');
    return ok(c, { success: true });
  });
  // RESOURCES
  app.post('/api/resources', async (c) => {
    const userRole = (c as any).get('userRole') as UserRole;
    if (userRole !== 'teacher' && userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    const { title, description, fileUrl, category, lessonId } = await c.req.json<Partial<Resource>>();
    if (!isStr(title) || !isStr(fileUrl) || !isStr(category)) return bad(c, 'Required fields: title, fileUrl, category');
    const tenantId = (c as any).get('tenantId') as string;
    const newResource: Resource = {
      id: crypto.randomUUID(),
      tenantId,
      title,
      description: description || '',
      fileUrl,
      category: category as Resource['category'],
      lessonId,
      creatorId: (c as any).get('userId'),
      downloads: 0,
      createdAt: new Date().toISOString(),
    };
    const created = await ResourceEntity.create(c.env, tenantId, newResource);
    console.log(`[R2 SIM] Uploaded resource ${created.id} for tenant ${tenantId}`);
    return ok(c, created);
  });
  app.get('/api/resources', async (c) => {
    const tenantId = (c as any).get('tenantId') as string;
    await ResourceEntity.ensureSeed(c.env, tenantId);
    const lessonId = c.req.query('lessonId');
    const search = c.req.query('search')?.toLowerCase();
    const page = await ResourceEntity.list(c.env, tenantId);
    let items = page.items;
    if (lessonId) items = items.filter(r => r.lessonId === lessonId);
    if (search) items = items.filter(r => r.title.toLowerCase().includes(search) || r.description?.toLowerCase().includes(search));
    // Mock student enrollment check
    if (((c as any).get('userRole') as UserRole) === 'student') {
        const studentEnrolledCourseIds = ['course-1']; // Mock
        const allLessons = (await LessonEntity.list(c.env, tenantId)).items;
        const enrolledLessonIds = allLessons.filter(l => studentEnrolledCourseIds.includes(l.courseId)).map(l => l.id);
        items = items.filter(r => !r.lessonId || enrolledLessonIds.includes(r.lessonId));
    }
    return ok(c, items);
  });
  app.get('/api/resources/:id', async (c) => {
    const tenantId = (c as any).get('tenantId') as string;
    const id = c.req.param('id');
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!(await resourceEntity.exists())) return notFound(c, 'Resource not found');
    const resource = await resourceEntity.getState();
    if (resource.tenantId !== tenantId) return notFound(c, 'Resource not found in this institution');
    return ok(c, resource);
  });
  app.put('/api/resources/:id', async (c) => {
    const userRole = (c as any).get('userRole') as UserRole;
    if (userRole !== 'teacher' && userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    const tenantId = (c as any).get('tenantId') as string;
    const id = c.req.param('id');
    const updates = await c.req.json<Partial<Resource>>();
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!(await resourceEntity.exists())) return notFound(c, 'Resource not found');
    const current = await resourceEntity.getState();
    if (current.tenantId !== tenantId) return notFound(c, 'Resource not found in this institution');
    // In a real app, check creatorId against the logged-in user
    await resourceEntity.patch(updates);
    return ok(c, await resourceEntity.getState());
  });
  app.delete('/api/resources/:id', async (c) => {
    const userRole = (c as any).get('userRole') as UserRole;
    if (userRole !== 'teacher' && userRole !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    const tenantId = (c as any).get('tenantId') as string;
    const id = c.req.param('id');
    const deleted = await ResourceEntity.delete(c.env, tenantId, id);
    if (!deleted) return notFound(c, 'Resource not found');
    console.log(`[R2 SIM] Deleted resource ${id} from tenant ${tenantId}`);
    return ok(c, { success: true });
  });
  app.post('/api/resources/:id/download', async (c) => {
    const tenantId = (c as any).get('tenantId') as string;
    const id = c.req.param('id');
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!(await resourceEntity.exists())) return notFound(c, 'Resource not found');
    const resource = await resourceEntity.getState();
    if (resource.tenantId !== tenantId) return notFound(c, 'Resource not found in this institution');
    await resourceEntity.patch({ downloads: (resource.downloads || 0) + 1 });
    console.log(`[R2 SIM] Downloaded resource ${id} from tenant ${tenantId}`);
    return ok(c, { fileUrl: resource.fileUrl, downloads: (resource.downloads || 0) + 1 });
  });
  // STUDENT ENROLLMENT & PROGRESS
  app.post('/api/enroll', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { courseId, studentId } = (await c.req.json()) as { courseId: string; studentId: string };
    if (!isStr(courseId) || !isStr(studentId)) return bad(c, 'courseId and studentId are required');
    const enrollmentId = `${studentId}-${courseId}`;
    const newEnrollment: Enrollment = { id: enrollmentId, tenantId, courseId, studentId };
    const created = await EnrollmentEntity.create(c.env, tenantId, newEnrollment);
    return ok(c, created);
  });
  app.get('/api/student/enrollments', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const studentId = c.req.query('studentId') as string;
    if (!isStr(studentId)) return bad(c, 'studentId is required');
    const allEnrollments = await EnrollmentEntity.list(c.env, tenantId);
    const studentEnrollments = allEnrollments.items.filter(e => e.studentId === studentId);
    return ok(c, studentEnrollments);
  });
  app.post('/api/quiz/submit', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { quizId, studentId, score } = (await c.req.json()) as { quizId: string; studentId: string; score: number };
    if (!isStr(quizId) || !isStr(studentId) || typeof score !== 'number') return bad(c, 'quizId, studentId, and score are required');
    const submissionId = `${studentId}-${quizId}`;
    const newSubmission: QuizSubmission = {
      id: submissionId,
      tenantId,
      quizId,
      studentId,
      score,
      submittedAt: new Date().toISOString(),
    };
    const created = await QuizSubmissionEntity.create(c.env, tenantId, newSubmission);
    return ok(c, created);
  });
  app.get('/api/student/submissions', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const studentId = c.req.query('studentId') as string;
    if (!isStr(studentId)) return bad(c, 'studentId is required');
    const allSubmissions = (await QuizSubmissionEntity.list(c.env, tenantId)).items.filter(s => s.studentId === studentId);
    const allQuizzes = (await QuizEntity.list(c.env, tenantId)).items;
    const allLessons = (await LessonEntity.list(c.env, tenantId)).items;
    const allCourses = (await CourseEntity.list(c.env, tenantId)).items;
    const quizMap = new Map(allQuizzes.map(q => [q.id, q]));
    const lessonMap = new Map(allLessons.map(l => [l.id, l]));
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const enrichedSubmissions = allSubmissions.map(sub => {
      const quiz = quizMap.get(sub.quizId);
      const lesson = quiz ? lessonMap.get(quiz.lessonId) : undefined;
      const course = lesson ? courseMap.get(lesson.courseId) : undefined;
      return {
        ...sub,
        quizTitle: quiz?.title || 'Unknown Quiz',
        courseTitle: course?.title || 'Unknown Course',
        courseId: course?.id || '',
      };
    }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return ok(c, enrichedSubmissions);
  });
  // ANALYTICS
  app.get('/api/analytics', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await UserEntity.ensureSeed(c.env, tenantId);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const users = await UserEntity.list(c.env, tenantId);
    const courses = await CourseEntity.list(c.env, tenantId);
    const submissions = (await QuizSubmissionEntity.list(c.env, tenantId)).items;
    const totalStudents = users.items.filter(u => u.role === 'student').length;
    const totalCourses = courses.items.length;
    const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length) : 0;
    const userMap = new Map<string, User>(users.items.map(u => [u.id, u]));
    const allQuizzes = (await QuizEntity.list(c.env, tenantId)).items;
    const allLessons = (await LessonEntity.list(c.env, tenantId)).items;
    const quizMap = new Map(allQuizzes.map(q => [q.id, q]));
    const lessonMap = new Map(allLessons.map(l => [l.id, l]));
    const courseMap = new Map(courses.items.map(c => [c.id, c]));
    const recentActivity = submissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5)
      .map(sub => {
        const student = userMap.get(sub.studentId);
        const quiz = quizMap.get(sub.quizId);
        const lesson = quiz ? lessonMap.get(quiz.lessonId) : undefined;
        const course = lesson ? courseMap.get(lesson.courseId) : undefined;
        return {
          student: student?.name || 'Unknown Student',
          course: course?.title || 'Unknown Course',
          activity: sub.score >= 80 ? 'Quiz Passed' : 'Quiz Failed',
          score: `${sub.score}%`,
          submittedAt: sub.submittedAt,
        };
      });
    const mockProgressData = [
      { name: 'Paleontology', progress: 85 },
      { name: 'Web Dev', progress: 92 },
      { name: 'Writing', progress: 72 },
    ];
    const analyticsData = {
      kpi: {
        totalStudents,
        activeCourses: totalCourses,
        avgScore,
        completionRate: 76, // This remains mock for now
      },
      progressData: mockProgressData,
      recentActivity,
    };
    return ok(c, analyticsData);
  });
  // MOCK EXAMS
  app.get('/api/mock-exams', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await MockExamEntity.ensureSeed(c.env, tenantId);
    const page = await MockExamEntity.list(c.env, tenantId);
    // Enrich with submissions
    const allSubmissions = await MockExamSubmissionEntity.list(c.env, tenantId);
    const enriched = page.items.map(exam => {
      const submissions = allSubmissions.items.filter(s => s.examId === exam.id);
      return { ...exam, submissions };
    });
    return ok(c, enriched);
  });
  app.post('/api/mock-exams', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const { title, description, duration, questions, teacherId } = await c.req.json<Partial<Omit<MockExam, 'id' | 'tenantId' | 'createdAt' | 'submissions'>>>();
    if (!isStr(title) || !isStr(teacherId) || typeof duration !== 'number' || !Array.isArray(questions)) {
      return bad(c, 'Required fields: title, teacherId, duration, questions');
    }
    const newExam: MockExam = {
      id: crypto.randomUUID(),
      tenantId,
      title,
      description: description || '',
      teacherId,
      duration,
      questions: questions as MockExamQuestion[],
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    const created = await MockExamEntity.create(c.env, tenantId, newExam);
    return ok(c, created);
  });
  app.get('/api/mock-exams/:id', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const examEntity = new MockExamEntity(c.env, id);
    if (!(await examEntity.exists())) return notFound(c, 'Mock exam not found');
    const exam = await examEntity.getState();
    if (exam.tenantId !== tenantId) return notFound(c, 'Exam not found in this institution');
    const submissionsPage = await MockExamSubmissionEntity.list(c.env, tenantId);
    const examSubmissions = submissionsPage.items.filter(s => s.examId === id);
    const enrichedExam: MockExam = { ...exam, submissions: examSubmissions };
    return ok(c, enrichedExam);
  });
  app.post('/api/mock-exams/:id/submit', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const id = c.req.param('id') as string;
    const { studentId, score, timeTaken, answers } = await c.req.json<{ studentId: string; score: number; timeTaken: number; answers?: Record<number, number> }>();
    if (!isStr(studentId) || typeof score !== 'number' || typeof timeTaken !== 'number') {
      return bad(c, 'studentId, score, and timeTaken are required');
    }
    const submissionId = `${studentId}-${id}-${Date.now()}`;
    const newSubmission: MockExamSubmission = {
      id: submissionId,
      tenantId,
      examId: id,
      studentId,
      score,
      timeTaken,
      submittedAt: new Date().toISOString(),
      answers,
    };
    const created = await MockExamSubmissionEntity.create(c.env, tenantId, newSubmission);
    return ok(c, created);
  });
  // AI TUTOR
  const tutorHandler = async (c: Context, mockResponses: { en: string; fr: string }) => {
    const { language = 'en' } = (await c.req.json()) as { content: string; language: 'en' | 'fr' };
    await new Promise(res => setTimeout(res, 1000)); // Simulate AI processing time
    const response = language === 'fr' ? mockResponses.fr : mockResponses.en;
    return ok(c, { response });
  };
  app.post('/api/tutor/message', (c) => tutorHandler(c, {
    en: "That's a great question! Let me look into that for you. (This is a mocked response)",
    fr: "C'est une excellente question ! Laissez-moi vérifier cela pour vous. (Ceci est une réponse simulée)"
  }));
  app.post('/api/tutor/summarize', (c) => tutorHandler(c, {
    en: "In summary, the key points are A, B, and C. (This is a mocked summary)",
    fr: "En résumé, les points clés sont A, B et C. (Ceci est un résumé simulé)"
  }));
  app.post('/api/tutor/explain', (c) => tutorHandler(c, {
    en: "Let's break it down. The concept works like this... (This is a mocked explanation)",
    fr: "Décortiquons cela. Le concept fonctionne comme ceci... (Ceci est une explication simulée)"
  }));
  app.post('/api/tutor/quiz-me', (c) => tutorHandler(c, {
    en: "Okay, here's a practice question for you: What is the main benefit of using serverless architecture? (This is a mocked quiz question)",
    fr: "D'accord, voici une question pratique pour vous : Quel est le principal avantage de l'utilisation d'une architecture sans serveur ? (Ceci est une question de quiz simulée)"
  }));
}