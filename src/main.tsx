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
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/HomePage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import TutorPage from '@/pages/TutorPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
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
        { path: "flashcards", element: <FlashcardsPage /> },
        { path: "tutor", element: <TutorPage /> },
        { path: "analytics", element: <AnalyticsPage /> },
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