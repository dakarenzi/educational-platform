import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import type { Course, Enrollment, QuizSubmission } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
interface EnrichedQuizSubmission extends QuizSubmission {
  quizTitle: string;
  courseTitle: string;
  courseId: string;
}
const fetchEnrollments = async (studentId: string): Promise<Enrollment[]> => {
  return api<Enrollment[]>(`/api/student/enrollments?studentId=${studentId}`);
};
const fetchCourses = async (): Promise<Course[]> => {
  return api<Course[]>('/api/courses');
};
const fetchSubmissions = async (studentId: string): Promise<EnrichedQuizSubmission[]> => {
  return api<EnrichedQuizSubmission[]>(`/api/student/submissions?studentId=${studentId}`);
};
export default function MyProgressPage() {
  const user = useAuthStore(s => s.user);
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: () => fetchEnrollments(user!.id),
    enabled: !!user && user.role === 'student',
  });
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: !!enrollments,
  });
  const { data: submissions, isLoading: isLoadingSubmissions, error: submissionsError } = useQuery({
    queryKey: ['submissions', user?.id],
    queryFn: () => fetchSubmissions(user!.id),
    enabled: !!user && user.role === 'student',
  });
  const enrolledCourses = courses?.filter(course =>
    enrollments?.some(e => e.courseId === course.id)
  );
  const isLoading = isLoadingEnrollments || isLoadingCourses || isLoadingSubmissions;
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold font-display text-foreground">My Progress</h1>
          <p className="mt-2 text-lg text-muted-foreground">Track your learning journey and quiz performance.</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-2xl font-semibold font-display mb-6">Enrolled Courses</h2>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
            {!isLoading && enrolledCourses && (
              enrolledCourses.length > 0 ? (
                <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
                  {enrolledCourses.map(course => (
                    <motion.div key={course.id} variants={itemVariants}>
                      <Link to={`/app/courses/${course.id}`}>
                        <Card className="hover:border-primary transition-colors">
                          <CardHeader className="flex flex-row items-center gap-4">
                            <img src={course.imageUrl || 'https://via.placeholder.com/150'} alt={course.title} className="w-20 h-20 rounded-md object-cover" />
                            <div>
                              <CardTitle>{course.title}</CardTitle>
                              <CardDescription>{course.description}</CardDescription>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
              )
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-semibold font-display mb-6">Quiz History</h2>
            <Card>
              <CardContent className="p-0">
                {isLoading && (
                  <div className="p-6">
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                )}
                {submissionsError && <p className="p-6 text-destructive">Failed to load quiz history.</p>}
                {!isLoading && !submissionsError && (
                  submissions?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map(sub => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <Link to={`/app/courses/${sub.courseId}`} className="font-medium hover:underline">{sub.quizTitle}</Link>
                              <p className="text-sm text-muted-foreground">{sub.courseTitle}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sub.score >= 80 ? 'success' : 'destructive'}>
                                {sub.score >= 80 ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                                {sub.score}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-sm">
                              {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center p-8">You haven't completed any quizzes yet.</p>
                  )
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}