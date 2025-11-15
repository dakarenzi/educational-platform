import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, ArrowLeft, ArrowRight, Award } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import { api } from '@/lib/api-client';
import type { Quiz } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
const fetchQuiz = async (quizId: string): Promise<Quiz> => {
  return api<Quiz>(`/api/quizzes/${quizId}`);
};
export default function QuizTakerPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId!),
    enabled: !!quizId,
  });
  const score = quiz ? Object.entries(selectedAnswers).reduce((acc, [qIndex, aIndex]) => {
    if (quiz.questions[Number(qIndex)].correctAnswer === aIndex) {
      return acc + 1;
    }
    return acc;
  }, 0) : 0;
  if (isLoading) return <div className="max-w-2xl mx-auto p-8"><Skeleton className="h-96 w-full" /></div>;
  if (error) return <div className="text-center p-8 text-destructive">Failed to load quiz.</div>;
  if (!quiz) return null;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };
  const handlePrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(i => i - 1);
  };
  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <Confetti active={percentage >= 80} config={{ spread: 90, elementCount: 200 }} />
        <Award className="h-24 w-24 text-amber-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-display">Quiz Complete!</h1>
        <p className="text-xl text-muted-foreground mt-2">You scored</p>
        <p className="text-6xl font-bold text-primary my-4">{percentage}%</p>
        <p className="text-lg text-muted-foreground">({score} out of {quiz.questions.length} correct)</p>
        <Button asChild className="mt-8">
          <Link to={-1 as any}>Back to Course</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Card>
          <CardHeader>
            <Progress value={progress} className="mb-4" />
            <CardTitle className="text-2xl font-display">{quiz.title}</CardTitle>
            <CardDescription>Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-6">{currentQuestion.text}</p>
            <RadioGroup
              value={String(selectedAnswers[currentQuestionIndex])}
              onValueChange={(value) => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: Number(value) }))}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-md border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value={String(index)} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 text-base cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={handleNext} disabled={selectedAnswers[currentQuestionIndex] === undefined}>
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}