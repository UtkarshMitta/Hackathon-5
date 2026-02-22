import { NextRequest } from 'next/server';

// Placeholder API route - will be implemented by MORGAN
// This handles the AI agent chat with tool calling

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // TODO: MORGAN to implement with:
    // - streamText from 'ai' package
    // - google('gemini-2.5-flash-preview-04-17') model
    // - All 7 tools (scanPortfolio, investigateProject, etc.)
    // - maxSteps: 15
    // - system prompt from lib/system-prompt.ts
    
    return new Response(
      JSON.stringify({ 
        error: 'API not implemented yet. MORGAN will wire up streamText + tools.' 
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
