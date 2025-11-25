import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { GDPRConsentBanner } from '@/components/GDPRConsentBanner';
import { AuthInitializer } from '@/store/auth';
import { errorReporter } from '@/lib/errorReporter';
import { router } from './main'; // Import router from main.tsx
export default function App() {
  const { i18n } = useTranslation();
  useEffect(() => {
    // Global Error Handlers
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason || {};
      errorReporter.report({
        message: (error as Error).message || 'Unhandled promise rejection',
        stack: (error as Error).stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        source: 'unhandledrejection',
        error: event.reason,
        level: 'error',
      });
    };
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error) {
        errorReporter.report({
          message: event.message,
          stack: event.error.stack,
          url: event.filename,
          timestamp: new Date().toISOString(),
          source: 'global-error',
          error: event.error,
          level: 'error',
        });
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);
  if (!i18n.isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AuthInitializer />
      <RouterProvider router={router} />
      <Toaster richColors position="bottom-right" />
      <GDPRConsentBanner />
    </Suspense>
  );
}