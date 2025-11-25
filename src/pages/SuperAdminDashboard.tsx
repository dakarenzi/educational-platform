import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Building, Users, DollarSign, PlusCircle, Check, X, MoreVertical, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Institution, PendingTenant, PendingQuote } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
interface SuperAdminAnalytics {
  totalTenants: number;
  totalUsers: number;
  mockRevenue: number;
}
const languages = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
] as const;
const tenantFormSchema = z.object({
  name: z.string().min(3, 'Institution name must be at least 3 characters.'),
  country: z.string().min(2, 'Please enter a country.'),
  curriculum: z.enum(['Senegal', "Côte d'Ivoire", 'AEFE', 'US'] as const),
  languages: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one language.',
  }),
});
type TenantFormValues = z.infer<typeof tenantFormSchema>;
const fetchTenants = async (): Promise<Institution[]> => api<Institution[]>('/api/super-admin/tenants', { headers: { 'X-Mock-Role': 'super-admin' } });
const fetchAnalytics = async (): Promise<SuperAdminAnalytics> => api<SuperAdminAnalytics>('/api/super-admin/analytics', { headers: { 'X-Mock-Role': 'super-admin' } });
const fetchPendingTenants = async (): Promise<PendingTenant[]> => api<PendingTenant[]>('/api/super-admin/pending-tenants', { headers: { 'X-Mock-Role': 'super-admin' } });
const fetchPendingQuotes = async (): Promise<PendingQuote[]> => api<PendingQuote[]>('/api/super-admin/quotes?status=pending', { headers: { 'X-Mock-Role': 'super-admin' } });
export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: { name: '', country: '', languages: [] },
  });
  const { data: tenants, isLoading: isLoadingTenants, error: tenantsError } = useQuery({ queryKey: ['super-admin-tenants'], queryFn: fetchTenants });
  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({ queryKey: ['super-admin-analytics'], queryFn: fetchAnalytics });
  const { data: pendingTenants, isLoading: isLoadingPending, error: pendingError } = useQuery({ queryKey: ['super-admin-pending-tenants'], queryFn: fetchPendingTenants });
  const { data: pendingQuotes, isLoading: isLoadingQuotes, error: quotesError } = useQuery({ queryKey: ['super-admin-quotes'], queryFn: fetchPendingQuotes });
  const createTenantMutation = useMutation({
    mutationFn: (newTenant: TenantFormValues) => api('/api/super-admin/tenants', {
      method: 'POST',
      headers: { 'X-Mock-Role': 'super-admin' },
      body: JSON.stringify({ ...newTenant, adminEmail: '' }),
    }),
    onSuccess: (_, variables) => {
      toast.success(`Tenant "${variables.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-analytics'] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create tenant.'),
  });
  const approveTenantMutation = useMutation({
    mutationFn: (tenant: PendingTenant) => api(`/api/super-admin/pending-tenants/${tenant.id}/approve`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' } }),
    onSuccess: (_, tenant) => {
      toast.success(`Tenant "${tenant.name}" approved and activated!`);
      queryClient.invalidateQueries({ queryKey: ['super-admin-pending-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-analytics'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to approve tenant.'),
  });
  const rejectTenantMutation = useMutation({
    mutationFn: (tenant: PendingTenant) => api(`/api/super-admin/pending-tenants/${tenant.id}/reject`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' }, body: JSON.stringify({ notes: 'Rejected by admin.' }) }),
    onSuccess: (_, tenant) => {
      toast.info(`Tenant request for "${tenant.name}" rejected.`);
      queryClient.invalidateQueries({ queryKey: ['super-admin-pending-tenants'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to reject tenant.'),
  });
  const approveQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => api(`/api/super-admin/quotes/${quoteId}/approve`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' } }),
    onSuccess: () => {
      toast.success('Quote approved. Sales team notified.');
      queryClient.invalidateQueries({ queryKey: ['super-admin-quotes'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to approve quote.'),
  });
  const rejectQuoteMutation = useMutation({
    mutationFn: (data: { id: string; notes?: string }) => api(`/api/super-admin/quotes/${data.id}/reject`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' }, body: JSON.stringify({ notes: data.notes }) }),
    onSuccess: () => {
      toast.info('Quote rejected.');
      queryClient.invalidateQueries({ queryKey: ['super-admin-quotes'] });
      setRejectNotes('');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to reject quote.'),
  });
  const kpiData = analytics ? [
    { title: 'Active Tenants', value: analytics.totalTenants.toLocaleString(), icon: Building },
    { title: 'Total Users (Mock)', value: analytics.totalUsers.toLocaleString(), icon: Users },
    { title: 'Mock Monthly Revenue', value: `${analytics.mockRevenue.toLocaleString()}`, icon: DollarSign },
    { title: 'Pending Quotes', value: pendingQuotes?.length?.toLocaleString() || 0, icon: MessageSquare },
  ] : [];
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold font-display text-foreground">Super Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">Platform-wide overview and management tools.</p>
        </motion.div>
        {isLoadingAnalytics && <div className="grid gap-8 md:grid-cols-4 mt-12">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>}
        {analyticsError && <p className="text-destructive mt-12">Failed to load analytics data.</p>}
        {analytics && (
          <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-12" variants={containerVariants} initial="hidden" animate="visible">
            {kpiData.map((kpi) => (
              <motion.div key={kpi.title} variants={itemVariants}>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{kpi.title}</CardTitle><kpi.icon className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpi.value}</div></CardContent></Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        <Tabs defaultValue="tenants" className="mt-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tenants">Active Tenants</TabsTrigger>
            <TabsTrigger value="pending">Pending Tenants</TabsTrigger>
            <TabsTrigger value="quotes">Pending Quotes</TabsTrigger>
          </TabsList>
          <TabsContent value="tenants" className="mt-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Active Tenants</CardTitle><CardDescription>Manage all active institutions on the platform.</CardDescription></div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Manually</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader><DialogTitle>Create New Tenant</DialogTitle><DialogDescription>Manually provision a new institution.</DialogDescription></DialogHeader>
                      <Form {...form}><form onSubmit={form.handleSubmit((d) => createTenantMutation.mutate(d))} className="space-y-4"><FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Institution Name</FormLabel><FormControl><Input placeholder="e.g., Cloudflare University" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., USA" {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="curriculum" render={({ field }) => (<FormItem><FormLabel>Curriculum</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a curriculum" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Senegal">Senegal</SelectItem><SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem><SelectItem value="AEFE">AEFE</SelectItem><SelectItem value="US">US</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} /><FormField control={form.control} name="languages" render={() => (<FormItem><div className="mb-2"><FormLabel>Languages</FormLabel></div>{languages.map((item) => (<FormField key={item.id} control={form.control} name="languages" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id)); }} /></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)} />))}<FormMessage /></FormItem>)} /><Button type="submit" className="w-full" disabled={createTenantMutation.isPending}>{createTenantMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Tenant</Button></form></Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {isLoadingTenants && <Skeleton className="h-48 w-full" />}
                  {tenantsError && <p className="text-destructive">Failed to load tenants.</p>}
                  {tenants && (tenants.length === 0 ? <div className="text-center py-8"><Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No active tenants available.</p></div> : <Table role="table" aria-label="Active Tenants"><TableHeader><TableRow><TableHead>Institution</TableHead><TableHead>Country</TableHead><TableHead>Curriculum</TableHead><TableHead>Languages</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{tenants.map((tenant) => (<TableRow key={tenant.id}><TableCell className="font-medium">{tenant.name}</TableCell><TableCell>{tenant.country}</TableCell><TableCell>{tenant.curriculum}</TableCell><TableCell>{tenant.languages?.join(', ')}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" disabled>Manage</Button></TableCell></TableRow>))}</TableBody></Table>)}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle>Pending Tenant Requests</CardTitle><CardDescription>Review and approve or reject new institution requests.</CardDescription></CardHeader>
                <CardContent>
                  {isLoadingPending && <Skeleton className="h-48 w-full" />}
                  {pendingError && <p className="text-destructive">Failed to load pending tenants.</p>}
                  {pendingTenants && (pendingTenants.length === 0 ? <div className="text-center py-8"><Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No pending requests available.</p></div> : <Table role="table" aria-label="Pending Tenant Requests"><TableHeader><TableRow><TableHead>Institution</TableHead><TableHead>Admin Email</TableHead><TableHead>Requested</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pendingTenants.map((tenant) => (<TableRow key={tenant.id}><TableCell className="font-medium">{tenant.name} <span className="text-muted-foreground">({tenant.country})</span></TableCell><TableCell>{tenant.adminEmail}</TableCell><TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(tenant.requestedAt), { addSuffix: true })}</TableCell><TableCell><Badge variant={tenant.status === 'pending' ? 'secondary' : tenant.status === 'approved' ? 'success' : 'destructive'}>{tenant.status}</Badge></TableCell><TableCell className="text-right">{tenant.status === 'pending' && (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={approveTenantMutation.isPending || rejectTenantMutation.isPending} aria-label={`Actions for ${tenant.name}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve Tenant?</AlertDialogTitle><AlertDialogDescription>This will activate the institution and send a notification to the admin.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => approveTenantMutation.mutate(tenant)}>Approve</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject Tenant?</AlertDialogTitle><AlertDialogDescription>This will reject the request. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => rejectTenantMutation.mutate(tenant)} className="bg-destructive hover:bg-destructive/90">Reject</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></DropdownMenuContent></DropdownMenu>)}</TableCell></TableRow>))}</TableBody></Table>)}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          <TabsContent value="quotes" className="mt-6">
            <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader><CardTitle>Pending Quotes</CardTitle><CardDescription>Review and approve/reject quote requests.</CardDescription></CardHeader>
                <CardContent>
                  {isLoadingQuotes && <Skeleton className="h-48 w-full" />}
                  {quotesError && <p className="text-destructive">Failed to load pending quotes.</p>}
                  {pendingQuotes && (pendingQuotes.length === 0 ? <div className="text-center py-8"><MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No pending quotes.</p></div> :
                    <Table><TableHeader><TableRow><TableHead>Institution</TableHead><TableHead>Size</TableHead><TableHead>Needs</TableHead><TableHead>Timeline</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pendingQuotes.map(quote => (<TableRow key={quote.id}><TableCell className="font-medium">Tenant <span className="text-muted-foreground">{quote.tenantId.slice(-6)}</span></TableCell><TableCell className="max-w-xs truncate">{quote.institutionSize}</TableCell><TableCell className="max-w-xs truncate">{quote.needs}</TableCell><TableCell><Badge variant="secondary">{quote.timeline}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()}><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve Quote?</AlertDialogTitle><AlertDialogDescription>This will notify the sales team to proceed with this quote.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => approveQuoteMutation.mutate(quote.id)}>Approve</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive"><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject Quote?</AlertDialogTitle><AlertDialogDescription><Textarea placeholder="Reason for rejection (optional)" onChange={(e) => setRejectNotes(e.target.value)} /></AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => rejectQuoteMutation.mutate({ id: quote.id, notes: rejectNotes })} className="bg-destructive hover:bg-destructive/90">Reject</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}