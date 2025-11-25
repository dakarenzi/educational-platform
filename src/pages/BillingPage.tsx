import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Check, Star, Loader2, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Institution, StudentSubscription } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
const fetchInstitution = async (): Promise<Institution> => api<Institution>('/api/institution');
const fetchStudentSubscriptions = async (): Promise<StudentSubscription[]> => api<StudentSubscription[]>('/api/student/subscriptions');
export default function BillingPage() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: institution, isLoading: isLoadingInstitution, error: institutionError } = useQuery({
    queryKey: ['institution'],
    queryFn: fetchInstitution,
    enabled: !!user && (user.role === 'admin' || user.role === 'super-admin'),
  });
  const { data: studentSubscriptions, isLoading: isLoadingStudentSubs, error: studentSubsError } = useQuery({
    queryKey: ['student-subscriptions'],
    queryFn: fetchStudentSubscriptions,
    enabled: !!user && user.role === 'student',
  });
  const subscribeMutation = useMutation({
    mutationFn: () => api<{ checkoutUrl?: string }>('/api/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: user?.email }),
    }),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info('Redirecting to checkout...');
        window.location.href = data.checkoutUrl;
      } else {
        toast.success('Subscription upgraded successfully! (Mocked)');
        queryClient.invalidateQueries({ queryKey: ['institution'] });
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to start subscription.'),
  });
  const cancelStudentSubMutation = useMutation({
    mutationFn: (subId: string) => api(`/api/student/subscriptions/${subId}/cancel`, { method: 'PUT' }),
    onSuccess: () => {
      toast.success('Subscription canceled.');
      queryClient.invalidateQueries({ queryKey: ['student-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['user'] }); // To update user status
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription.'),
  });
  if (!user || !['admin', 'super-admin', 'student'].includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  const isAdmin = user.role === 'admin' || user.role === 'super-admin';
  const isStudent = user.role === 'student';
  const tiers = [
    { name: 'Trial', price: '$0', description: 'Explore with basic features.', features: ['Up to 10 students', '2 courses', 'Basic analytics'], plan: 'trial' },
    { name: 'Pro', price: '$29', priceSuffix: '/ month', description: 'Unlock the full potential.', features: ['Unlimited students', 'Unlimited courses', 'Advanced analytics', 'Priority support'], plan: 'pro', highlight: true },
  ];
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold font-display text-foreground">Billing & Subscriptions</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your plan and payment details.</p>
        </motion.div>
        <Tabs defaultValue={isAdmin ? "institution" : "student"} className="mt-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="institution" disabled={!isAdmin}><Building className="mr-2 h-4 w-4" />Institution Plan</TabsTrigger>
            <TabsTrigger value="student" disabled={!isStudent}><User className="mr-2 h-4 w-4" />My Subscriptions</TabsTrigger>
          </TabsList>
          <TabsContent value="institution" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <motion.div className="lg:col-span-1" variants={itemVariants} initial="hidden" animate="visible">
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
              <motion.div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants} initial="hidden" animate="visible">
                {tiers.map((tier) => (
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
                        {institution?.plan === tier.plan ? <Button disabled className="w-full">Current Plan</Button> : tier.plan === 'pro' ? <Button className="w-full" onClick={() => subscribeMutation.mutate()} disabled={subscribeMutation.isPending}>{subscribeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />} Upgrade to Pro</Button> : <Button disabled variant="outline" className="w-full">Included</Button>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </TabsContent>
          <TabsContent value="student" className="mt-8">
            <Card>
              <CardHeader><CardTitle>My Subscriptions</CardTitle><CardDescription>Your active and past subscriptions.</CardDescription></CardHeader>
              <CardContent>
                {isLoadingStudentSubs && <Skeleton className="h-32 w-full" />}
                {studentSubsError && <p className="text-destructive">Could not load your subscriptions.</p>}
                {studentSubscriptions && (
                  studentSubscriptions.length === 0 ? <p className="text-muted-foreground text-center py-8">You have no active subscriptions.</p> :
                  <Table>
                    <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {studentSubscriptions.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium capitalize">{sub.plan}</TableCell>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}