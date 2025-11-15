import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AcademiCloudSidebar } from "@/components/AcademiCloudSidebar";
import { useAuthStore } from "@/store/auth";
import { Toaster } from "@/components/ui/sonner";
export function AppLayout({ children }: { children?: React.ReactNode }): JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) {
    // Render nothing while redirecting
    return <></>;
  }
  return (
    <div className="flex h-screen bg-muted/40">
      <AcademiCloudSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>
      <Toaster richColors />
    </div>
  );
}