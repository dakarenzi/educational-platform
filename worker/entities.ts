import { IndexedEntity } from "./core-utils";
import type { User, Course, Lesson, Quiz } from "@shared/types";
const MOCK_USERS: User[] = [
  { id: 'user-admin-1', name: 'Dr. Evelyn Reed', role: 'admin', avatarUrl: 'https://i.pravatar.cc/150?u=admin1' },
  { id: 'user-teacher-1', name: 'Prof. Alan Grant', role: 'teacher', avatarUrl: 'https://i.pravatar.cc/150?u=teacher1' },
  { id: 'user-student-1', name: 'Sam Neill', role: 'student', avatarUrl: 'https://i.pravatar.cc/150?u=student1' },
  { id: 'user-student-2', name: 'Laura Dern', role: 'student', avatarUrl: 'https://i.pravatar.cc/150?u=student2' },
];
const MOCK_COURSES: Course[] = [
    { id: 'course-1', title: 'Introduction to Paleontology', description: 'Discover the world of dinosaurs and ancient life.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1582573543323-626b11696f43?q=80&w=800' },
    { id: 'course-2', title: 'Modern Web Development', description: 'Learn to build fast, modern websites with Cloudflare.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800' },
    { id: 'course-3', title: 'Creative Writing Workshop', description: 'Unleash your inner storyteller and craft compelling narratives.', teacherId: 'user-teacher-1', imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800' },
];
const MOCK_LESSONS: Lesson[] = [
    { id: 'lesson-1-1', courseId: 'course-1', title: 'The Mesozoic Era', content: 'A deep dive into the age of dinosaurs.' },
    { id: 'lesson-1-2', courseId: 'course-1', title: 'Fossil Hunting 101', content: 'Techniques for finding and identifying fossils.' },
    { id: 'lesson-2-1', courseId: 'course-2', title: 'Building with Hono', content: 'Creating serverless APIs on Cloudflare Workers.' },
    { id: 'lesson-2-2', courseId: 'course-2', title: 'React on the Edge', content: 'Understanding frontend frameworks in a serverless world.' },
];
const MOCK_QUIZZES: Quiz[] = [
    {
        id: 'quiz-1-1',
        lessonId: 'lesson-1-1',
        title: 'Mesozoic Era Checkpoint',
        questions: [
            { id: 'q1', text: 'Which period is NOT part of the Mesozoic Era?', options: ['Triassic', 'Jurassic', 'Cretaceous', 'Paleozoic'], correctAnswer: 3 },
            { id: 'q2', text: 'What is the defining feature of the Cretaceous period?', options: ['First dinosaurs', 'Rise of mammals', 'Widespread chalk deposits', 'Pangaea formation'], correctAnswer: 2 },
        ]
    }
];
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", role: 'student' };
  static seedData = MOCK_USERS;
}
// COURSE ENTITY
export class CourseEntity extends IndexedEntity<Course> {
  static readonly entityName = "course";
  static readonly indexName = "courses";
  static readonly initialState: Course = { id: "", title: "", description: "", teacherId: "" };
  static seedData = MOCK_COURSES;
}
// LESSON ENTITY
export class LessonEntity extends IndexedEntity<Lesson> {
  static readonly entityName = "lesson";
  static readonly indexName = "lessons";
  static readonly initialState: Lesson = { id: "", courseId: "", title: "", content: "" };
  static seedData = MOCK_LESSONS;
}
// QUIZ ENTITY
export class QuizEntity extends IndexedEntity<Quiz> {
  static readonly entityName = "quiz";
  static readonly indexName = "quizzes";
  static readonly initialState: Quiz = { id: "", lessonId: "", title: "", questions: [] };
  static seedData = MOCK_QUIZZES;
}