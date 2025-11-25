import { Book, BrainCircuit, ClipboardList, LayoutDashboard, Presentation, Sparkles, FileText, MessageCircle, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const { t } = useTranslation();
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
  const dashboardItems = [
    { title: t('courses'), href: '/app/courses', icon: Book, description: t('coursesDescription') },
    { title: t('quizzes'), href: isTeacherOrAdmin ? '/app/teacher/quizzes' : '/app/quizzes', icon: CheckSquare, description: isTeacherOrAdmin ? t('quizzesDescriptionTeacher') : t('quizzesDescriptionStudent') },
    { title: t('flashcards'), href: '/app/flashcards', icon: Presentation, description: t('flashcardsDescription') },
    { title: t('aiTutor'), href: '/app/tutor', icon: Sparkles, description: t('aiTutorDescription') },
    { title: t('mockExams'), href: '/app/mock-exams', icon: ClipboardList, description: t('mockExamsDescription') },
    { title: t('resources'), href: '/app/resources', icon: FileText, description: t('resourcesDescription') },
    { title: t('community'), href: 'https://community.academicloud.com/discord', icon: MessageCircle, description: t('communityDescription'), external: true, roles: ['student', 'teacher', 'admin'] },
    { title: t('analytics'), href: '/app/analytics', icon: BrainCircuit, description: t('analyticsDescription'), roles: ['admin', 'teacher'] },
  ];
  const visibleItems = dashboardItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));
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
            {t('welcomeBack', { name: user?.name || 'User' })}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('dashboardDescription')}
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const cardContent = (
              <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                  <Icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
            return (
              <motion.div key={item.title} variants={itemVariants}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="block group">
                    {cardContent}
                  </a>
                ) : (
                  <Link to={item.href} className="block group">
                    {cardContent}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}