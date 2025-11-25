import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, CheckCircle, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api-client';
import type { Course, Enrollment, User } from '@shared/types';
import { useAuthStore, authActions } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseForm } from '@/components/forms/CourseForm';
import { Badge } from '@/components/ui/badge';
const fetchCourses = async (): Promise<Course[]> => api<Course[]>('/api/courses');
const fetchEnrollments = async (studentId: string): Promise<Enrollment[]> => api<Enrollment[]>(`/api/student/enrollments?studentId=${studentId}`);
export default function CoursesPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: courses, isLoading: isLoadingCourses, error: coursesError } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => fetchEnrollments(user!.id),
    enabled: !!user && user.role === 'student',
  });
  const enrolledCourseIds = useMemo(() => new Set(enrollments?.map(e => e.courseId) || []), [enrollments]);
  const createCourseMutation = useMutation({
    mutationFn: (newCourse: Omit<Course, 'id' | 'lessons' | 'tenantId'> & { tenantId: string }) => api<Course>('/api/courses', { method: 'POST', body: JSON.stringify(newCourse) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully!');
      setCreateDialogOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create course.'),
  });
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api('/api/enroll', { method: 'POST', body: JSON.stringify({ courseId, studentId: user!.id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrollments', user?.id] }),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to enroll.'),
  });
  const payMutation = useMutation({
    mutationFn: (courseId: string) => api('/api/student/subscriptions', { method: 'POST', body: JSON.stringify({ courseId }) }),
    onSuccess: async (_, courseId) => {
      toast.success('Payment successful! Enrolling you in the course...');
      const updatedUser = await api<User>(`/api/users/${user!.id}`);
      authActions.setUser(updatedUser);
      await enrollMutation.mutateAsync(courseId);
      toast.success('Successfully enrolled!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Payment failed.'),
  });
  const handleCreateCourse = (values: { title: string; description: string }) => {
    if (!user) return toast.error('You must be logged in.');
    createCourseMutation.mutate({ ...values, teacherId: user.id, tenantId: 'inst-1' });
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const isLoading = isLoadingCourses || (isStudent && isLoadingEnrollments);
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">{t('courses')}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{t('discoverCourses')}</p>
          </div>
          {isTeacherOrAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild><Button size="lg" className="gap-2"><PlusCircle className="h-5 w-5" />{t('createCourse')}</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>{t('createCourse')}</DialogTitle><DialogDescription>Fill in the details below to create a new course.</DialogDescription></DialogHeader>
                <CourseForm onSubmit={handleCreateCourse} isLoading={createCourseMutation.isPending} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}><CardHeader className="p-0"><Skeleton className="h-48 w-full" /></CardHeader><CardContent className="pt-6"><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-1" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
            ))}
          </div>
        )}
        {coursesError && <p className="text-destructive">Failed to load courses.</p>}
        {!isLoading && !coursesError && (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
            {courses?.map((course) => {
              const isEnrolled = isStudent && enrolledCourseIds.has(course.id);
              return (
                <motion.div key={course.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="p-0 relative">
                      <Link to={`/app/courses/${course.id}`} className="block">
                        <img src={course.imageUrl || 'https://via.placeholder.com/400x200'} alt={course.title} className="w-full h-48 object-cover" />
                      </Link>
                      {isEnrolled && <Badge className="absolute top-2 right-2 gap-1"><CheckCircle className="h-3 w-3" /> Enrolled</Badge>}
                      {course.isPremium && <Badge variant="secondary" className="absolute top-2 left-2 gap-1"><Star className="h-3 w-3 text-amber-400" /> Premium</Badge>}
                    </CardHeader>
                    <CardContent className="flex-grow pt-6">
                      <Link to={`/app/courses/${course.id}`}><CardTitle className="text-xl font-semibold hover:text-primary transition-colors">{course.title}</CardTitle></Link>
                      <CardDescription className="mt-2">{course.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                      {isStudent ? (
                        isEnrolled ? (
                          <Button asChild className="w-full"><Link to={`/app/courses/${course.id}`}>{t('goToCourse')}</Link></Button>
                        ) : course.isPremium && user.subscriptionStatus !== 'premium' ? (
                          <Button className="w-full" onClick={() => payMutation.mutate(course.id)} disabled={payMutation.isPending}>
                            {payMutation.isPending && payMutation.variables === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Pay to Enroll ($9.99)
                          </Button>
                        ) : (
                          <Button className="w-full" onClick={() => enrollMutation.mutate(course.id)} disabled={enrollMutation.isPending && enrollMutation.variables === course.id}>
                            {enrollMutation.isPending && enrollMutation.variables === course.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('enrollNow')}
                          </Button>
                        )
                      ) : (
                        <Button asChild className="w-full"><Link to={`/app/courses/${course.id}`}>View Course</Link></Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}