import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building, Users, DollarSign, PlusCircle, Check, X, MoreVertical, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Institution, PendingTenant } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
interface SuperAdminAnalytics {
  totalTenants: number;
  totalUsers: number;
  mockRevenue: number;
}
const fetchTenants = async (): Promise<Institution[]> => api<Institution[]>('/api/super-admin/tenants', { headers: { 'X-Mock-Role': 'super-admin' } });
const fetchAnalytics = async (): Promise<SuperAdminAnalytics> => api<SuperAdminAnalytics>('/api/super-admin/analytics', { headers: { 'X-Mock-Role': 'super-admin' } });
const fetchPendingTenants = async (): Promise<PendingTenant[]> => api<PendingTenant[]>('/api/super-admin/pending-tenants', { headers: { 'X-Mock-Role': 'super-admin' } });
export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading: isLoadingTenants, error: tenantsError } = useQuery({ queryKey: ['super-admin-tenants'], queryFn: fetchTenants });
  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({ queryKey: ['super-admin-analytics'], queryFn: fetchAnalytics });
  const { data: pendingTenants, isLoading: isLoadingPending, error: pendingError } = useQuery({ queryKey: ['super-admin-pending-tenants'], queryFn: fetchPendingTenants });
  const approveMutation = useMutation({
    mutationFn: (id: string) => api(`/api/super-admin/pending-tenants/${id}/approve`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' } }),
    onSuccess: () => {
      toast.success('Tenant approved and activated!');
      queryClient.invalidateQueries({ queryKey: ['super-admin-pending-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-analytics'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to approve tenant.'),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api(`/api/super-admin/pending-tenants/${id}/reject`, { method: 'PUT', headers: { 'X-Mock-Role': 'super-admin' }, body: JSON.stringify({ notes: 'Rejected by admin.' }) }),
    onSuccess: () => {
      toast.info('Tenant request rejected.');
      queryClient.invalidateQueries({ queryKey: ['super-admin-pending-tenants'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to reject tenant.'),
  });
  const kpiData = analytics ? [
    { title: 'Active Tenants', value: analytics.totalTenants.toLocaleString(), icon: Building },
    { title: 'Total Users (Mock)', value: analytics.totalUsers.toLocaleString(), icon: Users },
    { title: 'Mock Monthly Revenue', value: `$${analytics.mockRevenue.toLocaleString()}`, icon: DollarSign },
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
        {isLoadingAnalytics && <div className="grid gap-8 md:grid-cols-3 mt-12">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>}
        {analyticsError && <p className="text-destructive mt-12">Failed to load analytics data.</p>}
        {analytics && (
          <motion.div className="grid gap-8 md:grid-cols-3 mt-12" variants={containerVariants} initial="hidden" animate="visible">
            {kpiData.map((kpi) => (
              <motion.div key={kpi.title} variants={itemVariants}>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{kpi.title}</CardTitle><kpi.icon className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpi.value}</div></CardContent></Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle>Pending Tenant Requests</CardTitle><CardDescription>Review and approve or reject new institution requests.</CardDescription></CardHeader>
            <CardContent>
              {isLoadingPending && <Skeleton className="h-48 w-full" />}
              {pendingError && <p className="text-destructive">Failed to load pending tenants.</p>}
              {pendingTenants && (
                pendingTenants.length === 0 ? <p className="text-muted-foreground text-center py-8">No pending requests.</p> :
                <Table>
                  <TableHeader><TableRow><TableHead>Institution</TableHead><TableHead>Admin Email</TableHead><TableHead>Requested</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pendingTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name} <span className="text-muted-foreground">({tenant.country})</span></TableCell>
                        <TableCell>{tenant.adminEmail}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDistanceToNow(new Date(tenant.requestedAt), { addSuffix: true })}</TableCell>
                        <TableCell><Badge variant={tenant.status === 'pending' ? 'secondary' : tenant.status === 'approved' ? 'success' : 'destructive'}>{tenant.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {tenant.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Approve Tenant?</AlertDialogTitle><AlertDialogDescription>This will activate the institution and send a notification to the admin.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => approveMutation.mutate(tenant.id)}>Approve</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem></AlertDialogTrigger>
                                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reject Tenant?</AlertDialogTitle><AlertDialogDescription>This will reject the request. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => rejectMutation.mutate(tenant.id)} className="bg-destructive hover:bg-destructive/90">Reject</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Active Tenants</CardTitle><Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Manually</Button></CardHeader>
            <CardContent>
              {isLoadingTenants && <Skeleton className="h-48 w-full" />}
              {tenantsError && <p className="text-destructive">Failed to load tenants.</p>}
              {tenants && (
                <Table>
                  <TableHeader><TableRow><TableHead>Institution Name</TableHead><TableHead>Tenant ID</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>{tenants.map((tenant) => (<TableRow key={tenant.id}><TableCell className="font-medium">{tenant.name}</TableCell><TableCell className="text-muted-foreground font-mono text-xs">{tenant.id}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" disabled>Manage</Button></TableCell></TableRow>))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}