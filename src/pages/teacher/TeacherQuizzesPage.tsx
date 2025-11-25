import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, FilePenLine, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { QuizForm, type QuizFormValues } from '@/components/forms/QuizForm';
import { useAuthStore } from '@/store/auth';
const fetchTeacherQuizzes = async (): Promise<Quiz[]> => {
  return api<Quiz[]>('/api/teacher/quizzes', { headers: { 'X-Mock-Role': 'teacher' } });
};
export default function TeacherQuizzesPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: quizzes, isLoading, error } = useQuery({
    queryKey: ['teacher-quizzes'],
    queryFn: fetchTeacherQuizzes,
  });
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['course'] }); // Invalidate courses as quizzes are nested
      setDialogOpen(false);
      setEditingQuiz(null);
    },
    onError: (err: Error) => toast.error(err.message || 'An error occurred.'),
  };
  const createMutation = useMutation({
    mutationFn: (newQuiz: Partial<Quiz>) => api<Quiz>('/api/quizzes', { method: 'POST', body: JSON.stringify(newQuiz) }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Quiz created successfully!');
      mutationOptions.onSuccess();
    },
  });
  // NOTE: PUT for quizzes is not implemented on backend, but this is the frontend structure.
  const updateMutation = useMutation({
    mutationFn: (updatedQuiz: Partial<Quiz>) => api<Quiz>(`/api/quizzes/${updatedQuiz.id}`, { method: 'PUT', body: JSON.stringify(updatedQuiz) }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Quiz updated successfully!');
      mutationOptions.onSuccess();
    },
  });
  // NOTE: DELETE for quizzes is not implemented on backend, but this is the frontend structure.
  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => api(`/api/quizzes/${quizId}`, { method: 'DELETE' }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Quiz deleted successfully!');
      mutationOptions.onSuccess();
    },
  });
  const handleFormSubmit = (values: QuizFormValues) => {
    if (editingQuiz) {
      // updateMutation.mutate({ ...editingQuiz, ...values });
      toast.info("Updating quizzes is not yet supported.");
    } else {
      createMutation.mutate({ ...values, tenantId: 'inst-1' });
    }
  };
  const openCreateDialog = () => {
    setEditingQuiz(null);
    setDialogOpen(true);
  };
  const openEditDialog = (quiz: Quiz) => {
    // setEditingQuiz(quiz);
    // setDialogOpen(true);
    toast.info("Editing quizzes is done from the course detail page.");
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Manage Your Quizzes</h1>
            <p className="mt-2 text-lg text-muted-foreground">Here are all the quizzes you've created.</p>
          </div>
          <Button className="gap-2" onClick={openCreateDialog}>
            <PlusCircle className="h-5 w-5" />
            Create Standalone Quiz
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingQuiz(null); setDialogOpen(isOpen); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'Create a New Quiz'}</DialogTitle>
              <DialogDescription>{editingQuiz ? 'Update the details for your quiz.' : 'Fill in the details to create a new quiz.'}</DialogDescription>
            </DialogHeader>
            <QuizForm
              onSubmit={handleFormSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              initialData={editingQuiz || undefined}
            />
          </DialogContent>
        </Dialog>
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
              <p className="text-muted-foreground mt-2 mb-4">Create a standalone quiz or attach one to a lesson.</p>
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
                          <CardDescription className="mt-1">
                            {quiz.lessonId ? `Attached to a lesson` : 'Standalone Quiz'}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(quiz)}><FilePenLine className="mr-2 h-4 w-4" />Edit Quiz</DropdownMenuItem>
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
    </div>
  );
}