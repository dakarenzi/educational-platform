import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Book, Presentation, ClipboardList, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
const teacherActions = [
  {
    title: 'Manage Your Courses',
    description: 'Edit existing courses and add new lessons or quizzes.',
    href: '/app/teacher/courses',
    icon: Book,
  },
  {
    title: 'Manage Flashcard Decks',
    description: 'Create and edit flashcard decks for your students.',
    href: '/app/teacher/flashcards',
    icon: Presentation,
  },
  {
    title: 'Manage Mock Exams',
    description: 'Build and review practice exams for test preparation.',
    href: '/app/teacher/mock-exams',
    icon: ClipboardList,
  },
  {
    title: 'Manage Resources',
    description: 'Upload and organize documents, images, and other materials.',
    href: '/app/teacher/resources',
    icon: FileText,
  },
];
export default function TeacherDashboardPage() {
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
    },
  };
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold font-display text-foreground">
          Teacher Dashboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Welcome, {user?.name}. Here are your tools to create and manage content.
        </p>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {teacherActions.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.title} variants={itemVariants}>
              <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link to={item.href}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}