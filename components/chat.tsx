'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/message-bubble';
import { Send, Shield } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How's my portfolio doing?",
  'Which project has the most margin risk?',
  'Find any verbal approvals without change orders',
  'Show me unbilled work across all projects',
];

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      api: '/api/chat',
    });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 50);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                MarginGuard AI Agent
              </h2>
              <p className="mb-8 max-w-md text-center text-muted-foreground">
                I autonomously scan your HVAC project portfolio, investigate margin risks,
                and deliver specific recovery actions with dollar estimates.
              </p>
              <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-card-foreground transition-colors hover:bg-accent"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLoading={isLoading}
              />
            ))
          )}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span>Agent is thinking...</span>
              </div>
            )}
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your portfolio..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
