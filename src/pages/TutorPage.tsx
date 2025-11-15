import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}
const initialMessages: Message[] = [
  { id: 1, text: "Hello! I'm your AI Tutor. How can I help you with your studies today?", sender: 'ai' },
  { id: 2, text: "I'm having trouble understanding the concept of Durable Objects in Cloudflare Workers.", sender: 'user' },
  { id: 3, text: "Of course! Think of a Durable Object as a special kind of Worker that has its own persistent storage. Unlike regular Workers that might be spun up and down anywhere, a Durable Object has a consistent, single location for a given ID, ensuring that all requests for that ID go to the same instance. This makes it perfect for things like chat rooms, game sessions, or collaborative documents where you need to manage state reliably. Does that make sense?", sender: 'ai' },
];
export default function TutorPage() {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    const newUserMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: "That's a great question! Let me think... (AI responses are currently mocked)",
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };
  useEffect(() => {
    // This is a simple way to scroll to bottom. A more robust solution might use a library.
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
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
                    className={cn(
                      'flex items-start gap-3 max-w-lg',
                      message.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={message.sender === 'user' ? user?.avatarUrl : undefined} />
                      <AvatarFallback>
                        {message.sender === 'user' ? (user?.name ? user.name.charAt(0) : 'U') : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'p-3 rounded-2xl',
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your course..."
                className="flex-1"
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}