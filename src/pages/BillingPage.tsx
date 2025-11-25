import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Check, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Institution } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Navigate } from 'react-router-dom';
const fetchInstitution = async (): Promise<Institution> => {
  return api<Institution>('/api/institution');
};
export default function BillingPage() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: institution, isLoading, error } = useQuery({
    queryKey: ['institution'],
    queryFn: fetchInstitution,
    enabled: !!user,
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
        toast.success('Subscription upgraded successfully! (This is a mocked response)');
        queryClient.invalidateQueries({ queryKey: ['institution'] });
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to start subscription.');
    },
  });
  if (user?.role !== 'super-admin' && user?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }
  const tiers = [
    {
      name: 'Trial',
      price: '$0',
      description: 'Explore the platform with basic features.',
      features: ['Up to 10 students', '2 courses', 'Basic analytics'],
      plan: 'trial',
    },
    {
      name: 'Pro',
      price: '$29',
      priceSuffix: '/ month',
      description: 'Unlock the full potential of AcademiCloud.',
      features: ['Unlimited students', 'Unlimited courses', 'Advanced analytics', 'Priority support', 'AI Tutor Pro'],
      plan: 'pro',
      highlight: true,
    },
  ];
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold font-display text-foreground">Billing & Subscription</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your institution's plan and payment details.</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
          <motion.div className="lg:col-span-1" variants={itemVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && <div className="space-y-4"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>}
                {error && <p className="text-destructive">Could not load plan details.</p>}
                {institution && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-semibold capitalize">{institution.plan}</span>
                      <Badge variant={institution.status === 'active' || institution.status === 'trialing' ? 'success' : 'destructive'} className="capitalize">
                        {institution.status}
                      </Badge>
                    </div>
                    <Separator />
                    {institution.nextBilling && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next billing date</p>
                        <p className="font-medium">{new Date(institution.nextBilling * 1000).toLocaleDateString()}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Manage your subscription through the Stripe customer portal (feature coming soon).
                    </p>
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
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.priceSuffix}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-success" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardContent>
                    {institution?.plan === tier.plan ? (
                      <Button disabled className="w-full">Current Plan</Button>
                    ) : tier.plan === 'pro' ? (
                      <Button
                        className="w-full"
                        onClick={() => subscribeMutation.mutate()}
                        disabled={subscribeMutation.isPending}
                      >
                        {subscribeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                        Upgrade to Pro
                      </Button>
                    ) : (
                      <Button disabled variant="outline" className="w-full">Included</Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}