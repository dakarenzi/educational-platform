import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { FlashcardDeck } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
const fetchDeck = async (deckId: string): Promise<FlashcardDeck> => {
  return api<FlashcardDeck>(`/api/flashcard-decks/${deckId}`);
};
export default function FlashcardDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['flashcard-deck', deckId],
    queryFn: () => fetchDeck(deckId!),
    enabled: !!deckId,
  });
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="aspect-[3/2] w-full rounded-lg" />
        <div className="flex justify-between mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="text-center p-8 text-destructive">Failed to load flashcard deck.</div>;
  }
  if (!deck) return null;
  const cards = deck.cards || [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };
  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/app/flashcards"><ArrowLeft className="mr-2 h-4 w-4" />Back to Decks</Link>
        </Button>
        <h1 className="text-4xl font-bold font-display text-foreground">{deck.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{deck.description}</p>
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Card {currentIndex + 1} of {cards.length}</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="mt-6 perspective-[1000px]">
          <motion.div
            className="relative w-full aspect-[3/2] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Card className="absolute w-full h-full flex items-center justify-center p-6 backface-hidden">
              <CardContent className="text-center">
                <p className="text-2xl md:text-3xl font-semibold">{currentCard?.question}</p>
              </CardContent>
            </Card>
            <Card className="absolute w-full h-full flex items-center justify-center p-6 backface-hidden [transform:rotateY(180deg)] bg-secondary">
              <CardContent className="text-center">
                <p className="text-xl md:text-2xl text-secondary-foreground">{currentCard?.answer}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        {cards.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No cards in this deck</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add some cards to start studying.</p>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFlipped(!isFlipped)}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}