'use client';

import { Chat } from '@/components/chat';
import { Navigation } from '@/components/navigation';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AgentContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get('prompt') || undefined;

  return (
    <div className="flex h-screen flex-col">
      <Navigation />
      <Chat initialPrompt={prompt} />
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense>
      <AgentContent />
    </Suspense>
  );
}
