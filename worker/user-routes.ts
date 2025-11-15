import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, CourseEntity, LessonEntity, QuizEntity, FlashcardDeckEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Course, Lesson, Quiz, FlashcardDeck } from "@shared/types";
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
    // Seed and fetch all lessons and quizzes
    await LessonEntity.ensureSeed(c.env);
    await QuizEntity.ensureSeed(c.env);
    const allLessons = await LessonEntity.list(c.env);
    const allQuizzes = await QuizEntity.list(c.env);
    // Create a map of quizzes by lessonId for efficient lookup
    const quizMap = new Map<string, Quiz>();
    allQuizzes.items.forEach(quiz => quizMap.set(quiz.lessonId, quiz));
    // Filter lessons for this course and attach quizzes
    const courseLessons = allLessons.items
      .filter(lesson => lesson.courseId === id)
      .map(lesson => ({
        ...lesson,
        quiz: quizMap.get(lesson.id)
      }));
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
  // QUIZZES
  app.post('/api/quizzes', async (c) => {
    const quizData = (await c.req.json()) as Partial<Omit<Quiz, 'id'>>;
    if (!isStr(quizData.lessonId) || !isStr(quizData.title) || !Array.isArray(quizData.questions)) {
        return bad(c, 'lessonId, title, and questions array are required');
    }
    const newQuiz = { id: `quiz-${quizData.lessonId}`, ...quizData } as Quiz;
    // Ensure question IDs are unique
    newQuiz.questions.forEach(q => { if (!q.id) q.id = crypto.randomUUID() });
    const created = await QuizEntity.create(c.env, newQuiz);
    return ok(c, created);
  });
  app.get('/api/quizzes/:id', async (c) => {
    const { id } = c.req.param();
    const quizEntity = new QuizEntity(c.env, id);
    if (!(await quizEntity.exists())) {
      return notFound(c, 'Quiz not found');
    }
    const quiz = await quizEntity.getState();
    return ok(c, quiz);
  });
  // FLASHCARDS
  app.get('/api/flashcard-decks', async (c) => {
    await FlashcardDeckEntity.ensureSeed(c.env);
    const page = await FlashcardDeckEntity.list(c.env);
    // Return decks without cards for the list view
    const decksWithoutCards = page.items.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
  });
  app.get('/api/flashcard-decks/:id', async (c) => {
    const { id } = c.req.param();
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) {
      return notFound(c, 'Flashcard deck not found');
    }
    const deck = await deckEntity.getState();
    return ok(c, deck);
  });
  app.post('/api/flashcard-decks', async (c) => {
    const { title, description, userId } = (await c.req.json()) as Partial<Omit<FlashcardDeck, 'id'>>;
    if (!isStr(title) || !isStr(description) || !isStr(userId)) {
        return bad(c, 'title, description, and userId are required');
    }
    const newDeck: FlashcardDeck = { id: crypto.randomUUID(), title, description, userId, cards: [] };
    const created = await FlashcardDeckEntity.create(c.env, newDeck);
    return ok(c, created);
  });
  app.put('/api/flashcard-decks/:id', async (c) => {
    const { id } = c.req.param();
    const deckData = (await c.req.json()) as FlashcardDeck;
    if (!deckData || !Array.isArray(deckData.cards)) {
        return bad(c, 'Invalid deck data provided');
    }
    const deckEntity = new FlashcardDeckEntity(c.env, id);
    if (!(await deckEntity.exists())) {
        return notFound(c, 'Flashcard deck not found');
    }
    // Ensure card IDs are present
    deckData.cards.forEach(card => {
        if (!card.id) card.id = crypto.randomUUID();
        card.deckId = id;
    });
    await deckEntity.save(deckData);
    return ok(c, deckData);
  });
}