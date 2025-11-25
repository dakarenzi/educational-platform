import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, PlusCircle, FilePenLine, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Course, Lesson } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LessonForm } from '@/components/forms/LessonForm';
import { Separator } from '@/components/ui/separator';
const fetchCourse = async (courseId: string): Promise<Course> => {
  return api<Course>(`/api/courses/${courseId}`);
};
export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [isAddLessonDialogOpen, setAddLessonDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });
  const addLessonMutation = useMutation({
    mutationFn: (newLesson: Omit<Lesson, 'id' | 'tenantId'> & { tenantId: string }) => api<Lesson>('/api/lessons', {
      method: 'POST',
      body: JSON.stringify(newLesson),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success('Lesson added successfully!');
      setAddLessonDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add lesson.');
    },
  });
  const handleAddLesson = (values: { title: string; content: string }) => {
    if (!courseId) return;
    addLessonMutation.mutate({ ...values, courseId, tenantId: 'inst-1' });
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
          <div>
            <Skeleton className="h-8 w-1/2 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-destructive">Failed to load course details.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/app/courses">Go back to courses</Link>
        </Button>
      </div>
    );
  }
  if (!course) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/app/courses"><ArrowLeft className="mr-2 h-4 w-4" />Back to Courses</Link>
          </Button>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative aspect-video w-full mb-6">
              <img src={course.imageUrl} alt={course.title} className="rounded-lg object-cover w-full h-full" />
            </div>
            <h1 className="text-4xl font-bold font-display text-foreground mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6" /><span>Course Lessons</span></CardTitle>
                  {isTeacherOrAdmin && (
                    <Dialog open={isAddLessonDialogOpen} onOpenChange={setAddLessonDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1">
                          <PlusCircle className="h-4 w-4" /> Add Lesson
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add a New Lesson</DialogTitle>
                          <DialogDescription>Fill in the details for the new lesson.</DialogDescription>
                        </DialogHeader>
                        <LessonForm onSubmit={handleAddLesson} isLoading={addLessonMutation.isPending} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {course.lessons && course.lessons.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {course.lessons.map((lesson, index) => (
                      <AccordionItem value={`item-${index}`} key={lesson.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="text-left">{lesson.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pl-12 space-y-4">
                          <p>{lesson.content}</p>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">Quiz</h4>
                            {lesson.quiz ? (
                                isTeacherOrAdmin ? (
                                    <Button asChild size="sm" variant="secondary">
                                        <Link to={`/app/lesson/${lesson.id}/quiz`}><FilePenLine className="mr-2 h-4 w-4" />Edit Quiz</Link>
                                    </Button>
                                ) : (
                                    <Button asChild size="sm">
                                        <Link to={`/app/quiz/${lesson.quiz.id}`}><ClipboardCheck className="mr-2 h-4 w-4" />Take Quiz ({lesson.quiz.questions.length} questions)</Link>
                                    </Button>
                                )
                            ) : isTeacherOrAdmin ? (
                                <Button asChild size="sm" variant="outline">
                                    <Link to={`/app/lesson/${lesson.id}/quiz`}><PlusCircle className="mr-2 h-4 w-4" />Create Quiz</Link>
                                </Button>
                            ) : (
                                <p className="text-xs text-muted-foreground">No quiz available yet.</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No lessons have been added to this course yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}