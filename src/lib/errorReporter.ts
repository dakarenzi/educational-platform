import { useAuthStore } from "@/store/auth";
interface ErrorData {
  message: string;
  stack?: string;
  url?: string;
  timestamp?: string;
  source?: string;
  error?: unknown;
  level?: 'error' | 'warning' | 'info';
  breadcrumbs?: string[];
}
const breadcrumbs: string[] = [];
const MAX_BREADCRUMBS = 20;
export function addBreadcrumb(breadcrumb: string) {
  if (breadcrumbs.length >= MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
  breadcrumbs.push(`[${new Date().toISOString()}] ${breadcrumb}`);
  console.log('[BREADCRUMB]', breadcrumb);
}
export async function report(errorData: ErrorData) {
  const user = useAuthStore.getState().user;
  const cleanError: Record<string, unknown> = {};
  if (errorData.error && typeof errorData.error === 'object') {
    // Avoid sending the whole error object, which might contain sensitive data.
    cleanError.message = (errorData.error as Error).message || 'Unknown error object';
    cleanError.stack = (errorData.error as Error).stack;
  }
  const cleanData = {
    ...errorData,
    userId: user ? `user_${user.id.slice(-4)}` : 'anonymous',
    breadcrumbs: [...breadcrumbs], // Send a copy
    error: cleanError,
  };
  // Sentry Simulation: In a real app, this would send to Sentry if a DSN is configured.
  // For this project, we log structured data to the console.
  console.error('[SENTRY_SIM] Error Report:', JSON.stringify(cleanData, null, 2));
  // Example of how it would work with a real service:
  // if (import.meta.env.VITE_SENTRY_DSN) {
  //   // fetch to Sentry API or use Sentry SDK
  // } else {
  //   console.warn('[SENTRY_SIM] DSN not configured, logging to console only.');
  // }
}
export const errorReporter = {
  report,
  addBreadcrumb,
};