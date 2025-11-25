import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Quiz } from '@shared/types';
const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(5, 'Question text must be at least 5 characters.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.number().int().min(0).max(3),
});
const quizFormSchema = z.object({
  title: z.string().min(3, 'Quiz title must be at least 3 characters.'),
  questions: z.array(questionSchema).min(1, 'A quiz must have at least one question.'),
});
export type QuizFormValues = z.infer<typeof quizFormSchema>;
interface QuizFormProps {
  onSubmit: (values: QuizFormValues) => void;
  isLoading?: boolean;
  initialData?: Partial<Quiz>;
}
export function QuizForm({ onSubmit, isLoading = false, initialData }: QuizFormProps) {
  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: initialData
      ? { title: initialData.title, questions: initialData.questions }
      : {
          title: '',
          questions: [{ id: uuidv4(), text: '', options: ['', '', '', ''], correctAnswer: 0 }],
        },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quiz Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chapter 1 Knowledge Check" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-md">Question {index + 1}</CardTitle>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`questions.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`questions.${index}.correctAnswer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Options (select correct answer)</FormLabel>
                      <RadioGroup onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)} className="space-y-2">
                        {[0, 1, 2, 3].map(optIndex => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <FormControl><RadioGroupItem value={String(optIndex)} /></FormControl>
                            <FormField
                              control={form.control}
                              name={`questions.${index}.options.${optIndex}`}
                              render={({ field: optField }) => (
                                <FormItem className="flex-1"><FormControl><Input {...optField} /></FormControl><FormMessage /></FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), text: '', options: ['', '', '', ''], correctAnswer: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Question
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Save Changes' : 'Create Quiz'}
          </Button>
        </div>
      </form>
    </Form>
  );
}