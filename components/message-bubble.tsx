'use client';

import type { Message } from 'ai';
import { ToolInvocationCard } from '@/components/tool-invocation';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isLoading: boolean;
}

export function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {message.toolInvocations.map((invocation) => (
              <ToolInvocationCard
                key={invocation.toolCallId}
                invocation={invocation}
              />
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-card-foreground border border-border'
            }`}
          >
            <div
              className="prose prose-sm max-w-none dark:prose-invert
                prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
                prose-headings:text-foreground prose-strong:text-primary"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4">$&</ul>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-primary text-xs">$1</code>')
    .replace(/\n\n/g, '</p><p class="my-1">')
    .replace(/\n/g, '<br/>');
}
