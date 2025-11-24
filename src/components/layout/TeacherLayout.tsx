import React from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Presentation, LayoutDashboard, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
const teacherNavItems = [
  { to: '/app/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/teacher/courses', icon: Book, label: 'Manage Courses' },
  { to: '/app/teacher/flashcards', icon: Presentation, label: 'Manage Flashcards' },
  { to: '/app/teacher/mock-exams', icon: ClipboardList, label: 'Manage Mock Exams' },
];
export function TeacherLayout() {
  const user = useAuthStore(s => s.user);
  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4 px-2">Teacher Tools</h2>
                <nav className="flex flex-col space-y-1">
                  {teacherNavItems.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>
          <main className="md:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}