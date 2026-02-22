# MarginGuard AI - Complete Setup Guide

> **Autonomous HVAC Portfolio Protection Agent**  
> Scans portfolios, identifies margin risks, investigates root causes, and delivers actionable recommendations with dollar amounts.

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Get Your Gemini API Key

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your API key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Click "Launch Agent"

---

## 📧 Email Setup (10 Minutes) - REQUIRED FOR FULL DEMO

The agent's `sendEmailReport` tool needs Google Apps Script to send emails.

### Step 1: Create Google Apps Script

1. Go to [https://script.google.com](https://script.google.com)
2. Click **"+ New project"**
3. Copy ALL the code from `/scripts/google-apps-script-email.js`
4. Paste into the GAS editor (replace default code)
5. Rename project to "MarginGuard Email Service"

### Step 2: Deploy as Web App

1. Click **"Deploy"** → **"New deployment"**
2. Click gear icon → Select **"Web app"**
3. Settings:
   - **Execute as:** Me (your-email@gmail.com)
   - **Who has access:** Anyone
4. Click **"Deploy"**
5. Click **"Authorize access"**
6. Choose your Google account
7. Click **"Advanced"** → **"Go to MarginGuard (unsafe)"** → **"Allow"**
8. **COPY THE WEB APP URL** (looks like `https://script.google.com/macros/s/AK...xyz/exec`)

### Step 3: Add to Environment Variables

Edit `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GAS_EMAIL_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
ALERT_EMAIL_TO=your-email@example.com
```

**Restart your dev server** for the new env vars to take effect.

### Step 4: Test Email

Open [http://localhost:3000/agent](http://localhost:3000/agent) and type:

```
Email me a test report
```

**Check your inbox** - you should receive an HTML email within 10 seconds!

📖 **Full email setup guide:** [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)

---

## 🎯 What This Agent Does

### Autonomous Investigation

Ask: **"How's my portfolio doing?"**

The agent will:
1. ✅ Scan all 5 projects for risk signals
2. ✅ Automatically investigate the worst project
3. ✅ Analyze labor costs and overtime
4. ✅ Check billing health and unbilled work
5. ✅ Search field notes for verbal approvals
6. ✅ Return specific action items with dollar amounts

**No manual steps. The agent decides what to investigate.**

### 7 Built-In Tools

| Tool | What It Does |
|------|--------------|
| **scanPortfolio** | Full portfolio scan with risk levels |
| **investigateProject** | Deep dive: SOV line-by-line variance analysis |
| **analyzeLaborDetails** | Labor breakdown by role, weekly trends, overtime |
| **checkBillingHealth** | Billing lag per line item, unbilled work |
| **reviewChangeOrders** | CO status, pending approvals, RFI exposure |
| **searchFieldNotes** | Keyword search in 1,300+ unstructured notes |
| **sendEmailReport** | Send professional HTML email report |

### Real-Time Transparency

Watch each tool execute live with animated cards:
- 🔍 Scanning portfolio...
- 📊 Investigating PRJ-2024-001...
- 👷 Analyzing labor for SOV-04...
- 📧 Sending email report...

---

## 💬 Try These Prompts

### Portfolio Overview
```
How's my portfolio doing?
```
**Agent chains 4-5 tools autonomously**

### Specific Project
```
What's happening with PRJ-2024-001?
```
**Deep investigation of one project**

### Find Issues
```
Find any verbal approvals without change orders
```
**Searches field notes, cross-references COs**

### Get Report
```
Email me a summary of the top 3 risks
```
**Composes and sends HTML email**

---

## 📊 Portfolio Dashboard

Visit [http://localhost:3000/reports](http://localhost:3000/reports) to see:

- **Live KPIs**: Total portfolio value, billed %, avg labor cost, OT %
- **Project Table**: All 5 projects with progress bars and risk badges
- **Investigate Buttons**: Click to launch agent with pre-filled prompt

Data loads directly from the CSV files - no database needed.

---

## 🏗️ Architecture

```
User Browser
    ↓
  Chat UI (components/chat.tsx)
    ↓
POST /api/chat
    ↓
Gemini API (gemini-3-flash-preview)
    ↓
7 Tools → CSV Data (18K records, cached in memory)
    ↓
Email Tool → Google Apps Script → Gmail
```

### The Data Pipeline

- **CSVs** in `hvac_construction_dataset/` folder (10 files, ~18K records)
- **Loaded once** per serverless function cold start
- **Cached in memory** for ~5 minutes
- **PapaParse** for parsing with automatic type conversion

### The Agent Loop

1. User sends message
2. Gemini decides which tools to call
3. Tools execute (up to 12 rounds)
4. Results stream back to UI in real-time
5. Agent summarizes findings with dollar amounts

---

## 🚢 Deploy to Vercel

### Option 1: GitHub (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repo
4. Add environment variables:
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `GAS_EMAIL_WEBHOOK_URL`
   - `ALERT_EMAIL_TO`
5. Click **Deploy**

### Option 2: Vercel CLI

```bash
vercel --prod
```

Then set environment variables in Vercel dashboard.

---

## 📂 Project Structure

```
MarginGuard AI/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Main agent with 7 tools
│   │   └── reports/route.ts    # Portfolio summary API
│   ├── agent/page.tsx          # Chat interface
│   ├── reports/page.tsx        # Live dashboard
│   └── page.tsx                # Landing page
├── components/
│   ├── chat.tsx                # Main chat with streaming
│   ├── markdown-renderer.tsx   # Tables, headers, risk badges
│   ├── tool-call-card.tsx      # Tool execution UI
│   └── tool-icons.tsx          # Custom SVG icons
├── lib/
│   ├── data-loader.ts          # CSV loading + caching
│   ├── calculations.ts         # Labor cost, OT, etc.
│   ├── types.ts                # TypeScript interfaces
│   └── system-prompt.ts        # Agent behavior rules
├── hvac_construction_dataset/  # 10 CSV files
└── scripts/
    └── google-apps-script-email.js  # Email webhook
```

---

## 🧪 Testing

### Test 1: Basic Agent Flow

```
How's my portfolio doing?
```

**Expected:**
- Agent calls `scanPortfolio`
- Auto-investigates worst project
- Calls 3-4 more tools
- Returns findings with dollar amounts

### Test 2: Email System

```
Email me a test report
```

**Expected:**
- Agent composes HTML email
- Calls `sendEmailReport` tool
- Email arrives in 5-10 seconds

### Test 3: Follow-Up Questions

```
How's my portfolio doing?
```
(wait for response)
```
What about the change orders on that project?
```

**Expected:**
- Agent remembers "that project" from context
- Pulls CO data
- Cross-references with previous findings

---

## 🎨 Design Features

- **Professional blue theme** (#2563eb primary, #16a34a accent)
- **Light/Dark mode** with theme toggle
- **Custom SVG icons** (no emojis)
- **Responsive design** (mobile-friendly)
- **Markdown rendering** (tables, headers, bold, lists)
- **Risk badges** (CRITICAL/HIGH/MEDIUM/LOW colored pills)

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ Yes | Gemini API key |
| `GAS_EMAIL_WEBHOOK_URL` | No | Google Apps Script webhook for email |
| `ALERT_EMAIL_TO` | No | Default email recipient |

### Timeouts

- **Vercel function**: 300 seconds (5 minutes)
- **Agent max rounds**: 12 tool executions
- **CSV cache**: ~5 minutes (serverless function lifetime)

### Model Settings

- **Model**: `gemini-3-flash-preview`
- **Temperature**: 0.7
- **Max tokens**: Default (no limit set)

---

## 🐛 Troubleshooting

### Agent not responding

**Check:**
1. Browser console for errors
2. Vercel function logs
3. Gemini API key is correct

**Fix:**
```bash
# Restart dev server
npm run dev
```

### Email not sending

**Check:**
1. GAS deployment is "Anyone" access
2. Webhook URL in `.env.local` is correct
3. GAS execution logs at [script.google.com](https://script.google.com)

**Test directly:**
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"<h1>Works</h1>"}'
```

### CSV data not loading

**Check:**
1. Files are in `hvac_construction_dataset/` folder
2. `vercel.json` includes CSV files
3. Vercel function logs for loading errors

**Expected file structure:**
```
hvac_construction_dataset/
├── projects.csv
├── sov_lines.csv
├── labor_actuals.csv
├── budget_sov.csv
├── billing_history.csv
├── change_orders.csv
├── rfis.csv
├── field_notes.csv
├── project_phases.csv
└── crew_assignments.csv
```

### Theme not working

**Fix:**
1. Clear browser cache
2. Check `ThemeProvider` in `app/layout.tsx`
3. Verify `suppressHydrationWarning` on `<html>` tag

---

## 🏆 Demo Script (90 Seconds)

### Beat 1: The Hook (10s)
**Type:** "How's my portfolio doing?"

**Show:** Agent autonomously chains 4-5 tool calls

### Beat 2: The Findings (30s)
**Let it run.** Agent streams:
- Portfolio summary
- Deep dive on worst project
- Specific findings with dollar amounts
- Action items

### Beat 3: Follow-Up (20s)
**Type:** "What about change orders?"

**Show:** Agent remembers context, pulls CO data

### Beat 4: The Closer (30s)
**Type:** "Email me everything."

**Pull up phone.** Show email arriving. (mic drop)

---

## 📚 Additional Docs

- **[EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)** - Complete email walkthrough
- **[claude.md](./claude.md)** - Architecture deep dive
- **[PRD.md](./PRD.md)** - Full product requirements

---

## 🤝 Built With

- [Next.js 14](https://nextjs.org)
- [Gemini AI](https://ai.google.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [PapaParse](https://www.papaparse.com)
- [Lucide Icons](https://lucide.dev)

---

**Questions?** Check the troubleshooting section or email setup guide.

**Ready to start?** Run `npm run dev` and open [http://localhost:3000/agent](http://localhost:3000/agent) 🚀
