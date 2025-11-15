import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, RefreshCw, Layers, PlusCircle, Trash2, FilePenLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Flashcard, FlashcardDeck } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FlashcardForm } from '@/components/forms/FlashcardForm';
const fetchDeck = async (deckId: string): Promise<FlashcardDeck> => {
  return api<FlashcardDeck>(`/api/flashcard-decks/${deckId}`);
};
export default function FlashcardDeckPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const { data: deck, isLoading, error } = useQuery({
    queryKey: ['flashcard-deck', deckId],
    queryFn: () => fetchDeck(deckId!),
    enabled: !!deckId,
  });
  const updateDeckMutation = useMutation({
    mutationFn: (updatedDeck: FlashcardDeck) => api<FlashcardDeck>(`/api/flashcard-decks/${deckId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedDeck),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['flashcard-deck', deckId], data);
      toast.success('Deck updated successfully!');
      setFormOpen(false);
      setEditingCard(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update deck.');
    },
  });
  const handleAddOrEditCard = (values: { question: string; answer: string }) => {
    if (!deck) return;
    let updatedCards: Flashcard[];
    if (editingCard) {
      // Edit existing card
      updatedCards = (deck.cards || []).map(card =>
        card.id === editingCard.id ? { ...card, ...values } : card
      );
    } else {
      // Add new card
      const newCard: Flashcard = {
        id: crypto.randomUUID(),
        deckId: deck.id,
        ...values,
      };
      updatedCards = [...(deck.cards || []), newCard];
    }
    updateDeckMutation.mutate({ ...deck, cards: updatedCards });
  };
  const handleDeleteCard = (cardId: string) => {
    if (!deck) return;
    const updatedCards = (deck.cards || []).filter(card => card.id !== cardId);
    updateDeckMutation.mutate({ ...deck, cards: updatedCards });
    if (currentIndex >= updatedCards.length && updatedCards.length > 0) {
      setCurrentIndex(updatedCards.length - 1);
    }
  };
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
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
  if (error) return <div className="text-center p-8 text-destructive">Failed to load flashcard deck.</div>;
  if (!deck) return null;
  const cards = deck.cards || [];
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };
  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/app/flashcards"><ArrowLeft className="mr-2 h-4 w-4" />Back to Decks</Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">{deck.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{deck.description}</p>
          </div>
          {isTeacherOrAdmin && (
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCard(null)}><PlusCircle className="mr-2 h-4 w-4" /> Add Card</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCard ? 'Edit Card' : 'Add a New Card'}</DialogTitle>
                  <DialogDescription>Fill in the question and answer for the flashcard.</DialogDescription>
                </DialogHeader>
                <FlashcardForm
                  onSubmit={handleAddOrEditCard}
                  isLoading={updateDeckMutation.isPending}
                  initialData={editingCard || undefined}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {cards.length > 0 ? `Card ${currentIndex + 1} of ${cards.length}` : 'No cards'}
            </span>
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
            <p className="mt-1 text-sm text-muted-foreground">
              {isTeacherOrAdmin ? 'Add some cards to start building your deck.' : 'The creator has not added any cards yet.'}
            </p>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={handlePrev}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
            <div className="flex items-center gap-2">
              {isTeacherOrAdmin && currentCard && (
                <>
                  <Button variant="outline" size="icon" onClick={() => { setEditingCard(currentCard); setFormOpen(true); }}>
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete this flashcard.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCard(currentCard.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsFlipped(!isFlipped)}><RefreshCw className="h-5 w-5" /></Button>
            </div>
            <Button onClick={handleNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}