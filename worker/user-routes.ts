import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, CourseEntity, LessonEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Course, Lesson } from "@shared/types";
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
    const { title, description, teacherId } = (await c.req.json()) as Partial<Omit<Course, 'id'>>;
    if (!isStr(title) || !isStr(description) || !isStr(teacherId)) {
        return bad(c, 'title, description, and teacherId are required');
    }
    const newCourse = { id: crypto.randomUUID(), title, description, teacherId };
    const created = await CourseEntity.create(c.env, newCourse);
    return ok(c, created);
  });
  app.get('/api/courses/:id', async (c) => {
    const { id } = c.req.param();
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) {
      return notFound(c, 'Course not found');
    }
    const course = await courseEntity.getState();
    // Seed and fetch all lessons
    await LessonEntity.ensureSeed(c.env);
    const allLessons = await LessonEntity.list(c.env);
    // Filter lessons for this course
    const courseLessons = allLessons.items.filter(lesson => lesson.courseId === id);
    const courseWithLessons: Course = { ...course, lessons: courseLessons };
    return ok(c, courseWithLessons);
  });
  // LESSONS
  app.post('/api/lessons', async (c) => {
    const { courseId, title, content } = (await c.req.json()) as Partial<Omit<Lesson, 'id'>>;
    if (!isStr(courseId) || !isStr(title) || !isStr(content)) {
        return bad(c, 'courseId, title, and content are required');
    }
    const newLesson = { id: crypto.randomUUID(), courseId, title, content };
    const created = await LessonEntity.create(c.env, newLesson);
    return ok(c, created);
  });
}