import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckSquare, Search } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
interface EnrichedQuiz extends Quiz {
  lessonTitle?: string;
  courseTitle?: string;
  courseId?: string;
}
const fetchQuizzes = async (): Promise<EnrichedQuiz[]> => {
  return api<EnrichedQuiz[]>('/api/quizzes');
};
export default function QuizzesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore(s => s.user);
  const { data: quizzes, isLoading, error } = useQuery({
    queryKey: ['quizzes'],
    queryFn: fetchQuizzes,
  });
  const filteredQuizzes = useMemo(() => {
    if (!quizzes) return [];
    return quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [quizzes, searchQuery]);
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
        <div className="flex flex-wrap gap-4 justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Quizzes</h1>
            <p className="mt-2 text-lg text-muted-foreground">Test your knowledge or manage existing quizzes.</p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              className="pl-10 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        )}
        {error && <p className="text-destructive text-center">Failed to load quizzes.</p>}
        {!isLoading && !error && (
          filteredQuizzes.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No Quizzes Found</h3>
              <p className="text-muted-foreground mt-2">
                {isTeacherOrAdmin ? "Create a quiz from a course's lesson page." : "No quizzes are available at the moment."}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredQuizzes.map((quiz) => (
                <motion.div key={quiz.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription>
                        {quiz.lessonId ? (
                          <>Attached to: <Link to={`/app/courses/${quiz.courseId}`} className="hover:underline text-primary">{quiz.courseTitle}</Link></>
                        ) : 'Standalone Quiz'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <Badge>{quiz.questions.length} Questions</Badge>
                    </CardContent>
                    <CardFooter>
                      {isTeacherOrAdmin ? (
                        <Button asChild variant="secondary" className="w-full">
                          <Link to={quiz.lessonId ? `/app/lesson/${quiz.lessonId}/quiz` : `/app/teacher/quizzes`}>Manage Quiz</Link>
                        </Button>
                      ) : (
                        <Button asChild className="w-full">
                          <Link to={`/app/quiz/${quiz.id}`}>Take Quiz</Link>
                        </Button>
                      )}
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