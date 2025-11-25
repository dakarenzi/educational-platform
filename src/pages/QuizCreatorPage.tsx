import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { Button } from '@/components/ui/button';
import { QuizForm, type QuizFormValues } from '@/components/forms/QuizForm';
export default function QuizCreatorPage() {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createQuizMutation = useMutation({
    mutationFn: (newQuiz: Partial<Quiz>) => api<Quiz>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(newQuiz),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz created successfully!');
      navigate(-1);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create quiz.');
    },
  });
  const onSubmit = (values: QuizFormValues) => {
    const payload: Partial<Quiz> = {
      ...values,
      tenantId: 'inst-1', // This should be derived from the user session in a real app
    };
    if (lessonId) {
      payload.lessonId = lessonId;
    }
    createQuizMutation.mutate(payload);
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Button variant="ghost" className="mb-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <h1 className="text-4xl font-bold font-display text-foreground">Quiz Creator</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {lessonId ? 'Build an interactive quiz for your lesson.' : 'Create a standalone quiz.'}
        </p>
        <div className="mt-8">
          <QuizForm onSubmit={onSubmit} isLoading={createQuizMutation.isPending} />
        </div>
      </div>
    </div>
  );
}