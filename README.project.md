# MarginGuard AI - Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Add your API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.
Visit [http://localhost:3000/agent](http://localhost:3000/agent) for the AI chat interface.

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with dark theme
│   ├── page.tsx                # Landing page (VibeBrew-inspired design)
│   ├── agent/page.tsx          # AI chat interface
│   ├── globals.css             # Tailwind + custom styles
│   └── api/chat/route.ts       # AI agent API endpoint (TODO: MORGAN)
│
├── components/
│   ├── chat.tsx                # Main chat component with useChat
│   ├── message-bubble.tsx      # Message rendering
│   ├── tool-invocation.tsx     # Tool execution transparency cards
│   └── ui/                     # Shadcn components
│
├── lib/
│   ├── utils.ts                # Utility functions
│   ├── types.ts                # (TODO: MORGAN) Data interfaces
│   ├── data-loader.ts          # (TODO: MORGAN) CSV loading
│   ├── calculations.ts         # (TODO: MORGAN) Financial formulas
│   ├── tools.ts                # (TODO: MORGAN) 7 AI agent tools
│   └── system-prompt.ts        # (TODO: SASHA) Agent system prompt
│
├── hvac_construction_dataset/  # CSV data files
└── build.log                   # Development tracking log
```

## Team Roles

See build.log for detailed task breakdown:

- **ALEX**: Infrastructure, deployment, email integration
- **MORGAN**: Backend, data layer, tools, API route
- **RILEY**: Frontend, UI components, chat interface ✅ COMPLETE
- **SASHA**: System prompt, agent behavior
- **QUINN**: QA, testing, demo preparation

## Current Status

**Phase 1: Foundation** - IN PROGRESS
- ✅ Frontend structure complete
- ✅ Landing page with VibeBrew design
- ✅ Chat interface with tool transparency
- ⏳ Backend data layer (MORGAN)
- ⏳ AI agent implementation (MORGAN + SASHA)
- ⏳ Deployment (ALEX)

## Architecture

The app uses:
- **Next.js 14** with App Router
- **Vercel AI SDK** for streaming chat + tool calling
- **Gemini 2.5 Flash** as the LLM
- **Shadcn UI** for components
- **Tailwind CSS** for styling
- **PapaParse** for CSV data loading

## Key Features

1. **Portfolio Scanning**: Autonomous analysis of all projects
2. **Margin Risk Detection**: Identifies cost overruns and billing gaps
3. **Tool Transparency**: Real-time visualization of agent thinking
4. **Email Reports**: Automated summary delivery
5. **Conversational Memory**: Follow-up questions with context

## Next Steps

1. MORGAN: Implement data layer (types, loader, calculations)
2. MORGAN: Build all 7 tools with execution logic
3. MORGAN: Wire up API route with streamText + tools
4. SASHA: Write system prompt for autonomous behavior
5. ALEX: Deploy to Vercel with CSV inclusion
6. QUINN: Run demo script and validate

---

Built for Pulse NYC Hackathon 2026
