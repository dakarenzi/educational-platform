import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, Eye, FilePenLine, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Course } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CourseForm } from '@/components/forms/CourseForm';
const fetchTeacherCourses = async (): Promise<Course[]> => {
  return api<Course[]>('/api/teacher/courses');
};
export default function TeacherCoursesPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: fetchTeacherCourses,
  });
  const createCourseMutation = useMutation({
    mutationFn: (newCourse: Omit<Course, 'id' | 'lessons' | 'tenantId'> & { tenantId: string }) => api<Course>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(newCourse),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully!');
      setDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create course.');
    },
  });
  const updateCourseMutation = useMutation({
    mutationFn: (updatedCourse: Pick<Course, 'id' | 'title' | 'description'>) => api<Course>(`/api/courses/${updatedCourse.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedCourse),
    }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        toast.success('Course updated successfully!');
        setDialogOpen(false);
        setEditingCourse(null);
    },
    onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to update course.');
    },
  });
  const handleFormSubmit = (values: { title: string; description: string }) => {
    if (editingCourse) {
        updateCourseMutation.mutate({ ...values, id: editingCourse.id });
    } else {
        if (!user) {
            toast.error('You must be logged in to create a course.');
            return;
        }
        createCourseMutation.mutate({ ...values, teacherId: user.id, tenantId: 'inst-1' });
    }
  };
  const openCreateDialog = () => {
    setEditingCourse(null);
    setDialogOpen(true);
  };
  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Manage Your Courses</h1>
          <p className="mt-2 text-lg text-muted-foreground">Here are all the courses you've created.</p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
            <PlusCircle className="h-5 w-5" />
            Create New Course
        </Button>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create a New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update the details for your course.' : 'Fill in the details below to create a new course.'}
              </DialogDescription>
            </DialogHeader>
            <CourseForm
                onSubmit={handleFormSubmit}
                isLoading={createCourseMutation.isPending || updateCourseMutation.isPending}
                initialData={editingCourse || undefined}
            />
          </DialogContent>
        </Dialog>
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-1" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
            </Card>
          ))}
        </div>
      )}
      {error && <p className="text-destructive">Failed to load your courses. Please try again later.</p>}
      {!isLoading && !error && (
        courses?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">You haven't created any courses yet.</h3>
            <p className="text-muted-foreground mt-2 mb-4">Click the button above to get started.</p>
            <Button onClick={openCreateDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Course
            </Button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {courses?.map((course) => (
              <motion.div key={course.id} variants={itemVariants}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{course.title}</CardTitle>
                        <CardDescription className="mt-1">{course.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={`/app/courses/${course.id}`}><Eye className="mr-2 h-4 w-4" />View Course</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(course)}><FilePenLine className="mr-2 h-4 w-4" />Edit Course</DropdownMenuItem>
                          <DropdownMenuItem asChild><Link to="/app/analytics"><BarChart2 className="mr-2 h-4 w-4" />View Analytics</Link></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {/* Could show stats here in the future, e.g., number of lessons, students enrolled */}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/app/courses/${course.id}`}>Manage Course</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
}