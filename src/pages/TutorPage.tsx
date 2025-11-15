import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Languages, MessageSquare, BookText, Lightbulb, HelpCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}
type TutorAction = 'message' | 'summarize' | 'explain' | 'quiz-me';
type Language = 'en' | 'fr';
const actionIcons: Record<Exclude<TutorAction, 'message'>, React.ElementType> = {
  summarize: BookText,
  explain: Lightbulb,
  'quiz-me': HelpCircle,
};
const tutorActions: { action: Exclude<TutorAction, 'message'>; label: string }[] = [
  { action: 'summarize', label: 'Summarize' },
  { action: 'explain', label: 'Explain' },
  { action: 'quiz-me', label: 'Quiz Me' },
];
const fetchTutorResponse = async ({ content, action, language }: { content: string; action: TutorAction; language: Language }) => {
  const { response } = await api<{ response: string }>(`/api/tutor/${action}`, {
    method: 'POST',
    body: JSON.stringify({ content, language }),
  });
  return response;
};
export default function TutorPage() {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! Paste any text below and I can help you understand it. You can also just ask a question!", sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isPro = user?.subscriptionTier === 'pro';
  const tutorMutation = useMutation({
    mutationFn: fetchTutorResponse,
    onSuccess: (response) => {
      const aiResponse: Message = { id: Date.now(), text: response, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to get response from tutor.');
    },
  });
  const handleAction = (action: TutorAction) => {
    if (input.trim() === '' && action !== 'message') {
      toast.info('Please paste some text or ask a question first.');
      return;
    }
    const content = input;
    const newUserMessage: Message = {
      id: Date.now(),
      text: action === 'message' ? content : `${action.charAt(0).toUpperCase() + action.slice(1)}: "${content.substring(0, 50)}..."`,
      sender: 'user',
    };
    setMessages(prev => [...prev, newUserMessage]);
    if (action === 'message') setInput('');
    tutorMutation.mutate({ content, action, language });
  };
  useEffect(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }, 100);
  }, [messages]);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
      <div className="py-8 md:py-10 lg:py-12 h-full flex flex-col">
        <div className="text-center mb-8">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-display text-foreground">AI Tutor</h1>
          <p className="mt-2 text-lg text-muted-foreground">Your personal assistant for any learning questions.</p>
        </div>
        {!isPro && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Badge variant="secondary" className="w-full text-center justify-center p-2">
              Basic AI available. <Link to="/app/billing" className="ml-1 font-semibold text-primary hover:underline">Upgrade to Pro</Link> for full capabilities.
            </Badge>
          </motion.div>
        )}
        <div className="flex-1 flex flex-col bg-card border rounded-lg shadow-soft overflow-hidden">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={cn('flex items-start gap-3 max-w-lg', message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                  >
                    <Avatar>
                      <AvatarImage src={message.sender === 'user' ? user?.avatarUrl : undefined} />
                      <AvatarFallback>{message.sender === 'user' ? (user?.name ? user.name.charAt(0) : 'U') : 'AI'}</AvatarFallback>
                    </Avatar>
                    <div className={cn('p-3 rounded-2xl', message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none')}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
                {tutorMutation.isPending && (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 max-w-lg mr-auto">
                    <Avatar><AvatarFallback>AI</AvatarFallback></Avatar>
                    <div className="p-3 rounded-2xl bg-muted rounded-bl-none flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TooltipProvider>
                  {tutorActions.map(({ action, label }) => {
                    const Icon = actionIcons[action];
                    const button = (
                      <Button key={action} variant="outline" size="sm" onClick={() => handleAction(action)} disabled={!isPro || tutorMutation.isPending}>
                        {!isPro && <Lock className="mr-2 h-4 w-4" />}
                        {isPro && <Icon className="mr-2 h-4 w-4" />}
                        {label}
                      </Button>
                    );
                    return isPro ? (
                      button
                    ) : (
                      <Tooltip key={action}>
                        <TooltipTrigger asChild>
                          <span>{button}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upgrade to Pro for advanced features</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <ToggleGroup type="single" value={language} onValueChange={(value: Language) => value && setLanguage(value)} size="sm">
                  <ToggleGroupItem value="en">EN</ToggleGroupItem>
                  <ToggleGroupItem value="fr">FR</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste text or ask a question..."
                className="flex-1 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) handleAction('message');
                  }
                }}
              />
              <Button onClick={() => handleAction('message')} size="icon" disabled={!input.trim() || tutorMutation.isPending}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}