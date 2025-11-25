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
  // Stripe Monetization Fields
  plan?: 'trial' | 'basic' | 'pro';
  stripeCustomerId?: string;
  status?: 'active' | 'canceled' | 'trialing';
  nextBilling?: number; // Unix timestamp
}
export type UserRole = 'admin' | 'teacher' | 'student' | 'super-admin';
export interface User {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  passwordHash?: string;
  // Student Subscription Fields
  subscriptionStatus?: 'free' | 'premium';
  paymentId?: string;
  expiry?: number; // Unix timestamp
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
  isPremium?: boolean;
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
export interface Resource {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  fileUrl: string; // Mock URL
  category: 'Documents' | 'Images' | 'Videos' | 'Links';
  lessonId?: string;
  creatorId: string;
  downloads: number;
  createdAt: string;
}
export interface StudentSubscription {
  id: string;
  userId: string;
  tenantId: string;
  plan: 'premium';
  status: 'active' | 'canceled';
  expiry: number; // Unix timestamp
  paymentId: string;
}
// Auth Types
export interface LoginResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}
export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  iat: number;
  exp: number;
}