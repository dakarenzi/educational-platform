import { IndexedEntity } from "./core-utils";
import type { User, Course, Lesson, Quiz, FlashcardDeck, Flashcard, Institution, Enrollment, QuizSubmission, PendingTenant, MockExam, MockExamSubmission, Resource } from "@shared/types";
const MOCK_INSTITUTIONS: Institution[] = [
  { id: 'inst-1', name: 'Cloudflare University', country: 'USA', curriculum: 'US', languages: ['en'], adminEmail: 'contact@cfu.edu' },
  { id: 'inst-2', name: 'Workers Academy', country: 'France', curriculum: 'AEFE', languages: ['fr', 'en'], adminEmail: 'contact@workers.ac' },
];
const MOCK_USERS: User[] = [
  { id: 'user-admin-1', tenantId: 'inst-1', name: 'Dr. Evelyn Reed', role: 'admin', avatarUrl: 'https://i.pravatar.cc/150?u=admin1' },
  { id: 'user-teacher-1', tenantId: 'inst-1', name: 'Prof. Alan Grant', role: 'teacher', avatarUrl: 'https://i.pravatar.cc/150?u=teacher1' },
  { id: 'user-student-1', tenantId: 'inst-1', name: 'Sam Neill', role: 'student', avatarUrl: 'https://i.pravatar.cc/150?u=student1' },
  { id: 'user-student-2', tenantId: 'inst-1', name: 'Laura Dern', role: 'student', avatarUrl: 'https://i.pravatar.cc/150?u=student2' },
];
const MOCK_COURSES: Course[] = [
    { id: 'course-1', tenantId: 'inst-1', title: 'Introduction to Paleontology', description: 'Discover the world of dinosaurs and ancient life.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1582573543323-626b11696f43?q=80&w=800' },
    { id: 'course-2', tenantId: 'inst-1', title: 'Modern Web Development', description: 'Learn to build fast, modern websites with Cloudflare.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800' },
    { id: 'course-3', tenantId: 'inst-1', title: 'Creative Writing Workshop', description: 'Unleash your inner storyteller and craft compelling narratives.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800' },
];
const MOCK_LESSONS: Lesson[] = [
    { id: 'lesson-1-1', tenantId: 'inst-1', courseId: 'course-1', title: 'The Mesozoic Era', content: 'A deep dive into the age of dinosaurs.' },
    { id: 'lesson-1-2', tenantId: 'inst-1', courseId: 'course-1', title: 'Fossil Hunting 101', content: 'Techniques for finding and identifying fossils.' },
    { id: 'lesson-2-1', tenantId: 'inst-1', courseId: 'course-2', title: 'Building with Hono', content: 'Creating serverless APIs on Cloudflare Workers.' },
    { id: 'lesson-2-2', tenantId: 'inst-1', courseId: 'course-2', title: 'React on the Edge', content: 'Understanding frontend frameworks in a serverless world.' },
];
const MOCK_QUIZZES: Quiz[] = [
    {
        id: 'quiz-1-1',
        tenantId: 'inst-1',
        lessonId: 'lesson-1-1',
        title: 'Mesozoic Era Checkpoint',
        questions: [
            { id: 'q1', text: 'Which period is NOT part of the Mesozoic Era?', options: ['Triassic', 'Jurassic', 'Cretaceous', 'Paleozoic'], correctAnswer: 3 },
            { id: 'q2', text: 'What is the defining feature of the Cretaceous period?', options: ['First dinosaurs', 'Rise of mammals', 'Widespread chalk deposits', 'Pangaea formation'], correctAnswer: 2 },
        ]
    }
];
const MOCK_FLASHCARD_DECKS: FlashcardDeck[] = [
    {
        id: 'deck-1',
        tenantId: 'inst-1',
        title: 'Cloudflare Terminology',
        description: 'Key terms and concepts for the Cloudflare ecosystem.',
        userId: 'user-teacher-1',
        cards: [
            { id: 'card-1-1', deckId: 'deck-1', question: 'What is a Worker?', answer: 'A serverless execution environment that allows you to create and deploy applications on Cloudflare\'s global network.' },
            { id: 'card-1-2', deckId: 'deck-1', question: 'What is a Durable Object?', answer: 'A single-threaded, stateful object that provides strong consistency for applications running on Cloudflare Workers.' },
            { id: 'card-1-3', deckId: 'deck-1', question: 'What is R2?', answer: 'Cloudflare\'s zero-egress fee object storage solution.' },
        ]
    },
    {
        id: 'deck-2',
        tenantId: 'inst-1',
        title: 'React Hooks',
        description: 'Commonly used hooks in React.',
        userId: 'user-student-1',
        cards: [
            { id: 'card-2-1', deckId: 'deck-2', question: 'useState', answer: 'A hook that lets you add React state to function components.' },
            { id: 'card-2-2', deckId: 'deck-2', question: 'useEffect', answer: 'A hook that lets you perform side effects in function components.' },
        ]
    }
];
const MOCK_PENDING_TENANTS: PendingTenant[] = [];
const MOCK_RESOURCES: Resource[] = [
    { id: 'res-1', tenantId: 'inst-1', title: 'Intro to Workers PDF', description: 'A comprehensive guide to Cloudflare Workers.', fileUrl: 'https://via.placeholder.com/300x400?text=PDF', category: 'Documents', lessonId: 'lesson-2-1', creatorId: 'user-teacher-1', downloads: 5, createdAt: new Date().toISOString() },
    { id: 'res-2', tenantId: 'inst-1', title: 'T-Rex Skeleton Diagram', description: 'Anatomy of a Tyrannosaurus Rex.', fileUrl: 'https://images.unsplash.com/photo-1599008633841-92dec59f7186?q=80&w=800', category: 'Images', lessonId: 'lesson-1-1', creatorId: 'user-teacher-1', downloads: 12, createdAt: new Date().toISOString() },
];
// INSTITUTION ENTITY
export class InstitutionEntity extends IndexedEntity<Institution> {
  static readonly entityName = "institution";
  static readonly indexName = "institutions";
  static readonly initialState: Institution = { id: "", name: "", country: "", curriculum: "", languages: [], adminEmail: "" };
  static seedData = MOCK_INSTITUTIONS;
}
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", tenantId: "", name: "", role: 'student' };
  static seedData = MOCK_USERS;
}
// COURSE ENTITY
export class CourseEntity extends IndexedEntity<Course> {
  static readonly entityName = "course";
  static readonly indexName = "courses";
  static readonly initialState: Course = { id: "", tenantId: "", title: "", description: "", teacherId: "" };
  static seedData = MOCK_COURSES;
}
// LESSON ENTITY
export class LessonEntity extends IndexedEntity<Lesson> {
  static readonly entityName = "lesson";
  static readonly indexName = "lessons";
  static readonly initialState: Lesson = { id: "", tenantId: "", courseId: "", title: "", content: "" };
  static seedData = MOCK_LESSONS;
}
// QUIZ ENTITY
export class QuizEntity extends IndexedEntity<Quiz> {
  static readonly entityName = "quiz";
  static readonly indexName = "quizzes";
  static readonly initialState: Quiz = { id: "", tenantId: "", lessonId: "", title: "", questions: [] };
  static seedData = MOCK_QUIZZES;
}
// FLASHCARD DECK ENTITY
export class FlashcardDeckEntity extends IndexedEntity<FlashcardDeck> {
  static readonly entityName = "flashcardDeck";
  static readonly indexName = "flashcardDecks";
  static readonly initialState: FlashcardDeck = { id: "", tenantId: "", title: "", description: "", userId: "" };
  static seedData = MOCK_FLASHCARD_DECKS;
}
// ENROLLMENT ENTITY
export class EnrollmentEntity extends IndexedEntity<Enrollment> {
  static readonly entityName = "enrollment";
  static readonly indexName = "enrollments";
  static readonly initialState: Enrollment = { id: "", tenantId: "", courseId: "", studentId: "" };
}
// QUIZ SUBMISSION ENTITY
export class QuizSubmissionEntity extends IndexedEntity<QuizSubmission> {
  static readonly entityName = "quizSubmission";
  static readonly indexName = "quizSubmissions";
  static readonly initialState: QuizSubmission = { id: "", tenantId: "", quizId: "", studentId: "", score: 0, submittedAt: "" };
}
// PENDING TENANT ENTITY
export class PendingTenantEntity extends IndexedEntity<PendingTenant> {
  static readonly entityName = "pendingTenant";
  static readonly indexName = "pendingTenants";
  static readonly initialState: PendingTenant = { id: "", name: "", country: "", curriculum: "", languages: [], adminEmail: "", status: 'pending', requestedAt: "" };
  static seedData = MOCK_PENDING_TENANTS;
}
// MOCK EXAM ENTITY
export class MockExamEntity extends IndexedEntity<MockExam> {
  static readonly entityName = "mockExam";
  static readonly indexName = "mockExams";
  static readonly initialState: MockExam = {
    id: "",
    tenantId: "",
    title: "",
    teacherId: "",
    duration: 60,
    questions: [],
    createdAt: ""
  };
  static seedData: MockExam[] = [];
}
// MOCK EXAM SUBMISSION ENTITY
export class MockExamSubmissionEntity extends IndexedEntity<MockExamSubmission> {
  static readonly entityName = "mockExamSubmission";
  static readonly indexName = "mockExamSubmissions";
  static readonly initialState: MockExamSubmission = {
    id: "",
    tenantId: "",
    examId: "",
    studentId: "",
    score: 0,
    timeTaken: 0,
    submittedAt: ""
  };
}
// RESOURCE ENTITY
export class ResourceEntity extends IndexedEntity<Resource> {
    static readonly entityName = "resource";
    static readonly indexName = "resources";
    static readonly initialState: Resource = {
        id: "",
        tenantId: "",
        title: "",
        fileUrl: "",
        category: "Documents",
        creatorId: "",
        downloads: 0,
        createdAt: ""
    };
    static seedData = MOCK_RESOURCES;
}