'use client';

import { Message } from 'ai';
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
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-500">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool invocation cards (assistant only) */}
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

        {/* Text content */}
        {message.content && (
          <div
            className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
            }`}
          >
            <div
              className="prose prose-invert prose-sm max-w-none
                prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
                prose-headings:text-zinc-100 prose-strong:text-emerald-400
                prose-table:text-xs"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
            />
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-700 text-zinc-300">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown to HTML converter.
 * Handles: **bold**, headers, lists, tables, line breaks.
 * Does NOT need a full markdown library — keep deps light.
 */
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc pl-4">$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Code blocks
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1 rounded text-emerald-400">$1</code>')
    // Line breaks (double newline = paragraph)
    .replace(/\n\n/g, '</p><p class="my-1">')
    .replace(/\n/g, '<br/>');
}
