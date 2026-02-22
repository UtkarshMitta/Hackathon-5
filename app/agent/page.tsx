import { Chat } from '@/components/chat';
import { Navigation } from '@/components/navigation';

export default function AgentPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Navigation />
      <Chat />
    </div>
  );
}
