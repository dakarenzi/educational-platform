import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building, Users, DollarSign, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Institution } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
interface SuperAdminAnalytics {
  totalTenants: number;
  totalUsers: number;
  mockRevenue: number;
}
const fetchTenants = async (): Promise<Institution[]> => {
  return api<Institution[]>('/api/super-admin/tenants', { headers: { 'X-Mock-Role': 'super-admin' } });
};
const fetchAnalytics = async (): Promise<SuperAdminAnalytics> => {
  return api<SuperAdminAnalytics>('/api/super-admin/analytics', { headers: { 'X-Mock-Role': 'super-admin' } });
};
export default function SuperAdminDashboard() {
  const { data: tenants, isLoading: isLoadingTenants, error: tenantsError } = useQuery({
    queryKey: ['super-admin-tenants'],
    queryFn: fetchTenants,
  });
  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: fetchAnalytics,
  });
  const kpiData = analytics ? [
    { title: 'Total Tenants', value: analytics.totalTenants.toLocaleString(), icon: Building },
    { title: 'Total Users', value: analytics.totalUsers.toLocaleString(), icon: Users },
    { title: 'Mock Monthly Revenue', value: `$${analytics.mockRevenue.toLocaleString()}`, icon: DollarSign },
  ] : [];
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
          <h1 className="text-4xl font-bold font-display text-foreground">Super Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">Platform-wide overview and management tools.</p>
        </motion.div>
        {isLoadingAnalytics && (
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        )}
        {analyticsError && <p className="text-destructive mt-12">Failed to load analytics data.</p>}
        {analytics && (
          <motion.div
            className="grid gap-8 md:grid-cols-3 mt-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {kpiData.map((kpi) => (
              <motion.div key={kpi.title} variants={itemVariants}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <kpi.icon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tenant Management</CardTitle>
                <p className="text-sm text-muted-foreground">View and manage all institutions on the platform.</p>
              </div>
              <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Add New Tenant</Button>
            </CardHeader>
            <CardContent>
              {isLoadingTenants && <Skeleton className="h-48 w-full" />}
              {tenantsError && <p className="text-destructive">Failed to load tenants.</p>}
              {tenants && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution Name</TableHead>
                      <TableHead>Tenant ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{tenant.id}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" disabled>Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}