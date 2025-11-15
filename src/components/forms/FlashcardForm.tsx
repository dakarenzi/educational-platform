import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Flashcard } from '@shared/types';
const flashcardFormSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters long.'),
  answer: z.string().min(1, 'Answer cannot be empty.'),
});
type FlashcardFormValues = z.infer<typeof flashcardFormSchema>;
interface FlashcardFormProps {
  onSubmit: (values: FlashcardFormValues) => void;
  isLoading?: boolean;
  initialData?: Partial<Flashcard>;
}
export function FlashcardForm({ onSubmit, isLoading = false, initialData }: FlashcardFormProps) {
  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      question: initialData?.question || '',
      answer: initialData?.answer || '',
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question (Front of Card)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., What is a Cloudflare Worker?"
                  className="resize-y min-h-[100px]"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer (Back of Card)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., A serverless execution environment..."
                  className="resize-y min-h-[100px]"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Save Changes' : 'Add Card'}
        </Button>
      </form>
    </Form>
  );
}