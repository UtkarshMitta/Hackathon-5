'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Shield, AlertTriangle } from 'lucide-react';
import { ToolCallCard } from '@/components/tool-call-card';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { parseMessageBlocks } from '@/lib/parse-message';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "How's my portfolio doing?",
  'Which project has the most margin risk?',
  'Find any verbal approvals without change orders',
  'Show me unbilled work across all projects',
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText };
    const assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, assistantMsg]);
    setInput('');
    setIsLoading(true);

    const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: accumulated };
          }
          return copy;
        });
      }

      if (!accumulated.trim()) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: 'No response received from the agent.' };
          }
          return copy;
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center pt-20">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                MarginGuard AI Agent
              </h2>
              <p className="mb-8 max-w-md text-center text-muted-foreground leading-relaxed">
                I autonomously scan your HVAC project portfolio, investigate margin risks,
                and deliver specific recovery actions with dollar estimates.
              </p>
              <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-card-foreground transition-colors hover:bg-accent/20 hover:border-primary/30"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <AssistantMessage
                    content={message.content}
                    isStreaming={isLoading && message === messages[messages.length - 1]}
                  />
                )}
              </div>
            ))
          )}

          {error && (
            <div className="mx-auto max-w-lg rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Something went wrong</p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  <button onClick={() => setError(null)} className="mt-2 text-sm font-medium text-primary hover:underline">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your portfolio..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/** Renders assistant messages with parsed tool calls and rich markdown */
function AssistantMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
        </div>
        Agent is thinking...
      </div>
    );
  }

  const blocks = parseMessageBlocks(content);

  // Group consecutive tool calls together
  const grouped: Array<
    | { type: 'tool-group'; tools: Array<{ toolName: string; isLast: boolean }> }
    | { type: 'content'; text: string }
  > = [];

  for (const block of blocks) {
    if (block.type === 'tool-call') {
      const last = grouped[grouped.length - 1];
      if (last && last.type === 'tool-group') {
        last.tools.push({ toolName: block.toolName, isLast: block.isLast });
      } else {
        grouped.push({ type: 'tool-group', tools: [{ toolName: block.toolName, isLast: block.isLast }] });
      }
    } else {
      grouped.push({ type: 'content', text: block.text });
    }
  }

  return (
    <div className="space-y-3">
      {grouped.map((group, gi) => {
        if (group.type === 'tool-group') {
          return (
            <div key={gi} className="space-y-1">
              {group.tools.map((tool, ti) => (
                <ToolCallCard key={ti} toolName={tool.toolName} isActive={tool.isLast && isStreaming} />
              ))}
            </div>
          );
        }
        return (
          <div key={gi} className="rounded-2xl border border-border bg-card px-5 py-4">
            <MarkdownRenderer content={group.text} />
            {isStreaming && gi === grouped.length - 1 && (
              <span className="typing-cursor" />
            )}
          </div>
        );
      })}
    </div>
  );
}
