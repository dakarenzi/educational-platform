import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AcademiCloudSidebar } from "@/components/AcademiCloudSidebar";
import { useAuthStore } from "@/store/auth";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
export function AppLayout({ children }: { children?: React.ReactNode }): JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const navigate = useNavigate();
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    // Render nothing while redirecting to prevent flashing of content
    return null;
  }
  return (
    <div className="flex h-screen bg-muted/40">
      <AcademiCloudSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </div>
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}