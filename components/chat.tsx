'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@/components/message-bubble';
import { Send } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How's my portfolio doing?",
  "Which project has the most margin risk?",
  "Find any verbal approvals without change orders",
  "Show me unbilled work across all projects",
];

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: '/api/chat',
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    // Trigger submit on next tick
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 50);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center pt-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-500 text-3xl mb-6">
                🛡️
              </div>
              <h2 className="text-2xl font-semibold text-zinc-100 mb-2">
                MarginGuard AI
              </h2>
              <p className="text-zinc-400 text-center max-w-md mb-8">
                I autonomously scan your HVAC project portfolio, investigate margin risks,
                and deliver specific recovery actions with dollar estimates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} isLoading={isLoading} />
            ))
          )}

          {/* Thinking indicator when loading but no streaming content yet */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Agent is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your portfolio..."
            className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
