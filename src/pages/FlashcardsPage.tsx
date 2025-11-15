import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Presentation } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { FlashcardDeck } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FlashcardDeckForm } from '@/components/forms/FlashcardDeckForm';
const fetchDecks = async (): Promise<FlashcardDeck[]> => {
  return api<FlashcardDeck[]>('/api/flashcard-decks');
};
export default function FlashcardsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: decks, isLoading, error } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: fetchDecks,
  });
  const createDeckMutation = useMutation({
    mutationFn: (newDeck: Omit<FlashcardDeck, 'id' | 'cards' | 'tenantId'> & { tenantId: string }) => api<FlashcardDeck>('/api/flashcard-decks', {
      method: 'POST',
      body: JSON.stringify(newDeck),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Flashcard deck created successfully!');
      setCreateDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create deck.');
    },
  });
  const handleCreateDeck = (values: { title: string; description: string }) => {
    if (!user) {
      toast.error('You must be logged in to create a deck.');
      return;
    }
    createDeckMutation.mutate({ ...values, userId: user.id, tenantId: 'inst-1' });
  };
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-display text-foreground">Flashcard Decks</h1>
            <p className="mt-2 text-lg text-muted-foreground">Browse decks or create your own to study.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <PlusCircle className="h-5 w-5" />
                Create Deck
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a New Deck</DialogTitle>
                <DialogDescription>Fill in the details for your new flashcard deck.</DialogDescription>
              </DialogHeader>
              <FlashcardDeckForm onSubmit={handleCreateDeck} isLoading={createDeckMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-1" /></CardContent></Card>
            ))}
          </div>
        )}
        {error && <p className="text-destructive">Failed to load decks. Please try again later.</p>}
        {!isLoading && !error && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {decks?.map((deck) => (
              <motion.div key={deck.id} variants={itemVariants}>
                <Link to={`/app/flashcards/${deck.id}`} className="block h-full group">
                  <Card className="h-full flex flex-col transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3"><Presentation className="h-6 w-6 text-primary" />{deck.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription>{deck.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}