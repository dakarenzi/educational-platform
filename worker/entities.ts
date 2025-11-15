import { IndexedEntity } from "./core-utils";
import type { User, Course, UserRole } from "@shared/types";
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