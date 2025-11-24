import { Hono, type Context, type Next } from "hono";
import type { Env } from './core-utils';
import { InstitutionEntity, UserEntity, CourseEntity, LessonEntity, QuizEntity, FlashcardDeckEntity, EnrollmentEntity, QuizSubmissionEntity, PendingTenantEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Course, Lesson, Quiz, FlashcardDeck, Enrollment, QuizSubmission, User, Institution, UserRole, PendingTenant } from "@shared/types";
export type AppContext = {
  Variables: {
    tenantId: string;
    userRole: UserRole;
  };
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
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
  // Middleware to simulate a tenant and user role context
  const tenantMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
    // In a real app, this would come from a JWT or session
    const mockUserRole = c.req.header('X-Mock-Role') as UserRole || 'student';
    const mockTenantId = 'inst-1';
    (c as any).set('userRole', mockUserRole);
    if (mockUserRole === 'super-admin') {
      (c as any).set('tenantId', 'global'); // Super-admins operate globally or on specific tenants
    } else {
      (c as any).set('tenantId', mockTenantId);
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
    pending.approvedAt = new new Date().toISOString();
    await pendingEntity.save(pending);
    const newInstitution: Institution = {
      id: `inst-${pending.id.substring(0, 8)}`,
      name: pending.name,
      approvedFromRequest: pending.id,
      country: pending.country,
      curriculum: pending.curriculum,
      languages: pending.languages,
      adminEmail: pending.adminEmail,
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
  // BILLING SIMULATION
  app.post('/api/billing/subscribe', async (c) => {
    console.log(`[BILLING] Tenant ${((c as any).get('tenantId') as string)} initiated subscription.`);
    return ok(c, { success: true, mockInvoice: `INV-${Date.now()}` });
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
  // USERS
  app.get('/api/users', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    await UserEntity.ensureSeed(c.env, tenantId);
    const page = await UserEntity.list(c.env, tenantId);
    return ok(c, page.items);
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
    const teacherId = 'user-teacher-1'; // Mocked teacher ID
    await CourseEntity.ensureSeed(c.env, tenantId);
    const allCourses = await CourseEntity.list(c.env, tenantId);
    const teacherCourses = allCourses.items.filter(course => course.teacherId === teacherId);
    return ok(c, teacherCourses);
  });
  app.get('/api/teacher/flashcard-decks', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const teacherId = 'user-teacher-1'; // Mocked teacher ID
    await FlashcardDeckEntity.ensureSeed(c.env, tenantId);
    const allDecks = await FlashcardDeckEntity.list(c.env, tenantId);
    const teacherDecks = allDecks.items.filter(deck => deck.userId === teacherId);
    const decksWithoutCards = teacherDecks.map(({ cards, ...deck }) => deck);
    return ok(c, decksWithoutCards);
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
  app.post('/api/quizzes', async (c) => {
    const tenantId = ((c as any).get('tenantId') as string);
    const quizData = (await c.req.json()) as Partial<Omit<Quiz, 'id' | 'tenantId'>>;
    if (!isStr(quizData.lessonId) || !isStr(quizData.title) || !Array.isArray(quizData.questions)) return bad(c, 'lessonId, title, and questions array are required');
    const newQuiz = { id: `quiz-${quizData.lessonId}`, tenantId, ...quizData } as Quiz;
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