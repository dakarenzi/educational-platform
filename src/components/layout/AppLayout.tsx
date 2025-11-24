import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AcademiCloudSidebar } from "@/components/AcademiCloudSidebar";
import { useAuthStore } from "@/store/auth";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
export function AppLayout({ children }: { children?: React.ReactNode }): JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
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