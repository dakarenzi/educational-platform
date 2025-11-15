import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, CourseEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'AcademiCloud API' }}));
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const page = await UserEntity.list(c.env);
    return ok(c, page.items);
  });
  // COURSES
  app.get('/api/courses', async (c) => {
    await CourseEntity.ensureSeed(c.env);
    const page = await CourseEntity.list(c.env);
    return ok(c, page.items);
  });
  app.post('/api/courses', async (c) => {
    const { title, description, teacherId } = (await c.req.json()) as Partial<Omit<import('@shared/types').Course, 'id'>>;
    if (!isStr(title) || !isStr(description) || !isStr(teacherId)) {
        return bad(c, 'title, description, and teacherId are required');
    }
    const newCourse = { id: crypto.randomUUID(), title, description, teacherId };
    const created = await CourseEntity.create(c.env, newCourse);
    return ok(c, created);
  });
}