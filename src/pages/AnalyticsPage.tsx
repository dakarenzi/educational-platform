import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Users, BookOpen, Target, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
interface RecentActivity {
  student: string;
  course: string;
  courseId: string;
  activity: string;
  score: string;
  submittedAt: string;
}
interface AnalyticsData {
  kpi: {
    totalStudents: number;
    activeCourses: number;
    avgScore: number;
    completionRate: number;
  };
  progressData: { name: string; progress: number }[];
  recentActivity: RecentActivity[];
}
const fetchAnalytics = async (): Promise<AnalyticsData> => {
  return api<AnalyticsData>('/api/analytics');
};
export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });
  const kpiData = data ? [
    { title: 'Total Students', value: data.kpi.totalStudents.toLocaleString(), icon: Users, change: '+12%', changeType: 'increase' },
    { title: 'Active Courses', value: data.kpi.activeCourses.toLocaleString(), icon: BookOpen, change: '+5', changeType: 'increase' },
    { title: 'Avg. Quiz Score', value: `${data.kpi.avgScore}%`, icon: Target, change: '-2%', changeType: 'decrease' },
    { title: 'Completion Rate', value: `${data.kpi.completionRate}%`, icon: Activity, change: '+3%', changeType: 'increase' },
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
          <h1 className="text-4xl font-bold font-display text-foreground">Analytics Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">An overview of platform engagement and student performance.</p>
        </motion.div>
        {isLoading && (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-12">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
            <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-7 mt-8">
              <Skeleton className="lg:col-span-4 h-[420px]" />
              <Skeleton className="lg:col-span-3 h-[420px]" />
            </div>
          </>
        )}
        {error && <p className="text-destructive mt-12 text-center">Failed to load analytics data. Please try again later.</p>}
        {data && (
          <>
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mt-12"
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
                      <p className={`text-xs ${kpi.changeType === 'increase' ? 'text-success' : 'text-destructive'}`}>
                        {kpi.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="grid gap-8 md:grid-cols-1 lg:grid-cols-7 mt-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="lg:col-span-4" variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Student Progress by Course</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={data.progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div className="lg:col-span-3" variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.recentActivity.length > 0 ? (
                      <Table role="table" aria-label="Recent Student Activity">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.recentActivity.map((activity, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="font-medium">{activity.student}</div>
                                <Link to={`/app/courses/${activity.courseId}`} className="text-xs text-muted-foreground hover:underline">{activity.course}</Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant={activity.activity.includes('Failed') ? 'destructive' : 'success'}>
                                  {activity.activity}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(activity.submittedAt), { addSuffix: true })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No recent student activity.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}