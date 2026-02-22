import { Chat } from '@/components/chat';

export default function AgentPage() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">
          M
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">MarginGuard AI</h1>
          <p className="text-xs text-zinc-500">Autonomous Margin Protection</p>
        </div>
      </header>

      {/* Chat fills remaining space */}
      <Chat />
    </div>
  );
}
