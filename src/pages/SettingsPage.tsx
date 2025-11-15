import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Settings, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuthStore, authActions } from '@/store/auth';
import type { User } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
const fetchUser = async (userId: string): Promise<User> => {
  return api<User>(`/api/users/${userId}`);
};
export default function SettingsPage() {
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: () => fetchUser(user!.id),
    enabled: !!user,
  });
  const updateUserMutation = useMutation({
    mutationFn: (updates: Partial<User>) => api<User>(`/api/users/${user!.id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', user?.id], updatedUser);
      authActions.setUser(updatedUser); // Update global auth store
      toast.success('Settings updated successfully!');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings.');
    },
  });
  const handleMonitoringToggle = (checked: boolean) => {
    updateUserMutation.mutate({ monitoringEnabled: checked });
  };
  if (user?.role !== 'student' && user?.role !== 'parent') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 text-center">
          <p>Settings are only available for students and parents.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold font-display text-foreground">Settings</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your account preferences.</p>
        </motion.div>
        <motion.div
          className="mt-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Parent Monitoring</CardTitle>
                <CardDescription>
                  Allow a linked parent account to view your course progress and quiz results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUser ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="monitoring-switch" className="flex flex-col space-y-1">
                      <span>Enable Parent Monitoring</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        Your linked parent will be able to see your progress.
                      </span>
                    </Label>
                    <div className="flex items-center gap-4">
                      <Badge variant={userData?.monitoringEnabled ? 'success' : 'secondary'}>
                        {userData?.monitoringEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Switch
                        id="monitoring-switch"
                        checked={userData?.monitoringEnabled || false}
                        onCheckedChange={handleMonitoringToggle}
                        disabled={updateUserMutation.isPending}
                        aria-label="Toggle parent monitoring"
                      />
                      {updateUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {user.role === 'parent' && (
             <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive updates about your child's progress. (Feature coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">No notification settings available yet.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}