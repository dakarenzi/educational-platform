export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Institution {
  id: string;
  name: string;
}
export type UserRole = 'admin' | 'teacher' | 'student';
export interface User {
  id: string;
  tenantId: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
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