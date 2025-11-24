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
  FileText,
  MessageCircle,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { Institution, UserRole } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
const navItems: { to: string; icon: React.ElementType; label: string; roles?: UserRole[]; external?: boolean }[] = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/courses', icon: Book, label: 'Courses' },
  { to: '/app/flashcards', icon: Presentation, label: 'Flashcards' },
  { to: '/app/tutor', icon: Sparkles, label: 'AI Tutor' },
  { to: '/app/mock-exams', icon: ClipboardList, label: 'Mock Exams', roles: ['admin', 'teacher', 'student'] },
  { to: '/app/resources', icon: FileText, label: 'Resources', roles: ['admin', 'teacher', 'student'] },
  { to: 'https://community.academicloud.com/discord', icon: MessageCircle, label: 'Community', external: true },
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
  const NavItem = ({ to, icon: Icon, label, external }: { to: string; icon: React.ElementType; label: string; external?: boolean }) => {
    const commonClasses = 'group flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';
    const content = (
      <>
        <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <Icon className="h-5 w-5 flex-shrink-0" />
        </motion.div>
        <span className="hidden md:inline">{label}</span>
      </>
    );
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {external ? (
            <a href={to} target="_blank" rel="noopener noreferrer" className={commonClasses}>
              {content}
            </a>
          ) : (
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  commonClasses,
                  isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground'
                )
              }
            >
              {content}
            </NavLink>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" className="md:hidden">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };
  return (
    <aside className="flex flex-col w-20 md:w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm transition-all duration-300">
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3 min-h-[69px]">
        <GraduationCap className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="hidden md:block flex-1 min-w-0">
          {isLoading ? (
            <Skeleton className="h-6 w-36" />
          ) : (
            <h1 className="text-lg font-bold font-display text-sidebar-foreground truncate">
              {institution?.name || 'AcademiCloud'}
            </h1>
          )}
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider>
          {visibleNavItems.map((item) => <NavItem key={item.label} {...item} />)}
          {isStudent && (
             <>
              <Separator className="my-2 bg-sidebar-border" />
              {studentNavItems.map((item) => <NavItem key={item.label} {...item} />)}
            </>
          )}
          {isTeacherOrAdmin && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {teacherNavItems.map((item) => <NavItem key={item.label} {...item} />)}
            </>
          )}
          {isSuperAdmin && (
            <>
              <Separator className="my-2 bg-sidebar-border" />
              {superAdminNavItems.map((item) => <NavItem key={item.label} {...item} />)}
            </>
          )}
        </TooltipProvider>
      </nav>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <TooltipProvider>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Avatar>
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{user?.name ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-sm truncate">{user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="hidden md:inline-flex">
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Log Out</p></TooltipContent>
            </Tooltip>
          </div>
          <div className="flex md:hidden items-center justify-center mt-2">
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Log Out</p></TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </aside>
  );
}