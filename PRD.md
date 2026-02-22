

# MarginGuard AI — Final Build Blueprint

## 2.5-Hour Execution Plan | WIN-ONLY Mode

---

## 1. Mission & Constraints

| Constraint | Value |
|---|---|
| Time remaining | 2.5 hours |
| Team | 2 directors + Claude coding agents |
| LLM | Gemini 2.5 Flash (`@ai-sdk/google`) |
| Hosting | Vercel Pro (300s function timeout) |
| Email | Google Apps Script webhook |
| Projects in dataset | Dynamic (at least 3: PRJ-2024-001, 002, 003) |
| Records | ~18K across 10 CSVs |
| Scoring | 40% Agent Intelligence, 30% Agent Experience, 20% Implementation, 10% Business Insight |

**Non-negotiables for winning:** The agent must (1) autonomously chain 4+ tool calls from a single prompt, (2) show each tool call visually in real time, (3) produce dollar-denominated recommendations, (4) send an actual email.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  BROWSER                                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Chat Interface (useChat from ai/react)              │ │
│  │  ├── Message stream (text + tool invocation cards)   │ │
│  │  ├── Input bar                                       │ │
│  │  └── Renders toolInvocations as status indicators    │ │
│  └──────────────────────┬───────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │ POST /api/chat (streaming)
┌─────────────────────────┼────────────────────────────────┐
│  VERCEL SERVERLESS      │  (runtime: nodejs, max: 300s)  │
│  ┌──────────────────────┴───────────────────────────────┐ │
│  │  streamText({                                        │ │
│  │    model: google('gemini-2.5-flash-preview-04-17'),  │ │
│  │    system: SYSTEM_PROMPT,                            │ │
│  │    tools: { 7 tools },                               │ │
│  │    maxSteps: 15,                                     │ │
│  │  })                                                  │ │
│  └──────┬────────────────────────────────────────┬──────┘ │
│         │ tool calls                             │        │
│  ┌──────┴──────────┐                    ┌────────┴──────┐ │
│  │  Data Layer      │                    │  Email (GAS)  │ │
│  │  CSV → memory    │                    │  POST webhook │ │
│  │  (cached once)   │                    └───────────────┘ │
│  └─────────────────┘                                      │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Complete Folder Structure

```
margin-guard/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Main page — renders <Chat />
│   ├── globals.css             # Tailwind base styles
│   └── api/
│       └── chat/
│           └── route.ts        # Agent endpoint (streamText + tools)
│
├── components/
│   ├── chat.tsx                # Main chat component (useChat hook)
│   ├── message-list.tsx        # Scrollable message container
│   ├── message-bubble.tsx      # Single message (user or assistant)
│   ├── tool-invocation.tsx     # Renders tool call status/result cards
│   └── ui/                     # Shadcn components (auto-generated)
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── scroll-area.tsx
│       └── collapsible.tsx
│
├── lib/
│   ├── data-loader.ts          # CSV parsing + in-memory cache
│   ├── tools.ts                # All 7 tool definitions (Zod schemas + execute)
│   ├── system-prompt.ts        # System prompt constant
│   ├── calculations.ts         # Shared calculation helpers
│   └── types.ts                # TypeScript interfaces for all data
│
├── data/                       # Raw CSV files (10 files)
│   ├── contracts.csv
│   ├── sov.csv
│   ├── sov_budget.csv
│   ├── labor_logs.csv
│   ├── material_deliveries.csv
│   ├── billing_history.csv
│   ├── billing_line_items.csv
│   ├── change_orders.csv
│   ├── rfis.csv
│   └── field_notes.csv
│
├── vercel.json                 # Include data/ in serverless bundle
├── next.config.js              # Next.js config
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json             # Shadcn config
├── postcss.config.js
└── .env.local                  # API keys (not committed)
```

---

## 4. Environment Setup

### `.env.local`
```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
GAS_EMAIL_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
ALERT_EMAIL_TO=your@email.com
```

### `vercel.json`
```json
{
  "functions": {
    "app/api/chat/route.ts": {
      "includeFiles": "data/**",
      "maxDuration": 300
    }
  }
}
```

### `package.json` dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "ai": "^4.0.0",
    "@ai-sdk/google": "^1.0.0",
    "papaparse": "^5.4.1",
    "zod": "^3.23.0",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14",
    "@types/node": "^20",
    "@types/react": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

### Shadcn components to install
```bash
npx shadcn@latest init
npx shadcn@latest add button input card badge scroll-area collapsible
```

---

## 5. Data Layer

### `lib/types.ts`
```typescript
export interface Contract {
  project_id: string;
  project_name: string;
  original_contract_value: number;
  contract_date: string;
  substantial_completion_date: string;
  retention_pct: number;
  payment_terms: string;
  gc_name: string;
  architect: string;
  engineer_of_record: string;
}

export interface SOVLine {
  project_id: string;
  sov_line_id: string;
  line_number: number;
  description: string;
  scheduled_value: number;
  labor_pct: number;
  material_pct: number;
}

export interface SOVBudget {
  project_id: string;
  sov_line_id: string;
  estimated_labor_hours: number;
  estimated_labor_cost: number;
  estimated_material_cost: number;
  estimated_equipment_cost: number;
  estimated_sub_cost: number;
  productivity_factor: number;
  key_assumptions: string;
}

export interface LaborLog {
  project_id: string;
  log_id: string;
  date: string;
  employee_id: string;
  role: string;
  sov_line_id: string;
  hours_st: number;
  hours_ot: number;
  hourly_rate: number;
  burden_multiplier: number;
  work_area: string;
  cost_code: string;
}

export interface MaterialDelivery {
  project_id: string;
  delivery_id: string;
  date: string;
  sov_line_id: string;
  material_category: string;
  item_description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  po_number: string;
  vendor: string;
  received_by: string;
  condition_notes: string;
}

export interface BillingHistory {
  project_id: string;
  application_number: number;
  period_end: string;
  period_total: number;
  cumulative_billed: number;
  retention_held: number;
  net_payment_due: number;
  status: string;
  payment_date: string;
  line_item_count: number;
}

export interface BillingLineItem {
  sov_line_id: string;
  description: string;
  scheduled_value: number;
  previous_billed: number;
  this_period: number;
  total_billed: number;
  pct_complete: number;
  balance_to_finish: number;
  project_id: string;
  application_number: number;
}

export interface ChangeOrder {
  project_id: string;
  co_number: string;
  date_submitted: string;
  reason_category: string;
  description: string;
  amount: number;
  status: string;
  related_rfi: string;
  affected_sov_lines: string; // raw string — parse with parseAffectedLines()
  labor_hours_impact: number;
  schedule_impact_days: number;
  submitted_by: string;
  approved_by: string;
}

export interface RFI {
  project_id: string;
  rfi_number: string;
  date_submitted: string;
  subject: string;
  submitted_by: string;
  assigned_to: string;
  priority: string;
  status: string;
  date_required: string;
  date_responded: string;
  response_summary: string;
  cost_impact: string;   // "True" or "False" string
  schedule_impact: string; // "True" or "False" string
}

export interface FieldNote {
  project_id: string;
  note_id: string;
  date: string;
  author: string;
  note_type: string;
  content: string;
  photos_attached: number;
  weather: string;
  temp_high: number;
  temp_low: number;
}

export interface DataStore {
  contracts: Contract[];
  sov: SOVLine[];
  sovBudget: SOVBudget[];
  laborLogs: LaborLog[];
  materialDeliveries: MaterialDelivery[];
  billingHistory: BillingHistory[];
  billingLineItems: BillingLineItem[];
  changeOrders: ChangeOrder[];
  rfis: RFI[];
  fieldNotes: FieldNote[];
}
```

### `lib/data-loader.ts`
```typescript
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { DataStore } from './types';

let cache: DataStore | null = null;

function loadCSV<T>(filename: string): T[] {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = Papa.parse<T>(content, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return data;
}

export function getData(): DataStore {
  if (cache) return cache;
  cache = {
    contracts: loadCSV('contracts.csv'),
    sov: loadCSV('sov.csv'),
    sovBudget: loadCSV('sov_budget.csv'),
    laborLogs: loadCSV('labor_logs.csv'),
    materialDeliveries: loadCSV('material_deliveries.csv'),
    billingHistory: loadCSV('billing_history.csv'),
    billingLineItems: loadCSV('billing_line_items.csv'),
    changeOrders: loadCSV('change_orders.csv'),
    rfis: loadCSV('rfis.csv'),
    fieldNotes: loadCSV('field_notes.csv'),
  };
  return cache;
}
```

### `lib/calculations.ts`
```typescript
import { LaborLog } from './types';

/** True labor cost for a single log entry */
export function laborCost(log: LaborLog): number {
  return (log.hours_st + log.hours_ot * 1.5) * log.hourly_rate * log.burden_multiplier;
}

/** Overtime premium only (the extra 0.5x cost beyond straight time) */
export function overtimePremium(log: LaborLog): number {
  return log.hours_ot * 0.5 * log.hourly_rate * log.burden_multiplier;
}

/** Parse Python-style list string: "['A', 'B']" → ["A", "B"] */
export function parseAffectedLines(val: string | null | undefined): string[] {
  if (!val || val === '') return [];
  try {
    return JSON.parse(val.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

/** Parse string boolean: "True" → true */
export function parseBool(val: string | boolean | null | undefined): boolean {
  if (typeof val === 'boolean') return val;
  return String(val).toLowerCase() === 'true';
}
```

---

## 6. Tool Definitions

### Overview

| # | Tool Name | Purpose | Inputs | Avg Response Size |
|---|-----------|---------|--------|-------------------|
| 1 | `scanPortfolio` | Full portfolio health + risk ranking | None | ~2KB |
| 2 | `investigateProject` | SOV-level variance analysis | projectId | ~4KB |
| 3 | `analyzeLaborDetails` | Labor breakdown by role, overtime, trends | projectId, sovLineId? | ~3KB |
| 4 | `checkBillingHealth` | Billing lag per line item | projectId | ~3KB |
| 5 | `reviewChangeOrders` | COs + RFIs + exposure | projectId | ~2KB |
| 6 | `searchFieldNotes` | Keyword search in unstructured notes | projectId, keywords[] | ~3KB |
| 7 | `sendEmailReport` | Send email via GAS | to, subject, htmlBody | ~100B |

### `lib/tools.ts` — Complete Specification

Every tool is defined as a Vercel AI SDK tool with a Zod schema and an `execute` function. Below is the exact specification for each.

---

#### Tool 1: `scanPortfolio`

**Zod Parameters:** None (empty object `z.object({})`)

**Execute Logic:**
```
For each contract in contracts:
  1. Sum estimated costs from sovBudget (labor + material + equipment + sub) → estimated_total_cost
  2. Sum actual labor cost from laborLogs using laborCost() → actual_labor_cost
  3. Sum actual material cost from materialDeliveries → actual_material_cost
  4. cost_to_date = actual_labor_cost + actual_material_cost
  5. Sum change orders by status (Approved/Pending/Rejected)
  6. adjusted_contract = original_contract_value + approved_co_total
  7. bid_margin_pct = ((original_contract_value - estimated_total_cost) / original_contract_value) * 100
  8. Get latest billing: max cumulative_billed from billingHistory
  9. billing_lag = cost_to_date - latest_cumulative_billed
  10. Sum total labor hours (st + ot) and total estimated hours
  11. labor_hours_variance_pct = ((actual_hours - estimated_hours) / estimated_hours) * 100
  12. overtime_pct = (total_ot_hours / (total_st_hours + total_ot_hours)) * 100
  13. Count open RFIs (status != 'Closed')
  14. Count RFIs with cost_impact = True that have no corresponding CO
  15. Determine risk_level:
      - CRITICAL: cost_to_date > adjusted_contract * 0.85 OR labor_hours_variance > 25% OR bid_margin eroding > 50%
      - WATCH: labor_hours_variance > 10% OR billing_lag > 5% of contract OR pending_cos > 10% of contract
      - HEALTHY: everything else
  16. top_concern: brief string describing the worst metric
```

**Return Schema:**
```json
{
  "portfolio_summary": {
    "total_projects": 3,
    "total_original_contract_value": 70998000,
    "total_adjusted_contract_value": 72500000,
    "total_estimated_cost": 60000000,
    "total_cost_to_date": 45000000,
    "total_billed": 42000000,
    "overall_bid_margin_pct": 15.2,
    "overall_current_margin_pct": 10.1,
    "total_pending_co_exposure": 890000
  },
  "projects": [
    {
      "project_id": "PRJ-2024-001",
      "project_name": "Mercy General Hospital - HVAC Modernization",
      "gc_name": "Turner Construction",
      "original_contract_value": 35194000,
      "approved_co_total": 1082800,
      "adjusted_contract_value": 36276800,
      "estimated_total_cost": 29500000,
      "cost_to_date": 27800000,
      "actual_labor_cost": 22100000,
      "actual_material_cost": 5700000,
      "bid_margin_pct": 16.2,
      "total_billed": 25500000,
      "billing_lag_dollars": 2300000,
      "pending_co_exposure": 450000,
      "total_estimated_hours": 15000,
      "total_actual_hours": 18200,
      "labor_hours_variance_pct": 21.3,
      "overtime_pct": 18.5,
      "open_rfi_count": 4,
      "rfis_with_unbilled_cost_impact": 2,
      "risk_level": "CRITICAL",
      "top_concern": "Labor hours 21% over budget with 18.5% overtime"
    }
  ]
}
```

---

#### Tool 2: `investigateProject`

**Zod Parameters:**
```typescript
z.object({
  projectId: z.string().describe('Project ID, e.g. PRJ-2024-001')
})
```

**Execute Logic:**
```
1. Get contract info
2. For each SOV line in this project:
   a. Get budget from sovBudget (estimated hours, labor cost, material cost, equipment, sub)
   b. Filter laborLogs by sov_line_id → sum hours_st, hours_ot, compute total labor cost
   c. Filter materialDeliveries by sov_line_id → sum total_cost
   d. Get latest billing from billingLineItems (max application_number) → pct_complete, total_billed
   e. Compute variances:
      - labor_hours_variance = actual_hours - estimated_hours
      - labor_cost_variance = actual_labor_cost - estimated_labor_cost
      - material_cost_variance = actual_material_cost - estimated_material_cost
      - total_variance = labor_cost_variance + material_cost_variance
   f. Compute earned value:
      - If pct_complete > 0: estimated_at_completion = actual_cost / (pct_complete / 100)
      - projected_overrun = estimated_at_completion - (estimated_labor_cost + estimated_material_cost)
   g. Status: CRITICAL if variance > 30% | OVERRUNNING if > 10% | ON_TRACK otherwise
3. Sort SOV lines by total_variance descending (worst first)
4. Compute project totals
```

**Return Schema:**
```json
{
  "project_id": "PRJ-2024-001",
  "project_name": "Mercy General Hospital - HVAC Modernization",
  "contract_value": 35194000,
  "completion_date": "2025-09-01",
  "sov_analysis": [
    {
      "sov_line_id": "PRJ-2024-001-SOV-04",
      "description": "Ductwork - Installation",
      "scheduled_value": 5200000,
      "estimated_labor_hours": 4200,
      "estimated_labor_cost": 294000,
      "estimated_material_cost": 156000,
      "actual_labor_hours": 5847,
      "actual_labor_cost": 421000,
      "actual_material_cost": 162000,
      "labor_hours_variance": 1647,
      "labor_hours_variance_pct": 39.2,
      "labor_cost_variance": 127000,
      "material_cost_variance": 6000,
      "total_variance": 133000,
      "pct_billed": 65,
      "estimated_at_completion": 897000,
      "projected_overrun": 447000,
      "status": "CRITICAL",
      "key_assumptions": "From budget: standard installation conditions"
    }
  ],
  "project_totals": {
    "total_estimated_cost": 2950000,
    "total_cost_to_date": 3380000,
    "total_variance": 430000,
    "worst_line": "PRJ-2024-001-SOV-04",
    "worst_line_description": "Ductwork - Installation",
    "lines_overrunning": 5,
    "lines_on_track": 7
  }
}
```

---

#### Tool 3: `analyzeLaborDetails`

**Zod Parameters:**
```typescript
z.object({
  projectId: z.string().describe('Project ID'),
  sovLineId: z.string().optional().describe('Optional SOV line ID to filter to a specific line item')
})
```

**Execute Logic:**
```
1. Filter laborLogs by projectId (and sovLineId if provided)
2. Group by role:
   - For each role: count unique employees, sum hours_st, sum hours_ot, sum laborCost()
3. Group by week (derive week from date):
   - For each week: sum hours_st, hours_ot, cost, count entries
4. Overtime analysis:
   - total_ot_hours, total_st_hours, ot_percentage
   - ot_premium_cost = sum of overtimePremium() across all filtered logs
   - weeks_with_heavy_ot = weeks where ot > 20% of that week's total hours
5. Top 10 highest-cost employees:
   - Group by employee_id, sum cost, sort desc, take 10
6. If sovLineId was provided, include budget comparison from sovBudget
```

**Return Schema:**
```json
{
  "project_id": "PRJ-2024-001",
  "sov_filter": "PRJ-2024-001-SOV-04 (or ALL)",
  "total_records_analyzed": 3847,
  "by_role": [
    {
      "role": "Journeyman Pipefitter",
      "headcount": 8,
      "total_st_hours": 2400,
      "total_ot_hours": 380,
      "total_cost": 298000,
      "avg_hourly_rate": 74.5,
      "avg_burden": 1.42
    }
  ],
  "weekly_trend": [
    { "week": "2024-W14", "hours_st": 320, "hours_ot": 40, "cost": 38000, "headcount": 12 },
    { "week": "2024-W15", "hours_st": 340, "hours_ot": 80, "cost": 44000, "headcount": 14 }
  ],
  "overtime_analysis": {
    "total_st_hours": 14200,
    "total_ot_hours": 3100,
    "ot_percentage": 17.9,
    "ot_premium_cost": 142000,
    "weeks_with_heavy_ot": 8,
    "peak_ot_week": "2024-W28 (420 OT hours)"
  },
  "top_cost_employees": [
    { "employee_id": "EMP-4598", "role": "Journeyman Pipefitter", "total_hours": 620, "total_cost": 68000 }
  ],
  "budget_comparison": {
    "estimated_hours": 4200,
    "actual_hours": 5847,
    "variance_hours": 1647,
    "variance_pct": 39.2
  }
}
```

---

#### Tool 4: `checkBillingHealth`

**Zod Parameters:**
```typescript
z.object({
  projectId: z.string().describe('Project ID')
})
```

**Execute Logic:**
```
1. Get all billingHistory for project, sorted by application_number
2. Get latest billing (max application_number) line items from billingLineItems
3. For each SOV line in latest billing:
   a. Get actual cost from laborLogs + materialDeliveries for that SOV line
   b. Compute cost_based_pct_complete = actual_cost / estimated_total_cost * 100
   c. billing_gap_pct = cost_based_pct_complete - pct_billed (from billing line item)
   d. billing_gap_dollars = billing_gap_pct / 100 * scheduled_value
4. Sort by billing_gap_dollars descending (most underbilled first)
5. Compute totals: total_billed, total_cost_incurred, total_retention_held
6. Calculate cash position: net_payment_received (sum of paid billing), cost_to_date, cash_gap
```

**Return Schema:**
```json
{
  "project_id": "PRJ-2024-001",
  "billing_history": [
    { "app_number": 2, "period_end": "2024-05-21", "period_total": 2944900, "cumulative": 2944900, "retention": 294490, "status": "Paid" },
    { "app_number": 3, "period_end": "2024-06-20", "period_total": 3628300, "cumulative": 6573200, "retention": 657320, "status": "Paid" }
  ],
  "line_item_billing_health": [
    {
      "sov_line_id": "PRJ-2024-001-SOV-04",
      "description": "Ductwork - Installation",
      "scheduled_value": 5200000,
      "total_billed": 2860000,
      "pct_billed": 55.0,
      "actual_cost_incurred": 3380000,
      "cost_based_pct_complete": 75.1,
      "billing_gap_pct": 20.1,
      "billing_gap_dollars": 1044000,
      "status": "UNDERBILLED"
    }
  ],
  "summary": {
    "total_contract_value": 35194000,
    "total_billed_cumulative": 25500000,
    "total_retention_held": 2550000,
    "total_cost_incurred": 27800000,
    "net_cash_received": 22950000,
    "cash_gap": 4850000,
    "total_underbilled_amount": 2300000,
    "lines_underbilled": 5,
    "lines_overbilled": 2
  }
}
```

---

#### Tool 5: `reviewChangeOrders`

**Zod Parameters:**
```typescript
z.object({
  projectId: z.string().describe('Project ID')
})
```

**Execute Logic:**
```
1. Get all change orders for project
2. For each CO:
   - Parse affected_sov_lines using parseAffectedLines()
   - If status is Pending: calculate days_pending = today - date_submitted
3. Group by status: Approved, Pending, Rejected
4. Get all RFIs for project
5. For each RFI:
   - Parse cost_impact and schedule_impact using parseBool()
   - Calculate days_to_respond = date_responded - date_submitted (if responded)
6. Find RFIs with cost_impact=true that have NO corresponding change order
   (cross-reference: find RFIs where rfi_number appears in no CO's related_rfi)
7. Flag these as "unbilled cost exposure"
```

**Return Schema:**
```json
{
  "project_id": "PRJ-2024-001",
  "change_orders": [
    {
      "co_number": "CO-012",
      "date_submitted": "2024-04-29",
      "reason_category": "Acceleration",
      "description": "Premium time to maintain schedule",
      "amount": 390900,
      "status": "Approved",
      "related_rfi": "",
      "affected_sov_lines": ["PRJ-2024-001-SOV-04", "PRJ-2024-001-SOV-14"],
      "labor_hours_impact": 9,
      "days_pending": null
    },
    {
      "co_number": "CO-015",
      "date_submitted": "2024-07-15",
      "reason_category": "Scope Addition",
      "description": "Additional duct run to mechanical room 4B",
      "amount": 34200,
      "status": "Pending",
      "related_rfi": "RFI-089",
      "affected_sov_lines": ["PRJ-2024-001-SOV-04"],
      "labor_hours_impact": 120,
      "days_pending": 45
    }
  ],
  "rfis": [
    {
      "rfi_number": "RFI-045",
      "date_submitted": "2024-04-26",
      "subject": "Thermostat location conflicts with furniture layout",
      "status": "Closed",
      "cost_impact": true,
      "schedule_impact": false,
      "has_corresponding_co": false,
      "days_to_respond": 3
    }
  ],
  "summary": {
    "approved_cos_total": 1082800,
    "approved_cos_count": 4,
    "pending_cos_total": 450000,
    "pending_cos_count": 3,
    "rejected_cos_total": 125000,
    "rejected_cos_count": 1,
    "total_rfis": 22,
    "rfis_with_cost_impact": 6,
    "rfis_with_cost_impact_no_co": 3,
    "unbilled_rfi_exposure": "3 RFIs indicate cost impact but have no corresponding change order — potential unbilled work"
  }
}
```

---

#### Tool 6: `searchFieldNotes`

**Zod Parameters:**
```typescript
z.object({
  projectId: z.string().describe('Project ID'),
  keywords: z.array(z.string()).describe('Keywords to search for in field notes. Examples: ["verbal", "scope", "additional", "GC asked", "not on drawings", "extra work", "approved", "change", "delay", "rework"]')
})
```

**Execute Logic:**
```
1. Filter fieldNotes by projectId
2. For each note, check if content (case-insensitive) contains ANY of the keywords
3. For each match, record which keyword(s) triggered the match
4. Sort by date descending (most recent first)
5. Cap at 25 results to stay within reasonable response size
6. Return matched notes with the full content
```

**Return Schema:**
```json
{
  "project_id": "PRJ-2024-001",
  "search_terms": ["verbal", "scope", "additional", "extra"],
  "total_notes_searched": 450,
  "total_matches": 12,
  "showing": 12,
  "matches": [
    {
      "note_id": "abc12345",
      "date": "2024-07-15",
      "author": "R. Williams",
      "note_type": "Daily Log",
      "content": "GC verbally approved additional duct run to mechanical room 4B. Crew started layout. No CO received yet.",
      "matched_keywords": ["verbal", "additional"]
    },
    {
      "note_id": "def67890",
      "date": "2024-06-28",
      "author": "K. Thompson",
      "note_type": "Issue Log",
      "content": "Extra insulation required on exposed piping per fire marshal. Scope not in original contract. Informed PM.",
      "matched_keywords": ["extra", "scope"]
    }
  ]
}
```

---

#### Tool 7: `sendEmailReport`

**Zod Parameters:**
```typescript
z.object({
  to: z.string().describe('Recipient email address'),
  subject: z.string().describe('Email subject line'),
  htmlBody: z.string().describe('Email body in HTML format. Use <h2>, <p>, <ul>, <li>, <strong>, <table> tags for formatting. Use inline CSS for colors: red (#dc2626) for critical, amber (#d97706) for watch, green (#16a34a) for healthy.')
})
```

**Execute Logic:**
```
1. POST to GAS_EMAIL_WEBHOOK_URL with { to, subject, body: htmlBody }
2. Return success/failure
```

**Return Schema:**
```json
{
  "success": true,
  "message": "Email sent to cfo@company.com"
}
```

---

## 7. System Prompt

### `lib/system-prompt.ts`

```typescript
export const SYSTEM_PROMPT = `You are MarginGuard AI, an autonomous financial analyst agent for a commercial HVAC contractor. You protect profit margins by proactively identifying margin erosion, investigating root causes, and recommending specific recovery actions.

## YOUR CORE BEHAVIOR

1. START BROAD, THEN GO DEEP
   When asked about portfolio health, ALWAYS call scanPortfolio first. Review every project. Then AUTOMATICALLY call investigateProject on any project with risk_level CRITICAL or WATCH. Do NOT wait to be asked — investigate on your own.

2. CHAIN YOUR INVESTIGATION
   After finding a problem area, dig deeper:
   - High labor variance → call analyzeLaborDetails for that project/SOV line
   - Billing lag detected → call checkBillingHealth
   - Change order exposure → call reviewChangeOrders
   - Any suspicion of scope creep → call searchFieldNotes with relevant keywords like ["verbal", "scope", "additional", "extra", "GC asked", "not on drawings", "change"]

3. ALWAYS QUANTIFY IN DOLLARS
   Never say "there's an issue." Say "Ductwork installation (SOV-04) is $127,000 over the labor budget — 5,847 hours logged vs. 4,200 budgeted, driven by 380 overtime hours costing $42,000 in premiums."

4. ALWAYS RECOMMEND SPECIFIC ACTIONS
   For every finding, provide:
   - The specific action to take
   - The estimated dollar recovery or savings
   - The urgency (immediate / this week / next billing cycle)
   Example: "Submit CO for mechanical room 4B addition immediately — estimated recovery: $34,200. This work was verbally approved per field note abc12345 on 2024-07-15 but has no formal change order."

5. REFERENCE YOUR EVIDENCE
   Cite specific: project IDs, SOV line IDs, field note IDs, CO numbers, RFI numbers, dates, and dollar amounts. Build your case like a forensic accountant.

## CALCULATION STANDARDS

Labor Cost = (hours_st + hours_ot × 1.5) × hourly_rate × burden_multiplier
Overtime Premium = hours_ot × 0.5 × hourly_rate × burden_multiplier
Bid Margin % = (contract_value − estimated_total_cost) / contract_value × 100
Billing Lag = cost_to_date − cumulative_billed (positive = underbilled = bad)
Adjusted Contract = original_contract_value + approved_change_orders

## INVESTIGATION TRIGGERS (ACT ON THESE AUTOMATICALLY)

- Labor hours > 115% of budget on any SOV line → dig into that line
- Overtime > 15% of total project hours → analyze overtime drivers
- Billing lag > 5% of contract value → flag cash flow risk
- Pending change orders > 21 days old → flag approval urgency
- RFIs with cost_impact but no matching change order → flag as unbilled exposure
- Field notes mentioning scope changes without matching COs → quantify exposure

## RISK CLASSIFICATION

🔴 CRITICAL: Margin eroding by >50% from bid, OR cost overrun >25%, OR multiple compounding issues
🟡 WATCH: Margin eroding 20-50% from bid, OR labor trending >15% over, OR billing lag growing
🟢 HEALTHY: Metrics within 10% of plan

## OUTPUT FORMATTING

Use markdown formatting. Structure your analysis clearly:
- Start with a portfolio summary table
- Then detail each at-risk project
- End with prioritized action items numbered by urgency
- Use bold for dollar amounts and project names

## COMMUNICATION STYLE

You are advising a CFO. Be direct, concise, and decisive. Lead with the number, then explain. Do not hedge excessively — if the data says there's a problem, say so clearly. Use "I recommend" not "you might consider."

## EMAIL REPORTS

When asked to email findings, compose a professional HTML email with:
- Clear subject line indicating urgency level
- Portfolio summary section
- Critical findings with dollar impacts
- Numbered action items
- Use the sendEmailReport tool with well-formatted HTML

## WHAT YOU NEVER DO

- Never present raw data without analysis
- Never flag a problem without quantifying its dollar impact
- Never recommend "review" or "monitor" without a specific trigger or deadline
- Never make up data — if a tool returns no results, say so
- Never stop investigating after just one tool call when the initial scan shows problems`;
```

---

## 8. API Route

### `app/api/chat/route.ts`

```typescript
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getData } from '@/lib/data-loader';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import { laborCost, overtimePremium, parseAffectedLines, parseBool } from '@/lib/calculations';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const data = getData(); // cached after first call

  const result = streamText({
    model: google('gemini-2.5-flash-preview-04-17'),
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 15,
    tools: {
      scanPortfolio: {
        description: 'Scan all projects in the portfolio and compute health metrics, risk levels, and key financial indicators for each. Call this FIRST when asked about portfolio health.',
        parameters: z.object({}),
        execute: async () => {
          // IMPLEMENT: Full logic from Tool 1 spec above
          // Use data.contracts, data.sovBudget, data.laborLogs, etc.
        },
      },
      investigateProject: {
        description: 'Deep dive into a specific project with SOV-level variance analysis comparing actual costs to budget. Shows exactly which line items are overrunning and by how much.',
        parameters: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }) => {
          // IMPLEMENT: Full logic from Tool 2 spec above
        },
      },
      analyzeLaborDetails: {
        description: 'Detailed labor analysis: breakdown by role, weekly trends, overtime analysis, and top-cost employees. Optionally filter to a specific SOV line.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
          sovLineId: z.string().optional().describe('Optional: filter to a specific SOV line item'),
        }),
        execute: async ({ projectId, sovLineId }) => {
          // IMPLEMENT: Full logic from Tool 3 spec above
        },
      },
      checkBillingHealth: {
        description: 'Analyze billing status: payment history, per-line-item billing gaps, underbilled work, retention held, and cash position.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
        }),
        execute: async ({ projectId }) => {
          // IMPLEMENT: Full logic from Tool 4 spec above
        },
      },
      reviewChangeOrders: {
        description: 'Review all change orders and RFIs for a project. Identifies pending COs, aging, and RFIs with cost impact that lack corresponding change orders (unbilled exposure).',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
        }),
        execute: async ({ projectId }) => {
          // IMPLEMENT: Full logic from Tool 5 spec above
        },
      },
      searchFieldNotes: {
        description: 'Search daily field notes for specific keywords. Use this to find evidence of verbal approvals, scope creep, extra work, delays, or rework that may represent unbilled cost exposure.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
          keywords: z.array(z.string()).describe('Keywords to search for, e.g. ["verbal", "scope", "additional", "extra", "GC asked"]'),
        }),
        execute: async ({ projectId, keywords }) => {
          // IMPLEMENT: Full logic from Tool 6 spec above
        },
      },
      sendEmailReport: {
        description: 'Send an email report with findings and recommendations. Use professional HTML formatting.',
        parameters: z.object({
          to: z.string().describe('Recipient email'),
          subject: z.string().describe('Email subject'),
          htmlBody: z.string().describe('HTML formatted email body'),
        }),
        execute: async ({ to, subject, htmlBody }) => {
          const webhookUrl = process.env.GAS_EMAIL_WEBHOOK_URL;
          if (!webhookUrl) return { success: false, message: 'Email webhook not configured' };
          try {
            const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, body: htmlBody }),
            });
            const result = await res.json();
            return { success: true, message: `Email sent to ${to}` };
          } catch (e) {
            return { success: false, message: `Failed: ${e}` };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

---

## 9. Frontend Specification

### `app/page.tsx`
```typescript
// Simple wrapper — renders <Chat /> full-page
import { Chat } from '@/components/chat';

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-background">
      <header className="border-b px-6 py-3 flex items-center gap-3">
        {/* Shield icon + title */}
        <h1 className="text-xl font-bold">MarginGuard AI</h1>
        <span className="text-sm text-muted-foreground">Autonomous Margin Protection</span>
      </header>
      <Chat />
    </main>
  );
}
```

### `components/chat.tsx` — Core Component

**Uses `useChat` from `ai/react`.** Key implementation details:

```typescript
'use client';
import { useChat } from 'ai/react';
// ... component imports

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages area — scrollable */}
      <ScrollArea className="flex-1 p-6">
        {messages.length === 0 && <WelcomeScreen />}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <ThinkingIndicator />}
      </ScrollArea>

      {/* Input bar — fixed bottom */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your portfolio..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>Send</Button>
      </form>
    </div>
  );
}
```

### `components/message-bubble.tsx`

Renders a single message. Key: must handle `toolInvocations` on assistant messages.

```typescript
// For each message:
// 1. If role === 'user': render right-aligned bubble with user text
// 2. If role === 'assistant':
//    a. Check message.toolInvocations — render ToolInvocation cards
//    b. Render message.content as markdown (use simple markdown rendering)

// For toolInvocations:
message.toolInvocations?.map((invocation) => (
  <ToolInvocation key={invocation.toolCallId} invocation={invocation} />
))
```

### `components/tool-invocation.tsx`

**This component is critical for the "transparency" requirement (30 pts).**

```typescript
// Renders a tool call status card:
// - When state === 'call': Show animated spinner + tool name + args summary
//   "🔍 Scanning portfolio..."
//   "📊 Investigating PRJ-2024-001..."
//   "👷 Analyzing labor for SOV-04..."
//   "📋 Searching field notes for: verbal, scope, additional..."
//   "📧 Sending email report..."
//
// - When state === 'result': Show collapsible card with tool name + brief result summary
//   Use Collapsible from shadcn — collapsed by default
//   Show key metrics from result (don't dump full JSON)

// Tool name to display name + icon mapping:
const TOOL_DISPLAY: Record<string, { label: string; icon: string }> = {
  scanPortfolio: { label: 'Scanning Portfolio', icon: '🔍' },
  investigateProject: { label: 'Investigating Project', icon: '📊' },
  analyzeLaborDetails: { label: 'Analyzing Labor', icon: '👷' },
  checkBillingHealth: { label: 'Checking Billing', icon: '💰' },
  reviewChangeOrders: { label: 'Reviewing Change Orders', icon: '📋' },
  searchFieldNotes: { label: 'Searching Field Notes', icon: '📝' },
  sendEmailReport: { label: 'Sending Email', icon: '📧' },
};
```

### Welcome Screen
When no messages yet, show:
- MarginGuard AI logo/name
- 3–4 suggested prompts as clickable cards:
  - "How's my portfolio doing?"
  - "Which project has the most risk?"
  - "Show me unbilled work across all projects"
  - "Find any verbal approvals without change orders"
- Clicking a card populates the input and auto-submits

---

## 10. Google Apps Script Email Setup

### GAS Code (deploy as web app)
```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    GmailApp.sendEmail(data.to, data.subject, '', {
      htmlBody: data.body,
      name: 'MarginGuard AI'
    });
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Deployment Steps
1. Go to script.google.com → New Project
2. Paste the code above
3. Deploy → New Deployment → Web App
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Copy the deployment URL → set as `GAS_EMAIL_WEBHOOK_URL` in `.env.local`
7. **Test immediately:** `curl -X POST YOUR_URL -H "Content-Type: application/json" -d '{"to":"your@email.com","subject":"Test","body":"<h1>Works</h1>"}'`

---

## 11. Deployment to Vercel

```bash
# From project root:
vercel --prod

# Or connect GitHub repo in Vercel dashboard
# Set environment variables in Vercel:
# - GOOGLE_GENERATIVE_AI_API_KEY
# - GAS_EMAIL_WEBHOOK_URL
# - ALERT_EMAIL_TO
```

Ensure `vercel.json` has the `includeFiles` for `data/**` (Section 4).

---

## 12. Demo Script (WIN SEQUENCE)

**Total demo time: 90 seconds. Practice this.**

### Beat 1: The Hook (10s)
Type: **"How's my portfolio doing?"**

Agent starts working. Audience sees:
- 🔍 Scanning Portfolio... (tool card appears)
- 📊 Investigating [worst project]... (auto-triggered)
- 👷 Analyzing Labor... (auto-triggered)
- 📝 Searching Field Notes... (auto-triggered)

**This demonstrates autonomous multi-step investigation without being asked.**

### Beat 2: The Findings (20s)
Agent streams its analysis:
- Portfolio summary with risk levels
- Deep dive on worst project with dollar-denominated findings
- Specific field notes citing verbal approvals
- Numbered action items with recovery amounts

**Let it run. Don't interrupt. The tool call cards showing in real-time IS the demo.**

### Beat 3: Follow-Up (20s)
Type: **"What about the change orders on that project?"**

Agent resolves "that project" from memory. Pulls CO data. Cross-references with field notes already analyzed. Identifies pending COs and unbilled RFI exposure.

**This demonstrates conversational memory.**

### Beat 4: The Closer (20s)
Type: **"Email me a summary of everything we've discussed."**

Agent composes HTML email, sends via GAS.

**Pull up your phone and show the actual email arriving. This is the mic drop.**

### Beat 5: Narrate (20s)
While email sends: "This agent scanned 3 projects, identified $X in margin erosion, traced it to specific SOV lines and field notes, and just emailed me the action plan — all from a single question."

---

## 13. Build Priority Order

**You have 2.5 hours. This is the exact order.**

| Phase | Time | What | Why |
|-------|------|------|-----|
| **1** | 0:00–0:30 | Project scaffold: `create-next-app`, shadcn init, install deps, copy CSV files to `data/`, create all files/folders empty, set up `.env.local`, deploy skeleton to Vercel | Get deployable immediately. Everything else is iteration. |
| **2** | 0:30–1:15 | `data-loader.ts`, `calculations.ts`, `types.ts`, then implement ALL 7 tool execute functions in `tools.ts` | Tools ARE the agent. 40% of points. Nothing else matters if tools don't work. |
| **3** | 1:15–1:45 | `system-prompt.ts`, `route.ts` (wire up streamText + tools), test with `curl` or basic input | Agent must work end-to-end. Test: "How's my portfolio doing?" must trigger scanPortfolio → investigateProject chain. |
| **4** | 1:45–2:10 | Frontend: `chat.tsx`, `message-bubble.tsx`, `tool-invocation.tsx` with useChat | The transparency UI. 30% of points. Tool call cards appearing in real-time. |
| **5** | 2:10–2:20 | GAS email deploy + test `sendEmailReport` tool | Email must actually send. Test it. |
| **6** | 2:20–2:30 | Final deploy to Vercel, run demo script twice, fix any issues | Practice the demo. If something breaks, you have 10 minutes. |

**If you're behind at 1:45:** Skip fancy tool-invocation cards. Just render `message.content` with markdown. A working agent with ugly UI beats a pretty chatbot.

**If you're ahead at 2:10:** Add the welcome screen with suggested prompts. Judges will use those exact prompts — make it easy for them.
