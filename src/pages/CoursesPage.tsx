import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { Course } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
const fetchCourses = async (): Promise<Course[]> => {
  return api<Course[]>('/api/courses');
};
export default function CoursesPage() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Courses</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Browse available courses or create a new one.
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <PlusCircle className="h-5 w-5" />
            Create Course
          </Button>
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6 mt-1" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-28" />
                </CardFooter>
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
                <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className="p-0">
                    <img src={course.imageUrl || 'https://via.placeholder.com/400x200'} alt={course.title} className="w-full h-48 object-cover" />
                  </CardHeader>
                  <CardContent className="flex-grow pt-6">
                    <CardTitle className="text-xl font-semibold">{course.title}</CardTitle>
                    <CardDescription className="mt-2">{course.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">View Course</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}