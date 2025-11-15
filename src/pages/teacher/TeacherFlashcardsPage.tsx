import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, Eye, FilePenLine, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { FlashcardDeck } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FlashcardDeckForm } from '@/components/forms/FlashcardDeckForm';
const fetchTeacherDecks = async (): Promise<FlashcardDeck[]> => {
  return api<FlashcardDeck[]>('/api/teacher/flashcard-decks');
};
export default function TeacherFlashcardsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: decks, isLoading, error } = useQuery({
    queryKey: ['teacher-flashcard-decks'],
    queryFn: fetchTeacherDecks,
  });
  const createDeckMutation = useMutation({
    mutationFn: (newDeck: Omit<FlashcardDeck, 'id' | 'cards' | 'tenantId'> & { tenantId: string }) => api<FlashcardDeck>('/api/flashcard-decks', {
      method: 'POST',
      body: JSON.stringify(newDeck),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-flashcard-decks'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Deck created successfully!');
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Manage Your Flashcards</h1>
          <p className="mt-2 text-lg text-muted-foreground">Here are all the flashcard decks you've created.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="h-5 w-5" />
            Create New Deck
          </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6 mt-1" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
            </Card>
          ))}
        </div>
      )}
      {error && <p className="text-destructive">Failed to load your decks. Please try again later.</p>}
      {!isLoading && !error && (
        decks?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">You haven't created any decks yet.</h3>
            <p className="text-muted-foreground mt-2 mb-4">Click the button above to get started.</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Deck
            </Button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {decks?.map((deck) => (
              <motion.div key={deck.id} variants={itemVariants}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{deck.title}</CardTitle>
                        <CardDescription className="mt-1">{deck.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={`/app/flashcards/${deck.id}`}><Eye className="mr-2 h-4 w-4" />View Deck</Link></DropdownMenuItem>
                          <DropdownMenuItem disabled><FilePenLine className="mr-2 h-4 w-4" />Edit Deck</DropdownMenuItem>
                          <DropdownMenuItem disabled className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete Deck</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {/* Could show stats here, e.g., number of cards */}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/app/flashcards/${deck.id}`}>Manage Deck</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
}