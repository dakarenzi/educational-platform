import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Course } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourseForm } from '@/components/forms/CourseForm';
const fetchCourses = async (): Promise<Course[]> => {
  return api<Course[]>('/api/courses');
};
export default function CoursesPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
  const createCourseMutation = useMutation({
    mutationFn: (newCourse: Omit<Course, 'id' | 'lessons'>) => api<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(newCourse),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully!');
      setCreateDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create course.');
    },
  });
  const handleCreateCourse = (values: { title: string; description: string }) => {
    if (!user) {
      toast.error('You must be logged in to create a course.');
      return;
    }
    createCourseMutation.mutate({ ...values, teacherId: user.id });
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Courses</h1>
            <p className="mt-2 text-lg text-muted-foreground">Browse available courses or create a new one.</p>
          </div>
          {isTeacherOrAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Course</DialogTitle>
                  <DialogDescription>Fill in the details below to create a new course.</DialogDescription>
                </DialogHeader>
                <CourseForm onSubmit={handleCreateCourse} isLoading={createCourseMutation.isPending} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="p-0">
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {error && <p className="text-destructive">Failed to load courses. Please try again later.</p>}
        {!isLoading && !error && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {courses?.map((course) => (
              <motion.div key={course.id} variants={itemVariants}>
                <Link to={`/app/courses/${course.id}`} className="block h-full group">
                  <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <CardHeader className="p-0">
                      <img src={course.imageUrl || 'https://via.placeholder.com/400x200'} alt={course.title} className="w-full h-48 object-cover" />
                    </CardHeader>
                    <CardContent className="flex-grow pt-6">
                      <CardTitle className="text-xl font-semibold">{course.title}</CardTitle>
                      <CardDescription className="mt-2">{course.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}