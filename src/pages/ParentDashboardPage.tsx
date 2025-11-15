import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Users, UserPlus, Loader2, BarChart2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth';
import type { User, QuizSubmission, MockExamSubmission } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
interface ChildProgress {
  childId: string;
  childName: string;
  avgScore: number;
  quizSubmissions: QuizSubmission[];
  mockExamSubmissions: MockExamSubmission[];
}
const fetchParentProgress = async (): Promise<ChildProgress[]> => {
  return api<ChildProgress[]>('/api/parent/progress');
};
const fetchAllStudents = async (): Promise<User[]> => {
  const allUsers = await api<User[]>('/api/users');
  return allUsers.filter(u => u.role === 'student');
};
export default function ParentDashboardPage() {
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['parent-progress'],
    queryFn: fetchParentProgress,
  });
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: fetchAllStudents,
  });
  const inviteMutation = useMutation({
    mutationFn: (childId: string) => api<{ code: string }>('/api/parent/invite', {
      method: 'POST',
      body: JSON.stringify({ childId }),
    }),
    onSuccess: (data) => {
      toast.success(`Invite sent! Your approval code is: ${data.code}`, {
        description: 'Please share this code with your child to approve the link.',
        duration: 10000,
      });
      setInviteOpen(false);
      setSelectedChild(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite.');
    },
  });
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-4 justify-between items-center mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Parent Dashboard</h1>
            <p className="mt-2 text-lg text-muted-foreground">Monitor your children's learning progress.</p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Link a Child</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link a New Child</DialogTitle>
                <DialogDescription>Select your child from the list to send an invite.</DialogDescription>
              </DialogHeader>
              {isLoadingStudents ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                <div className="space-y-4 py-4">
                  {students?.map(student => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedChild(student)}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${selectedChild?.id === student.id ? 'border-primary ring-2 ring-primary' : ''}`}
                    >
                      <span>{student.name}</span>
                      <span className="text-sm text-muted-foreground">{student.email}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full"
                    disabled={!selectedChild || inviteMutation.isPending}
                    onClick={() => selectedChild && inviteMutation.mutate(selectedChild.id)}
                  >
                    {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invite
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Linked Children</CardTitle>
              <CardDescription>An overview of your linked children's performance.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProgress ? (
                <Skeleton className="h-48 w-full" />
              ) : progress && progress.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Average Score</TableHead>
                      <TableHead>Total Quizzes Taken</TableHead>
                      <TableHead>Total Mock Exams Taken</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progress.map(child => (
                      <motion.tr key={child.childId} variants={itemVariants}>
                        <TableCell className="font-medium">{child.childName}</TableCell>
                        <TableCell>
                          <Badge variant={child.avgScore >= 80 ? 'success' : child.avgScore >= 60 ? 'secondary' : 'destructive'}>
                            {child.avgScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>{child.quizSubmissions.length}</TableCell>
                        <TableCell>{child.mockExamSubmissions.length}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">No Linked Children</h3>
                  <p className="text-muted-foreground mt-2">
                    Click "Link a Child" to send an invitation and start monitoring progress.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}