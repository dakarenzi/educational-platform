import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(5, 'Question text must be at least 5 characters.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.coerce.number().int().min(0).max(3),
});
const quizFormSchema = z.object({
  title: z.string().min(3, 'Quiz title must be at least 3 characters.'),
  questions: z.array(questionSchema).min(1, 'A quiz must have at least one question.'),
});
type QuizFormValues = z.infer<typeof quizFormSchema>;
export default function QuizCreatorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: '',
      questions: [{ id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correctAnswer: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  const createQuizMutation = useMutation({
    mutationFn: (newQuiz: Omit<Quiz, 'id'>) => api<Quiz>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(newQuiz),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course'] });
      toast.success('Quiz created successfully!');
      navigate(-1);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create quiz.');
    },
  });
  const onSubmit = (values: QuizFormValues) => {
    if (!lessonId) return;
    createQuizMutation.mutate({ ...values, lessonId });
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Button variant="ghost" className="mb-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Course
        </Button>
        <h1 className="text-4xl font-bold font-display text-foreground">Quiz Creator</h1>
        <p className="mt-2 text-lg text-muted-foreground">Build an interactive quiz for your lesson.</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Details</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Chapter 1 Review" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Question {index + 1}</CardTitle>
                    <CardDescription>Fill in the question and its options.</CardDescription>
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name={`questions.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl><Input placeholder="What is the capital of France?" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questions.${index}.correctAnswer`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Options (select the correct answer)</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={String(field.value)} className="flex flex-col space-y-1">
                            {[0, 1, 2, 3].map((optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <RadioGroupItem value={String(optionIndex)} id={`q${index}-o${optionIndex}`} />
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.options.${optionIndex}`}
                                  render={({ field: optionField }) => (
                                    <FormItem className="flex-1">
                                      <FormControl><Input placeholder={`Option ${optionIndex + 1}`} {...optionField} /></FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => append({ id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correctAnswer: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Question
              </Button>
              <Button type="submit" size="lg" disabled={createQuizMutation.isPending}>
                {createQuizMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Quiz
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}