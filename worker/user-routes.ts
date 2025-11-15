import { Hono, type Context, type Next } from "hono";
import type { Env } from './core-utils';
import { InstitutionEntity, UserEntity, CourseEntity, LessonEntity, QuizEntity, FlashcardDeckEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Course, Lesson, Quiz, FlashcardDeck } from "@shared/types";
export type AppContext = {
  Variables: {
    tenantId: string;
  };
};
export function userRoutes(app: Hono<{ Bindings: Env } & AppContext>) {
  // Middleware to simulate a single tenant context
  const tenantMiddleware = async (c: Context<AppContext>, next: Next) => {
    c.set('tenantId', 'inst-1'); // Hardcoded for now
    await next();
  };
  app.use('/api/*', tenantMiddleware);
  // INSTITUTION
  app.get('/api/institution', async (c) => {
    const tenantId = c.get('tenantId');
    await InstitutionEntity.ensureSeed(c.env, 'system'); // Institutions are system-level
    const institutionEntity = new InstitutionEntity(c.env, tenantId);
    if (!(await institutionEntity.exists())) {
      return notFound(c, 'Institution not found');
    }
    const institution = await institutionEntity.getState();
    return ok(c, institution);
  });
  // USERS
  app.get('/api/users', async (c) => {
    const tenantId = c.get('tenantId');
    await UserEntity.ensureSeed(c.env, tenantId);
    const page = await UserEntity.list(c.env, tenantId);
    return ok(c, page.items);
  });
  // COURSES
  app.get('/api/courses', async (c) => {
    const tenantId = c.get('tenantId');
    await CourseEntity.ensureSeed(c.env, tenantId);
    const page = await CourseEntity.list(c.env, tenantId);
    return ok(c, page.items);
  });
  app.post('/api/courses', async (c) => {
    const tenantId = c.get('tenantId');
    const { title, description, teacherId } = (await c.req.json()) as Partial<Omit<Course, 'id' | 'tenantId'>>;
    if (!isStr(title) || !isStr(description) || !isStr(teacherId)) {
        return bad(c, 'title, description, and teacherId are required');
    }
    const newCourse = { id: crypto.randomUUID(), tenantId, title, description, teacherId };
    const created = await CourseEntity.create(c.env, tenantId, newCourse);
    return ok(c, created);
  });
  app.get('/api/courses/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.param();
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) {
      return notFound(c, 'Course not found');
    }
    const course = await courseEntity.getState();
    if (course.tenantId !== tenantId) {
      return notFound(c, 'Course not found in this institution');
    }
    await LessonEntity.ensureSeed(c.env, tenantId);
    await QuizEntity.ensureSeed(c.env, tenantId);
    const allLessons = await LessonEntity.list(c.env, tenantId);
    const allQuizzes = await QuizEntity.list(c.env, tenantId);
    const quizMap = new Map<string, Quiz>();
    allQuizzes.items.forEach(quiz => quizMap.set(quiz.lessonId, quiz));
    const courseLessons = allLessons.items
      .filter(lesson => lesson.courseId === id)
      .map(lesson => ({
        ...lesson,
        quiz: quizMap.get(lesson.id)
      }));
    const courseWithLessons: Course = { ...course, lessons: courseLessons };
    return ok(c, courseWithLessons);
  });
  app.put('/api/courses/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.param();
    const { title, description } = (await c.req.json()) as Partial<Omit<Course, 'id' | 'tenantId' | 'teacherId'>>;
    if (!isStr(title) || !isStr(description)) {
        return bad(c, 'title and description are required');
    }
    const courseEntity = new CourseEntity(c.env, id);
    if (!(await courseEntity.exists())) {
        return notFound(c, 'Course not found');
    }
    const currentCourse = await courseEntity.getState();
    if (currentCourse.tenantId !== tenantId) {
        return notFound(c, 'Course not found in this institution');
    }
    // In a real app, you'd also verify the teacherId from auth context matches currentCourse.teacherId
    const updatedCourse = { ...currentCourse, title, description };
    await courseEntity.save(updatedCourse);
    return ok(c, updatedCourse);
  });
  // TEACHER-SPECIFIC ROUTES
  app.get('/api/teacher/courses', async (c) => {
    const tenantId = c.get('tenantId');
    // In a real app, you'd get the user ID from the auth context.
    // Here we mock it to be the teacher from our seed data.
    const teacherId = 'user-teacher-1';
    await CourseEntity.ensureSeed(c.env, tenantId);
    const allCourses = await CourseEntity.list(c.env, tenantId);
    const teacherCourses = allCourses.items.filter(course => course.teacherId === teacherId);
    return ok(c, teacherCourses);
  });
  app.get('/api/teacher/flashcard-decks', async (c) => {
    const tenantId = c.get('tenantId');
    const teacherId = 'user-teacher-1'; // Mocked teacher ID
    await FlashcardDeckEntity.ensureSeed(c.env, tenantId);
    const allDecks = await FlashcardDeckEntity.list(c.env, tenantId);
    const teacherDecks = allDecks.items.filter(deck => deck.userId === teacherId);
    const decksWithoutCards = teacherDecks.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
  });
  // LESSONS
  app.post('/api/lessons', async (c) => {
    const tenantId = c.get('tenantId');
    const { courseId, title, content } = (await c.req.json()) as Partial<Omit<Lesson, 'id' | 'tenantId'>>;
    if (!isStr(courseId) || !isStr(title) || !isStr(content)) {
        return bad(c, 'courseId, title, and content are required');
    }
    const newLesson = { id: crypto.randomUUID(), tenantId, courseId, title, content };
    const created = await LessonEntity.create(c.env, tenantId, newLesson);
    return ok(c, created);
  });
  // QUIZZES
  app.post('/api/quizzes', async (c) => {
    const tenantId = c.get('tenantId');
    const quizData = (await c.req.json()) as Partial<Omit<Quiz, 'id' | 'tenantId'>>;
    if (!isStr(quizData.lessonId) || !isStr(quizData.title) || !Array.isArray(quizData.questions)) {
        return bad(c, 'lessonId, title, and questions array are required');
    }
    const newQuiz = { id: `quiz-${quizData.lessonId}`, tenantId, ...quizData } as Quiz;
    newQuiz.questions.forEach(q => { if (!q.id) q.id = crypto.randomUUID() });
    const created = await QuizEntity.create(c.env, tenantId, newQuiz);
    return ok(c, created);
  });
  app.get('/api/quizzes/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.param();
    const quizEntity = new QuizEntity(c.env, id);
    if (!(await quizEntity.exists())) {
      return notFound(c, 'Quiz not found');
    }
    const quiz = await quizEntity.getState();
    if (quiz.tenantId !== tenantId) {
        return notFound(c, 'Quiz not found in this institution');
    }
    return ok(c, quiz);
  });
  // FLASHCARDS
  app.get('/api/flashcard-decks', async (c) => {
    const tenantId = c.get('tenantId');
    await FlashcardDeckEntity.ensureSeed(c.env, tenantId);
    const page = await FlashcardDeckEntity.list(c.env, tenantId);
    const decksWithoutCards = page.items.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
  });
  app.get('/api/flashcard-decks/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.param();
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) {
      return notFound(c, 'Flashcard deck not found');
    }
    const deck = await deckEntity.getState();
    if (deck.tenantId !== tenantId) {
        return notFound(c, 'Deck not found in this institution');
    }
    return ok(c, deck);
  });
  app.post('/api/flashcard-decks', async (c) => {
    const tenantId = c.get('tenantId');
    const { title, description, userId } = (await c.req.json()) as Partial<Omit<FlashcardDeck, 'id' | 'tenantId'>>;
    if (!isStr(title) || !isStr(description) || !isStr(userId)) {
        return bad(c, 'title, description, and userId are required');
    }
    const newDeck: FlashcardDeck = { id: crypto.randomUUID(), tenantId, title, description, userId, cards: [] };
    const created = await FlashcardDeckEntity.create(c.env, tenantId, newDeck);
    return ok(c, created);
  });
  app.put('/api/flashcard-decks/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const { id } = c.req.param();
    const deckData = (await c.req.json()) as FlashcardDeck;
    if (!deckData || !Array.isArray(deckData.cards)) {
        return bad(c, 'Invalid deck data provided');
    }
    if (deckData.tenantId !== tenantId) {
        return bad(c, 'Tenant ID mismatch');
    }
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) {
        return notFound(c, 'Flashcard deck not found');
    }
    deckData.cards.forEach(card => {
        if (!card.id) card.id = crypto.randomUUID();
        card.deckId = id;
    });
    await deckEntity.save(deckData);
    return ok(c, deckData);
  });
  // ANALYTICS
  app.get('/api/analytics', async (c) => {
    const tenantId = c.get('tenantId');
    await UserEntity.ensureSeed(c.env, tenantId);
    await CourseEntity.ensureSeed(c.env, tenantId);
    const users = await UserEntity.list(c.env, tenantId);
    const courses = await CourseEntity.list(c.env, tenantId);
    const totalStudents = users.items.filter(u => u.role === 'student').length;
    const totalCourses = courses.items.length;
    const mockProgressData = [
      { name: 'Paleontology', progress: 85 },
      { name: 'Web Dev', progress: 92 },
      { name: 'Writing', progress: 72 },
    ];
    const mockRecentActivity = [
      { student: 'Sam Neill', course: 'Paleontology', activity: 'Quiz Passed', score: '95%', time: '2m ago' },
      { student: 'Laura Dern', course: 'Web Dev', activity: 'Lesson Completed', score: '-', time: '15m ago' },
    ];
    const analyticsData = {
      kpi: {
        totalStudents,
        activeCourses: totalCourses,
        avgScore: 88,
        completionRate: 76,
      },
      progressData: mockProgressData,
      recentActivity: mockRecentActivity,
    };
    return ok(c, analyticsData);
  });
}