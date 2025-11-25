import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Check, Star, Loader2, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api-client';
import type { Institution, StudentSubscription, User as UserType } from '@shared/types';
import { useAuthStore, authActions } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
const fetchInstitution = async (): Promise<Institution> => api<Institution>('/api/institution');
const fetchStudentSubscriptions = async (): Promise<StudentSubscription[]> => api<StudentSubscription[]>('/api/student/subscriptions');
const quoteSchema = z.object({
  institutionSize: z.string().min(10, 'Please provide details about your institution size.'),
  needs: z.string().min(10, 'Please describe your key needs.'),
  timeline: z.enum(['ASAP', '1-3 months', 'Discuss']),
  adminEmail: z.string().email('A valid contact email is required.'),
});
type QuoteFormValues = z.infer<typeof quoteSchema>;
export default function BillingPage() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro'>('basic');
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      institutionSize: '',
      needs: '',
      timeline: 'ASAP',
      adminEmail: user?.email || '',
    },
  });
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isStudentOrTeacher = user?.role === 'student' || user?.role === 'teacher';
  const { data: institution, isLoading: isLoadingInstitution, error: institutionError } = useQuery({
    queryKey: ['institution'],
    queryFn: fetchInstitution,
    enabled: !!user && isAdmin,
  });
  const { data: studentSubscriptions, isLoading: isLoadingStudentSubs, error: studentSubsError } = useQuery({
    queryKey: ['student-subscriptions'],
    queryFn: fetchStudentSubscriptions,
    enabled: !!user && isStudentOrTeacher,
  });
  const trialMutation = useMutation({
    mutationFn: () => api('/api/institution', {
      method: 'PATCH',
      body: JSON.stringify({
        plan: 'trial',
        status: 'trialing',
        nextBilling: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      }),
    }),
    onSuccess: () => {
      toast.success('30-day trial started!');
      queryClient.invalidateQueries({ queryKey: ['institution'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to start trial.'),
  });
  const quoteMutation = useMutation({
    mutationFn: (data: QuoteFormValues & { tenantId?: string }) => api('/api/sales/request-quote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast.success("Quote request submitted! We'll contact you within 24 hours.");
      setIsQuoteModalOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to submit quote request.'),
  });
  const cancelStudentSubMutation = useMutation({
    mutationFn: (subId: string) => api(`/api/student/subscriptions/${subId}/cancel`, { method: 'PUT' }),
    onSuccess: async () => {
      toast.success('Subscription canceled.');
      await queryClient.invalidateQueries({ queryKey: ['student-subscriptions'] });
      if (user?.id) {
        const updatedUser = await api<UserType>(`/api/users/${user.id}`);
        authActions.setUser(updatedUser);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription.'),
  });
  const createStudentSubMutation = useMutation({
    mutationFn: (payload: { plan: 'basic' | 'pro' }) => api('/api/student/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: async () => {
      toast.success('Subscription created. Refreshing status...');
      await queryClient.invalidateQueries({ queryKey: ['student-subscriptions'] });
      if (user?.id) {
        const updatedUser = await api<UserType>(`/api/users/${user.id}`);
        authActions.setUser(updatedUser);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create subscription.'),
  });
  const institutionTiers = [
    { name: 'Trial', price: '$0', description: 'Explore with basic features.', features: ['Up to 10 students', '2 courses', 'Basic analytics'], plan: 'trial' },
    { name: 'Pro', price: 'Custom', priceSuffix: '', description: 'Unlock the full potential.', features: ['Unlimited students', 'Unlimited courses', 'Advanced analytics', 'Priority support'], plan: 'pro', highlight: true },
  ];
  const studentTiers = [
    { name: 'Free', price: '$0', priceSuffix: '/mo', description: 'Basic access to the platform.', features: ['Access free courses', 'Take quizzes'], plan: 'free' },
    { name: 'Basic', price: '$7.99', priceSuffix: '/mo', description: 'Essential learning tools.', features: ['Unlimited quizzes', 'Basic AI Tutor help'], plan: 'basic' },
    { name: 'Pro', price: '$16.99', priceSuffix: '/mo', description: 'Full access to all features.', features: ['Full AI Tutor capabilities', 'Access all premium courses', 'Personal analytics'], plan: 'pro', highlight: true },
  ];
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  const defaultTab = isStudentOrTeacher ? 'student' : 'institution';
  const selectedPrice = selectedTier === 'basic' ? '$7.99' : '$16.99';
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold font-display text-foreground">Billing & Subscriptions</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your plan and payment details.</p>
        </motion.div>
        <Tabs defaultValue={defaultTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="institution" disabled={!isAdmin}><Building className="mr-2 h-4 w-4" />Institution Plan</TabsTrigger>
            <TabsTrigger value="student" disabled={!isStudentOrTeacher}><User className="mr-2 h-4 w-4" />My Subscriptions</TabsTrigger>
          </TabsList>
          {isAdmin && (
            <TabsContent value="institution" className="mt-8">
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <motion.div className="lg:col-span-1" variants={itemVariants}>
                    <Card>
                      <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
                      <CardContent>
                        {isLoadingInstitution && <div className="space-y-4"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
                        {institutionError && <p className="text-destructive">Could not load plan details.</p>}
                        {institution && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-semibold capitalize">{institution.plan}</span>
                              <Badge variant={institution.status === 'active' || institution.status === 'trialing' ? 'success' : 'destructive'} className="capitalize">{institution.status}</Badge>
                            </div>
                            <Separator />
                            {institution.nextBilling && (
                              <div>
                                <p className="text-sm text-muted-foreground">Next billing date</p>
                                <p className="font-medium">{new Date(institution.nextBilling * 1000).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants}>
                    {institutionTiers.map((tier) => (
                      <motion.div key={tier.name} variants={itemVariants}>
                        <Card className={`flex flex-col h-full ${tier.highlight ? 'border-primary ring-1 ring-primary shadow-lg' : ''}`}>
                          <CardHeader>
                            <CardTitle className="text-2xl">{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                            <div className="pt-4"><span className="text-4xl font-bold">{tier.price}</span><span className="text-muted-foreground">{tier.priceSuffix}</span></div>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <ul className="space-y-2">{tier.features.map((feature) => (<li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> <span className="text-sm">{feature}</span></li>))}</ul>
                          </CardContent>
                          <CardContent>
                            {institution?.plan === tier.plan ? <Button disabled className="w-full">Current Plan</Button> :
                             tier.plan === 'pro' ? (
                              <Dialog open={isQuoteModalOpen} onOpenChange={setIsQuoteModalOpen}>
                                <DialogTrigger asChild><Button className="w-full"><Star className="mr-2 h-4 w-4" /> Request Quote</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                  <DialogHeader><DialogTitle>Request Pro Quote</DialogTitle><DialogDescription>We'll customize a plan for your needs.</DialogDescription></DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit((d) => quoteMutation.mutate({ ...d, tenantId: institution?.id }))} className="space-y-4 pt-4">
                                      <FormField name="institutionSize" control={form.control} render={({ field }) => <FormItem><FormLabel>Institution Size</FormLabel><FormControl><Textarea placeholder="e.g., 200 students, K-12" {...field} /></FormControl><FormMessage /></FormItem>} />
                                      <FormField name="needs" control={form.control} render={({ field }) => <FormItem><FormLabel>Key Needs</FormLabel><FormControl><Textarea placeholder="e.g., AI tutor integration, custom branding" {...field} /></FormControl><FormMessage /></FormItem>} />
                                      <FormField name="timeline" control={form.control} render={({ field }) => <FormItem><FormLabel>Timeline</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ASAP">ASAP</SelectItem><SelectItem value="1-3 months">1-3 months</SelectItem><SelectItem value="Discuss">Let's Discuss</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                                      <FormField name="adminEmail" control={form.control} render={({ field }) => <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>} />
                                      <Button type="submit" className="w-full" disabled={quoteMutation.isPending}>{quoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Request'}</Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                             ) :
                             <Button variant="outline" className="w-full" onClick={() => trialMutation.mutate()} disabled={trialMutation.isPending}>Start 30-Day Trial</Button>
                            }
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>
          )}
          {isStudentOrTeacher && (
            <TabsContent value="student" className="mt-8">
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <Card>
                  <CardHeader><CardTitle>My Subscriptions</CardTitle><CardDescription>Your active and past subscriptions for premium content.</CardDescription></CardHeader>
                  <CardContent>
                    {isLoadingStudentSubs && <Skeleton className="h-32 w-full" />}
                    {studentSubsError && <p className="text-destructive">Could not load your subscriptions.</p>}
                    {user && studentSubscriptions && (
                      user.subscriptionTier && user.subscriptionTier !== 'free' ? (
                        <Table>
                          <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {studentSubscriptions.map(sub => (
                              <TableRow key={sub.id}>
                                <TableCell className="font-medium capitalize">{sub.tier}</TableCell>
                                <TableCell><Badge variant={sub.status === 'active' ? 'success' : 'secondary'} className="capitalize">{sub.status}</Badge></TableCell>
                                <TableCell>{new Date(sub.expiry * 1000).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  {sub.status === 'active' && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={cancelStudentSubMutation.isPending}>Cancel</Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Cancel Subscription?</AlertDialogTitle><AlertDialogDescription>Your premium access will remain active until the expiry date.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Keep Subscription</AlertDialogCancel><AlertDialogAction onClick={() => cancelStudentSubMutation.mutate(sub.id)}>Confirm Cancellation</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 space-y-8">
                          <p className="text-muted-foreground">You are on the Free plan. Upgrade to access premium content.</p>
                          <RadioGroup defaultValue="basic" value={selectedTier} onValueChange={(v: 'basic' | 'pro') => setSelectedTier(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {studentTiers.filter(t => t.plan !== 'free').map(tier => (
                              <Label key={tier.name} htmlFor={tier.plan} className={cn("block cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm p-6 transition-all hover:scale-105", selectedTier === tier.plan && "border-primary ring-2 ring-primary")}>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                                  <RadioGroupItem value={tier.plan} id={tier.plan} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                                <div className="mt-4"><span className="text-3xl font-bold">{tier.price}</span><span className="text-muted-foreground">{tier.priceSuffix}</span></div>
                                <ul className="mt-4 space-y-2 text-sm">
                                  {tier.features.map(feature => <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{feature}</li>)}
                                </ul>
                              </Label>
                            ))}
                          </RadioGroup>
                          <Button className="bg-amber-400 hover:bg-amber-500 text-foreground" onClick={() => createStudentSubMutation.mutate({ plan: selectedTier })} disabled={createStudentSubMutation.isPending}>
                            {createStudentSubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upgrade to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} - {selectedPrice}/mo
                          </Button>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}