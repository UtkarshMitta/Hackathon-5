'use client';

import { getToolIcon, getToolLabel } from './tool-icons';
import { cn } from '@/lib/utils';

interface ToolCallCardProps {
  toolName: string;
  isActive?: boolean;
}

export function ToolCallCard({ toolName, isActive = false }: ToolCallCardProps) {
  const Icon = getToolIcon(toolName);
  const label = getToolLabel(toolName);

  return (
    <div
      className={cn(
        'my-2 flex items-center gap-3 rounded-lg border px-4 py-3 transition-all',
        isActive
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-muted/50'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {isActive && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '100ms' }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '200ms' }} />
            </span>
            Processing
          </span>
        )}
        {!isActive && (
          <span className="text-xs text-accent flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            Complete
          </span>
        )}
      </div>
    </div>
  );
}
