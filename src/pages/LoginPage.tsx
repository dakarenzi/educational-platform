import { BookOpen, GraduationCap, UserCog, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@shared/types';
const roleData: Record<UserRole, { icon: React.ElementType; title: string; description: string }> = {
  student: {
    icon: GraduationCap,
    title: 'Student',
    description: 'Access courses, take quizzes, and track your progress.',
  },
  teacher: {
    icon: BookOpen,
    title: 'Teacher',
    description: 'Create courses, manage lessons, and view analytics.',
  },
  admin: {
    icon: UserCog,
    title: 'Admin',
    description: 'Manage the platform, users, and institutional settings.',
  },
  'super-admin': {
    icon: Shield,
    title: 'Super Admin',
    description: 'Manage platform-wide tenants and analytics.',
  },
};
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const handleLogin = (role: UserRole) => {
    // In a real app, this would involve an API call. Here we mock it.
    const mockUser = {
      id: `user-${role}-1`,
      tenantId: 'inst-1', // Add tenantId to satisfy the User type
      name: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role,
    };
    login(mockUser);
    if (role === 'super-admin') {
        navigate('/app/super-admin');
    } else {
        navigate('/app/dashboard');
    }
  };
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,216,255,0.5),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(38,38,97,0.6),rgba(10,10,20,0))] -z-10" />
      <div className="text-center mb-12">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground">
          Welcome to AcademiCloud
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          The illustrative educational platform to create, manage, and deliver engaging online learning experiences.
        </p>
      </div>
      <div>
        <Card className="w-full max-w-md mx-auto md:max-w-lg shadow-xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Select Your Role</CardTitle>
            <CardDescription>Choose how you'd like to sign in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-hidden">
            {(['student', 'teacher', 'admin', 'super-admin'] as UserRole[]).map((role) => {
              const Icon = roleData[role].icon;
              return (
                <Button
                  key={role}
                  onClick={() => handleLogin(role)}
                  className="w-full h-auto min-h-[80px] py-4 justify-start text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:bg-primary/10"
                  variant="outline"
                >
                  <Icon className="w-8 h-8 mr-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="font-semibold text-base">{roleData[role].title}</p>
                    <p className="text-sm text-muted-foreground whitespace-normal">
                      {roleData[role].description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <footer className="absolute bottom-6 text-center text-muted-foreground/80 text-sm">
        <p>Built with ❤️ at Cloudflare</p>
      </footer>
    </div>
  );
}