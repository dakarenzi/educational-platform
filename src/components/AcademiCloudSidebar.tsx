import {
  Book,
  BrainCircuit,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Presentation,
  Sparkles,
  PenSquare,
  ClipboardCheck,
  Shield,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { Institution } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/courses', icon: Book, label: 'Courses' },
  { to: '/app/flashcards', icon: Presentation, label: 'Flashcards' },
  { to: '/app/tutor', icon: Sparkles, label: 'AI Tutor' },
  { to: '/app/analytics', icon: BrainCircuit, label: 'Analytics', roles: ['admin', 'teacher'] },
];
const studentNavItems = [
    { to: '/app/my-progress', icon: ClipboardCheck, label: 'My Progress' },
];
const teacherNavItems = [
    { to: '/app/teacher/dashboard', icon: PenSquare, label: 'Teacher Tools' },
];
const superAdminNavItems = [
    { to: '/app/super-admin', icon: Shield, label: 'Super Admin' },
];
const fetchInstitution = async (): Promise<Institution> => {
  return api<Institution>('/api/institution');
};
export function AcademiCloudSidebar() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { data: institution, isLoading } = useQuery({
    queryKey: ['institution'],
    queryFn: fetchInstitution,
  });
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isSuperAdmin = user?.role === 'super-admin';
  const visibleNavItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));
  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        {isLoading ? (
          <Skeleton className="h-6 w-36" />
        ) : (
          <h1 className="text-xl font-bold font-display text-sidebar-foreground">{institution?.name || 'AcademiCloud'}</h1>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider>
          {visibleNavItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {isStudent && (
             <>
              <Separator className="my-2 bg-sidebar-border" />
              {studentNavItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
          {isTeacherOrAdmin && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {teacherNavItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
          {isSuperAdmin && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {superAdminNavItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
        </TooltipProvider>
      </nav>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Log Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}