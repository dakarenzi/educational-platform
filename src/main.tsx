import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode, Suspense } from 'react'
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
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import { Loader2 } from 'lucide-react';
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
import QuizzesPage from '@/pages/QuizzesPage';
import BillingPage from '@/pages/BillingPage';
import SettingsPage from '@/pages/SettingsPage';
import ParentDashboardPage from '@/pages/ParentDashboardPage';
// Teacher Tools
import { TeacherLayout } from '@/components/layout/TeacherLayout';
import TeacherDashboardPage from '@/pages/teacher/TeacherDashboardPage';
import TeacherCoursesPage from '@/pages/teacher/TeacherCoursesPage';
import TeacherFlashcardsPage from '@/pages/teacher/TeacherFlashcardsPage';
import TeacherMockExamsPage from '@/pages/teacher/TeacherMockExamsPage';
import TeacherResourcesPage from '@/pages/teacher/TeacherResourcesPage';
import TeacherQuizzesPage from '@/pages/teacher/TeacherQuizzesPage';
const queryClient = new QueryClient();
export const router = createBrowserRouter([
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
        { path: "quizzes", element: <QuizzesPage /> },
        { path: "flashcards", element: <FlashcardsPage /> },
        { path: "flashcards/:deckId", element: <FlashcardDeckPage /> },
        { path: "tutor", element: <TutorPage /> },
        { path: "analytics", element: <AnalyticsPage /> },
        { path: "mock-exams", element: <MockExamsPage /> },
        { path: "mock-exams/:examId", element: <MockExamTakerPage /> },
        { path: "resources", element: <ResourcesPage /> },
        { path: "my-progress", element: <MyProgressPage /> },
        { path: "billing", element: <BillingPage /> },
        { path: "settings", element: <SettingsPage />, errorElement: <RouteErrorBoundary /> },
        { path: "super-admin", element: <SuperAdminDashboard /> },
        { path: "parent", element: <ParentDashboardPage />, errorElement: <RouteErrorBoundary /> },
        {
          path: "teacher",
          element: <TeacherLayout />,
          children: [
            { index: true, element: <Navigate to="/app/teacher/dashboard" replace /> },
            { path: "dashboard", element: <TeacherDashboardPage /> },
            { path: "courses", element: <TeacherCoursesPage /> },
            { path: "quizzes", element: <TeacherQuizzesPage /> },
            { path: "flashcards", element: <TeacherFlashcardsPage /> },
            { path: "mock-exams", element: <TeacherMockExamsPage /> },
            { path: "resources", element: <TeacherResourcesPage /> },
          ]
        }
    ]
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)