import { Book, BrainCircuit, ClipboardList, LayoutDashboard, Presentation, Sparkles, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
const dashboardItems = [
  { title: 'Courses', href: '/app/courses', icon: Book, description: 'Manage and browse courses' },
  { title: 'Flashcards', href: '/app/flashcards', icon: Presentation, description: 'Study with flashcard decks' },
  { title: 'AI Tutor', href: '/app/tutor', icon: Sparkles, description: 'Get help from an AI assistant' },
  { title: 'Mock Exams', href: '/app/mock-exams', icon: ClipboardList, description: 'Take practice tests and track scores' },
  { title: 'Resources', href: '/app/resources', icon: FileText, description: 'Access learning materials and downloads' },
  { title: 'Analytics', href: '/app/analytics', icon: BrainCircuit, description: 'Track learning progress' },
];
export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
      },
    },
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold font-display text-foreground">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Here's your central hub for learning and teaching.
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={itemVariants}>
                <Link to={item.href} className="block group">
                  <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:border-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                      <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}