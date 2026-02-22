# MarginGuard AI - Agent Instructions

## Project Overview
MarginGuard AI is an autonomous HVAC portfolio protection agent. It uses AI to scan contractor projects, identify margin risks, investigate root causes to the SOV line-item level, and deliver specific dollar-denominated recovery recommendations.

## Architecture

```
Browser (useChat) --> POST /api/chat --> streamText + 7 tools --> CSV data (in-memory cache)
                                                              --> GAS email webhook
```

- LLM: google/gemini-2.5-flash-preview-04-17 (via Vercel AI Gateway)
- Data: 10 CSVs (~18K records) loaded once per cold start, cached in memory
- Streaming: AI SDK v4 streamText with toDataStreamResponse()
- Tools: 7 server-side tools with Zod schemas, maxSteps: 15

## File Structure

```
app/
  layout.tsx              # Root layout with ThemeProvider (light/dark)
  page.tsx                # Landing page with Navigation
  agent/page.tsx          # Chat interface page
  reports/page.tsx        # Reports page (placeholder)
  vision/page.tsx         # Vision page (placeholder)
  globals.css             # Theme tokens (blue primary, green accent)
  api/chat/route.ts       # Full API with all 7 tools implemented

components/
  navigation.tsx          # Global top nav with theme toggle
  chat.tsx                # Main chat with useChat hook
  message-bubble.tsx      # User/assistant message rendering
  tool-invocation.tsx     # Tool call transparency cards
  icons.tsx               # Custom SVG icons (no emojis)
  logo.tsx                # Brand logo SVG
  theme-provider.tsx      # next-themes provider
  theme-toggle.tsx        # Light/dark mode toggle
  ui/                     # shadcn components

lib/
  types.ts                # All TypeScript interfaces for CSV data
  data-loader.ts          # PapaParse CSV loading with caching
  calculations.ts         # laborCost, overtimePremium, safeDivide, round, etc.
  system-prompt.ts        # System prompt (autonomous chaining, dollar amounts)
  utils.ts                # cn() utility

hvac_construction_dataset/  # 10 CSV files (~18K records)
```

## 7 Tools

1. **scanPortfolio** - Full portfolio health scan with risk levels per project
2. **investigateProject** - SOV line-by-line variance analysis for a specific project
3. **analyzeLaborDetails** - Labor breakdown by role, weekly trends, overtime analysis
4. **checkBillingHealth** - Billing lag per line item, cash position, underbilled work
5. **reviewChangeOrders** - CO status, RFI exposure, unbilled work detection
6. **searchFieldNotes** - Keyword search in unstructured daily field notes
7. **sendEmailReport** - Send HTML email via Google Apps Script webhook

## Key Design Decisions

- **No emojis** - All icons use lucide-react or custom SVG components
- **Theme support** - Light and dark modes via next-themes with CSS variables
- **Blue primary color** - Professional B2B SaaS aesthetic (hsl 221 83% 53%)
- **AI Gateway** - Model string `google/gemini-2.5-flash-preview-04-17` (no provider import needed)
- **CSV path** - `hvac_construction_dataset/` (not `data/`)
- **vercel.json** - Includes `hvac_construction_dataset/**` in serverless bundle

## Agent Behavior (System Prompt Rules)

1. Start broad (scanPortfolio), then automatically go deep on at-risk projects
2. Chain AT LEAST 4 tool calls for portfolio-level questions
3. Every finding must have a dollar amount
4. Every recommendation must be specific and actionable with urgency level
5. Reference evidence: project IDs, SOV lines, field note IDs, dates
6. Auto-investigate: labor variance > 15%, billing lag > 5%, pending COs > 21 days

## Environment Variables

- `GAS_EMAIL_WEBHOOK_URL` - Google Apps Script webhook for email (optional)
- `ALERT_EMAIL_TO` - Default email recipient (optional)
- Vercel AI Gateway handles LLM auth automatically

## Development Notes

- Data loads from `process.cwd() + '/hvac_construction_dataset/'`
- PapaParse `dynamicTyping: true` converts numbers automatically
- All calculations use `round()` and `safeDivide()` for safety
- Tool returns are JSON - the LLM reasons about them, the UI renders tool cards
- next.config.mjs has `outputFileTracingIncludes` to bundle CSVs into serverless function
- No hardcoded colors anywhere - all components use CSS variable theme tokens
- Tool invocation cards use lucide-react icons instead of emojis
- message-bubble uses `dark:prose-invert` for theme-aware markdown rendering
