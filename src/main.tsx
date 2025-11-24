import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
// Pages
import LoginPage from '@/pages/LoginPage';
import RequestTenantPage from '@/pages/RequestTenantPage';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import FlashcardDeckPage from '@/pages/FlashcardDeckPage';
import TutorPage from '@/pages/TutorPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import QuizCreatorPage from '@/pages/QuizCreatorPage';
import QuizTakerPage from '@/pages/QuizTakerPage';
import MyProgressPage from '@/pages/student/MyProgressPage';
import MockExamsPage from '@/pages/MockExamsPage';
import MockExamTakerPage from '@/pages/student/MockExamTakerPage';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import ResourcesPage from '@/pages/ResourcesPage';
// Teacher Tools
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import TeacherDashboardPage from '@/pages/teacher/TeacherDashboardPage';
import TeacherCoursesPage from '@/pages/teacher/TeacherCoursesPage';
import TeacherFlashcardsPage from '@/pages/teacher/TeacherFlashcardsPage';
import TeacherMockExamsPage from '@/pages/teacher/TeacherMockExamsPage';
import TeacherResourcesPage from '@/pages/teacher/TeacherResourcesPage';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/request-tenant",
    element: <RequestTenantPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/app",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
        { index: true, element: <Navigate to="/app/dashboard" replace /> },
        { path: "dashboard", element: <DashboardPage /> },
        { path: "courses", element: <CoursesPage /> },
        { path: "courses/:courseId", element: <CourseDetailPage /> },
        { path: "lesson/:lessonId/quiz", element: <QuizCreatorPage /> },
        { path: "quiz/:quizId", element: <QuizTakerPage /> },
        { path: "flashcards", element: <FlashcardsPage /> },
        { path: "flashcards/:deckId", element: <FlashcardDeckPage /> },
        { path: "tutor", element: <TutorPage /> },
        { path: "analytics", element: <AnalyticsPage /> },
        { path: "mock-exams", element: <MockExamsPage /> },
        { path: "mock-exams/:examId", element: <MockExamTakerPage /> },
        { path: "resources", element: <ResourcesPage /> },
        { path: "my-progress", element: <MyProgressPage /> },
        // Super-admin route with role check handled in the component/layout
        { path: "super-admin", element: <SuperAdminDashboard /> },
        {
          path: "teacher",
          element: <TeacherLayout />,
          children: [
            { index: true, element: <Navigate to="/app/teacher/dashboard" replace /> },
            { path: "dashboard", element: <TeacherDashboardPage /> },
            { path: "courses", element: <TeacherCoursesPage /> },
            { path: "flashcards", element: <TeacherFlashcardsPage /> },
            { path: "mock-exams", element: <TeacherMockExamsPage /> },
            { path: "resources", element: <TeacherResourcesPage /> },
          ]
        }
    ]
  },
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)