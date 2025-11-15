import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GraduationCap, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { PendingTenant } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ThemeToggle';
const Confetti = ({ active, config }: { active?: boolean; config?: any }) => {
  if (!active) return null;
  // Lightweight inline SVG fallback that preserves the Confetti({ active, config }) signature.
  // Renders a simple non-animated SVG so bundler doesn't require 'react-dom-confetti'.
  return (
    <svg
      width="240"
      height="120"
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden
      className="pointer-events-none"
    >
      <rect x="20" y="20" width="6" height="6" fill="#ef4444" />
      <rect x="60" y="40" width="6" height="6" fill="#f59e0b" />
      <rect x="100" y="10" width="6" height="6" fill="#10b981" />
      <rect x="140" y="30" width="6" height="6" fill="#3b82f6" />
      <rect x="180" y="50" width="6" height="6" fill="#a78bfa" />
    </svg>
  );
};
const languages = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
] as const;
const requestTenantSchema = z.object({
  name: z.string().min(3, 'Institution name must be at least 3 characters.'),
  country: z.string().min(2, 'Please select a country.'),
  curriculum: z.enum(['Senegal', "Côte d'Ivoire", 'AEFE', 'US'] as const),
  languages: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one language.',
  }),
  adminEmail: z.string().email('Please enter a valid email address.'),
  verificationDomain: z.string().optional(),
});
type RequestTenantFormValues = z.infer<typeof requestTenantSchema>;
const createTenantRequest = (data: RequestTenantFormValues) => {
  return api<PendingTenant>('/api/tenant-request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
export default function RequestTenantPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const form = useForm<RequestTenantFormValues>({
    resolver: zodResolver(requestTenantSchema),
    defaultValues: {
      name: '',
      country: '',
      languages: [],
      adminEmail: '',
      verificationDomain: '',
    },
  });
  const mutation = useMutation({
    mutationFn: createTenantRequest,
    onSuccess: () => {
      toast.success('Your request has been submitted!');
      setIsSuccess(true);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
    },
  });
  const onSubmit = (data: RequestTenantFormValues) => {
    mutation.mutate(data);
  };
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,216,255,0.5),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(38,38,97,0.6),rgba(10,10,20,0))] -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="text-center mb-12">
            <GraduationCap className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground">
              Join AcademiCloud
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Request access for your educational institution and start building the future of learning.
            </p>
          </div>
          <Card className="w-full max-w-2xl mx-auto shadow-xl animate-fade-in">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <Confetti active={isSuccess} config={{ spread: 90, elementCount: 200 }} />
                  <CardTitle className="text-2xl mb-4">Thank You!</CardTitle>
                  <CardDescription className="max-w-md">
                    Your request has been received. Our team will review your application and contact you at the provided email address shortly.
                  </CardDescription>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardHeader>
                    <CardTitle>Institution Details</CardTitle>
                    <CardDescription>Please fill out the form below to request a new tenant.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Cloudflare University" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField control={form.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., Senegal" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="curriculum" render={({ field }) => (
                            <FormItem><FormLabel>Curriculum</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a curriculum" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Senegal">Senegal</SelectItem>
                                  <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                                  <SelectItem value="AEFE">AEFE</SelectItem>
                                  <SelectItem value="US">US</SelectItem>
                                </SelectContent>
                              </Select><FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="languages" render={() => (
                          <FormItem>
                            <div className="mb-4"><FormLabel>Languages Supported</FormLabel></div>
                            {languages.map((item) => (
                              <FormField key={item.id} control={form.control} name="languages" render={({ field }) => (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                      return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id));
                                    }} />
                                  </FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                              )} />
                            ))}
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="adminEmail" render={({ field }) => (
                          <FormItem><FormLabel>Administrator Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.edu" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="verificationDomain" render={({ field }) => (
                          <FormItem><FormLabel>Verification Domain (Optional)</FormLabel><FormControl><Input placeholder="example.edu" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                          {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          Submit Request
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}