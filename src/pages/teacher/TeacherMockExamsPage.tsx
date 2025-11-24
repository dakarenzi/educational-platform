import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, Trash2, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { MockExam, MockExamQuestion } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
const mockExamFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  duration: z.coerce.number().int().min(10, 'Duration must be at least 10 minutes.').max(180, 'Duration cannot exceed 180 minutes.'),
});
type MockExamFormValues = z.infer<typeof mockExamFormSchema>;
const fetchMockExams = async (): Promise<MockExam[]> => api<MockExam[]>('/api/mock-exams', { headers: { 'X-Mock-Role': 'teacher' } });
export default function TeacherMockExamsPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: exams, isLoading, error } = useQuery({
    queryKey: ['mock-exams'],
    queryFn: fetchMockExams,
  });
  const form = useForm<MockExamFormValues>({
    resolver: zodResolver(mockExamFormSchema),
    defaultValues: { title: '', description: '', duration: 60 },
  });
  const createMutation = useMutation({
    mutationFn: (values: MockExamFormValues) => {
      const mockQuestions: MockExamQuestion[] = [
        { id: 'q1', text: 'What is the primary function of a Cloudflare Worker?', options: ['Edge computing', 'Origin storage', 'DNS resolution', 'Client-side caching'], correctAnswer: 0 },
        { id: 'q2', text: 'Which storage solution offers strong consistency for Workers?', options: ['R2', 'KV', 'Durable Objects', 'D1'], correctAnswer: 2 },
        { id: 'q3', text: 'Hono is a framework for which environment?', options: ['Browsers', 'Node.js', 'Edge/Serverless', 'Desktop'], correctAnswer: 2 },
        { id: 'q4', text: 'What is the main benefit of R2 storage?', options: ['Low latency reads', 'Zero egress fees', 'Transactional writes', 'SQL querying'], correctAnswer: 1 },
      ];
      return api<MockExam>('/api/mock-exams', {
        method: 'POST',
        headers: { 'X-Mock-Role': 'teacher' },
        body: JSON.stringify({
          ...values,
          teacherId: user!.id,
          questions: mockQuestions,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      toast.success('Mock exam created successfully!');
      setDialogOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create exam.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (examId: string) => api(`/api/mock-exams/${examId}`, { method: 'DELETE', headers: { 'X-Mock-Role': 'teacher' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      toast.success('Mock exam deleted successfully!');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete exam.'),
  });
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
          <h1 className="text-3xl font-bold font-display text-foreground">Manage Mock Exams</h1>
          <p className="mt-2 text-lg text-muted-foreground">Create and manage full-length practice exams for your students.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Create Mock Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Mock Exam</DialogTitle>
              <DialogDescription>Fill in the details for your practice exam.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Midterm Practice Exam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief overview of the exam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={10} max={180} placeholder="60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                  Create Exam
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}
      {error && <p className="text-destructive">Failed to load mock exams. Please try again later.</p>}
      {!isLoading && !error && exams && (
        exams.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No mock exams created yet.</h3>
            <p className="text-muted-foreground mt-2 mb-4">Click the button above to create the first one.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Mock Exam
            </Button>
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
                <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center justify-between">
                      {exam.title}
                      <Badge variant="secondary" className="text-xs">
                        {exam.submissions?.length || 0} attempts
                      </Badge>
                    </CardTitle>
                    <CardDescription>{exam.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Duration: {exam.duration} min</span>
                      <span>Questions: {exam.questions.length}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>Edit Exam</DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Exam
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Mock Exam?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove the exam and all submissions.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(exam.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button asChild variant="outline">
                      <Link to={`/app/mock-exams/${exam.id}`}>View Details</Link>
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