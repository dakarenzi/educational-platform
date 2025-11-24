export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Institution {
  id: string;
  name: string;
  approvedFromRequest?: string;
  country?: string;
  curriculum?: string;
  languages?: string[];
  adminEmail?: string;
}
export type UserRole = 'admin' | 'teacher' | 'student' | 'super-admin';
export interface User {
  id: string;
  tenantId: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}
export interface SuperAdminUser extends User {
  role: 'super-admin';
}
export interface Course {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  teacherId: string;
  imageUrl?: string;
  lessons?: Lesson[];
}
export interface Lesson {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  content: string; // Can be markdown or JSON for a block editor
  quiz?: Quiz;
}
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of the correct option
}
export interface Quiz {
  id: string;
  tenantId: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
}
export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
}
export interface FlashcardDeck {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  userId: string; // The user who created the deck
  cards?: Flashcard[];
}
export interface Enrollment {
  id: string; // e.g., `${studentId}-${courseId}`
  tenantId: string;
  courseId: string;
  studentId: string;
}
export interface QuizSubmission {
  id: string; // e.g., `${studentId}-${quizId}`
  tenantId: string;
  quizId: string;
  studentId: string;
  score: number; // Percentage score
  submittedAt: string; // ISO 8601 date string
}
export interface PendingTenant {
  id: string;
  name: string;
  country: string;
  curriculum: string;
  languages: string[];
  adminEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationDomain?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  notes?: string;
}
export type MockExamQuestion = QuizQuestion;
export interface MockExamSubmission {
  id: string; // e.g., `${studentId}-${examId}-${attemptId}`
  tenantId: string;
  examId: string;
  studentId: string;
  score: number; // Percentage
  timeTaken: number; // Seconds
  submittedAt: string; // ISO date
  answers?: Record<number, number>; // Optional: for detailed review
}
export interface MockExam {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  teacherId: string;
  duration: number; // Minutes
  questions: MockExamQuestion[];
  submissions?: MockExamSubmission[];
  createdAt: string;
}