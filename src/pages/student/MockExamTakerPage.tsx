import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle, XCircle, Award, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { MockExam, MockExamSubmission } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
const fetchMockExam = async (examId: string): Promise<MockExam> => api<MockExam>(`/api/mock-exams/${examId}`);
const submitMockExam = async (examId: string, submission: Omit<MockExamSubmission, 'id' | 'tenantId' | 'examId' | 'submittedAt'>) => {
  return api(`/api/mock-exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
};
export default function MockExamTakerPage() {
  const { examId } = useParams<{ examId: string }>();
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const { data: exam, isLoading, error } = useQuery({
    queryKey: ['mock-exam', examId],
    queryFn: () => fetchMockExam(examId!),
    enabled: !!examId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const submitMutation = useMutation({
    mutationFn: (submissionData: Omit<MockExamSubmission, 'id' | 'tenantId' | 'examId' | 'submittedAt'>) => {
      if (!examId) throw new Error('Missing exam ID');
      return submitMockExam(examId, submissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mock-exams'] });
      toast.success('Exam submitted successfully!');
      setIsFinished(true);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to submit exam.'),
  });
  const finishExam = useCallback(() => {
    if (!exam || !user || isFinished) return;
    const score = Object.entries(selectedAnswers).reduce((acc, [qIndex, aIndex]) => {
      const questionIndex = Number(qIndex);
      if (questionIndex < exam.questions.length && exam.questions[questionIndex].correctAnswer === aIndex) {
        return acc + 1;
      }
      return acc;
    }, 0);
    const percentage = Math.round((score / exam.questions.length) * 100);
    setFinalScore(percentage);
    submitMutation.mutate({
      studentId: user.id,
      score: percentage,
      timeTaken: exam.duration * 60 - timeRemaining,
      answers: selectedAnswers,
    });
  }, [exam, user, selectedAnswers, timeRemaining, isFinished, submitMutation]);
  useEffect(() => {
    if (!exam) return;
    setTimeRemaining(exam.duration * 60);
  }, [exam]);
  useEffect(() => {
    if (timeRemaining > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !isFinished) {
      finishExam();
    }
  }, [timeRemaining, isFinished, finishExam]);
  const currentQuestion = exam?.questions[currentQuestionIndex];
  const progress = exam ? ((currentQuestionIndex + 1) / exam.questions.length) * 100 : 0;
  const timeProgress = (timeRemaining / (exam?.duration * 60 || 1)) * 100;
  const handleNext = () => {
    if (currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(i => i + 1);
    } else {
      finishExam();
    }
  };
  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(i => i - 1);
  };
  if (isLoading) return <div className="max-w-4xl mx-auto p-8"><Skeleton className="h-96 w-full" /></div>;
  if (error) return <div className="text-center p-8 text-destructive">Failed to load exam.</div>;
  if (!exam) return null;
  if (isFinished) {
    const score = Object.entries(selectedAnswers).reduce((acc, [qIndex, aIndex]) => {
        const questionIndex = Number(qIndex);
        if (questionIndex < exam.questions.length && exam.questions[questionIndex].correctAnswer === aIndex) {
          return acc + 1;
        }
        return acc;
      }, 0);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Award className="h-24 w-24 text-success mx-auto mb-6" />
            <h1 className="text-4xl font-bold font-display mb-4">Exam Completed!</h1>
            <p className="text-6xl font-bold text-primary mb-4">{finalScore}%</p>
            <p className="text-lg text-muted-foreground mb-8">You scored {score} out of {exam.questions.length}</p>
            <div className="space-y-4 mb-8 text-left">
              {exam.questions.map((q, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                return (
                  <div key={q.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isCorrect ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'}`}>
                    <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                      {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Q{index + 1}: {q.text}</p>
                      <p className="text-sm text-muted-foreground">Your answer: {q.options[userAnswer] ?? 'Not answered'} | Correct: {q.options[q.correctAnswer]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={() => navigate('/app/my-progress')} className="w-full">View My Progress</Button>
          </motion.div>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to Exams
        </Button>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-mono">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                </div>
                <Progress value={100 - timeProgress} className="w-24 h-2" />
              </div>
            </div>
            <Progress value={progress} className="mb-4" />
            <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-lg font-semibold mb-6">{currentQuestion?.text}</p>
                <RadioGroup
                  value={String(selectedAnswers[currentQuestionIndex] ?? '')}
                  onValueChange={(value) => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: Number(value) }))}
                  className="space-y-3"
                >
                  {currentQuestion?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-md border has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                      <RadioGroupItem value={String(index)} id={`q-${currentQuestionIndex}-o-${index}`} />
                      <Label htmlFor={`q-${currentQuestionIndex}-o-${index}`} className="cursor-pointer flex-1">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>
            <Button onClick={handleNext} disabled={selectedAnswers[currentQuestionIndex] === undefined || submitMutation.isPending}>
              {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentQuestionIndex === exam.questions.length - 1 ? 'Finish Exam' : 'Next'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}