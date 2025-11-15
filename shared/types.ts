export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'admin' | 'teacher' | 'student';
export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}
export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  imageUrl?: string;
  lessons?: Lesson[];
}
export interface Lesson {
  id: string;
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
  title: string;
  description: string;
  userId: string; // The user who created the deck
  cards?: Flashcard[];
}