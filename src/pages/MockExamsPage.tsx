import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { MockExam } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
const fetchMockExams = async (): Promise<MockExam[]> => api<MockExam[]>('/api/mock-exams');
export default function MockExamsPage() {
  const user = useAuthStore(s => s.user);
  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['mock-exams'],
    queryFn: fetchMockExams,
  });
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const hasTakenExam = (exam: MockExam) => {
    return exam.submissions?.some(s => s.studentId === user?.id);
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Mock Exams</h1>
            <p className="mt-2 text-lg text-muted-foreground">Test your knowledge with our practice exams.</p>
          </div>
          {isTeacherOrAdmin && (
            <Button asChild>
              <Link to="/app/teacher/mock-exams">
                <PlusCircle className="mr-2 h-4 w-4" />
                Manage Exams
              </Link>
            </Button>
          )}
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        )}
        {error && <p className="text-destructive">Failed to load exams. Please try again later.</p>}
        {!isLoading && !error && exams && (
          exams.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No Mock Exams Available</h3>
              <p className="text-muted-foreground mt-2">
                {isTeacherOrAdmin
                  ? "You haven't created any exams yet. Click 'Manage Exams' to get started."
                  : "Please check back later, or ask your teacher to create one."}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {exams.map((exam) => (
                <motion.div key={exam.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">{exam.title}</CardTitle>
                      <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{exam.duration} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>{exam.questions.length} questions</span>
                      </div>
                      {hasTakenExam(exam) && (
                        <Badge variant="success" className="mt-2">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/app/mock-exams/${exam.id}`}>
                          {hasTakenExam(exam) ? 'Review Exam' : 'Start Exam'}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}