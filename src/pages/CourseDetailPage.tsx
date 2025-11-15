import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { Course } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
const fetchCourse = async (courseId: string): Promise<Course> => {
  return api<Course>(`/api/courses/${courseId}`);
};
export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });
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
  if (!course) {
    return null;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/app/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-video w-full mb-6">
              <img src={course.imageUrl} alt={course.title} className="rounded-lg object-cover w-full h-full" />
            </div>
            <h1 className="text-4xl font-bold font-display text-foreground mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground">{course.description}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  <span>Course Lessons</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.lessons && course.lessons.length > 0 ? (
                  <ul className="space-y-3">
                    {course.lessons.map((lesson, index) => (
                      <li key={lesson.id}>
                        <a href="#" className="flex items-center p-3 -mx-3 rounded-lg hover:bg-muted transition-colors group">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="font-semibold text-foreground">{lesson.title}</p>
                            <p className="text-sm text-muted-foreground">{lesson.content.substring(0, 30)}...</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
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