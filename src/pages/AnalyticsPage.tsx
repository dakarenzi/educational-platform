import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Users, BookOpen, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
const kpiData = [
  { title: 'Total Students', value: '1,250', icon: Users, change: '+12%', changeType: 'increase' },
  { title: 'Active Courses', value: '48', icon: BookOpen, change: '+5', changeType: 'increase' },
  { title: 'Avg. Score', value: '88%', icon: Target, change: '-2%', changeType: 'decrease' },
  { title: 'Completion Rate', value: '76%', icon: Activity, change: '+3%', changeType: 'increase' },
];
const progressData = [
  { name: 'Paleontology', progress: 85 },
  { name: 'Web Dev', progress: 92 },
  { name: 'Writing', progress: 72 },
  { name: 'History', progress: 65 },
  { name: 'Physics', progress: 88 },
  { name: 'Art', progress: 95 },
];
const recentActivity = [
  { student: 'Sam Neill', course: 'Paleontology', activity: 'Quiz Passed', score: '95%', time: '2m ago' },
  { student: 'Laura Dern', course: 'Web Dev', activity: 'Lesson Completed', score: '-', time: '15m ago' },
  { student: 'Jeff Goldblum', course: 'Physics', activity: 'Course Enrolled', score: '-', time: '1h ago' },
  { student: 'Ariana Richards', course: 'Art', activity: 'Quiz Failed', score: '55%', time: '3h ago' },
  { student: 'Joseph Mazzello', course: 'Writing', activity: 'Lesson Completed', score: '-', time: '5h ago' },
];
export default function AnalyticsPage() {
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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7 mt-8">
          <motion.div className="lg:col-span-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Student Progress by Course</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{activity.student}</TableCell>
                        <TableCell>
                          <Badge variant={activity.activity.includes('Failed') ? 'destructive' : 'secondary'}>
                            {activity.activity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{activity.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}