import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, FilePenLine, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
// Placeholder for QuizForm, assuming it will be created
// import { QuizForm } from '@/components/forms/QuizForm';
const fetchTeacherQuizzes = async (): Promise<Quiz[]> => {
  return api<Quiz[]>('/api/teacher/quizzes', { headers: { 'X-Mock-Role': 'teacher' } });
};
export default function TeacherQuizzesPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading, error } = useQuery({
    queryKey: ['teacher-quizzes'],
    queryFn: fetchTeacherQuizzes,
  });
  // Mutations would be here, similar to TeacherCoursesPage
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
          <h1 className="text-3xl font-bold font-display text-foreground">Manage Your Quizzes</h1>
          <p className="mt-2 text-lg text-muted-foreground">Here are all the quizzes you've created.</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Quiz creation is done from the course detail page.')}>
          <PlusCircle className="h-5 w-5" />
          Create New Quiz
        </Button>
      </div>
      {/* Dialog for creating/editing would be here */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))}
        </div>
      )}
      {error && <p className="text-destructive">Failed to load your quizzes. Please try again later.</p>}
      {!isLoading && !error && (
        quizzes?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">You haven't created any quizzes yet.</h3>
            <p className="text-muted-foreground mt-2 mb-4">Go to a course's lesson to create a quiz.</p>
            <Button asChild><Link to="/app/teacher/courses">Manage Courses</Link></Button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {quizzes?.map((quiz) => (
              <motion.div key={quiz.id} variants={itemVariants}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{quiz.title}</CardTitle>
                        <CardDescription className="mt-1">Attached to Lesson ID: {quiz.lessonId}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('Editing is done from the course detail page.')}><FilePenLine className="mr-2 h-4 w-4" />Edit Quiz</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Delete Quiz
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action is not implemented yet.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Badge>{quiz.questions.length} Questions</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
}