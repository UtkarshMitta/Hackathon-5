'use client';

import type { ToolInvocation } from 'ai';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  ChevronDown,
  Search,
  FileBarChart,
  HardHat,
  Receipt,
  ClipboardList,
  StickyNote,
  Mail,
  Wrench,
} from 'lucide-react';

const TOOL_CONFIG: Record<string, { label: string; icon: React.ElementType; activeVerb: string }> = {
  scanPortfolio: {
    label: 'Portfolio Scan',
    icon: Search,
    activeVerb: 'Scanning all projects...',
  },
  investigateProject: {
    label: 'Project Investigation',
    icon: FileBarChart,
    activeVerb: 'Investigating project...',
  },
  analyzeLaborDetails: {
    label: 'Labor Analysis',
    icon: HardHat,
    activeVerb: 'Analyzing labor data...',
  },
  checkBillingHealth: {
    label: 'Billing Health Check',
    icon: Receipt,
    activeVerb: 'Checking billing status...',
  },
  reviewChangeOrders: {
    label: 'Change Order Review',
    icon: ClipboardList,
    activeVerb: 'Reviewing change orders & RFIs...',
  },
  searchFieldNotes: {
    label: 'Field Note Search',
    icon: StickyNote,
    activeVerb: 'Searching field notes...',
  },
  sendEmailReport: {
    label: 'Email Report',
    icon: Mail,
    activeVerb: 'Sending email report...',
  },
};

interface ToolInvocationCardProps {
  invocation: ToolInvocation;
}

export function ToolInvocationCard({ invocation }: ToolInvocationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = TOOL_CONFIG[invocation.toolName] || {
    label: invocation.toolName,
    icon: Wrench,
    activeVerb: 'Processing...',
  };

  const isInProgress = invocation.state === 'call';
  const IconComp = config.icon;
  const contextStr = getContextString(invocation.toolName, invocation.args);
  const resultSummary = invocation.state === 'result'
    ? getResultSummary(invocation.toolName, invocation.result)
    : null;

  return (
    <Card className={`overflow-hidden ${isInProgress ? 'border-primary/40 bg-primary/5' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${isInProgress ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <IconComp className={`h-4 w-4 ${isInProgress ? 'animate-pulse' : ''}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">
              {config.label}
            </span>
            {isInProgress ? (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                Running
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Complete
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {isInProgress ? contextStr || config.activeVerb : resultSummary || 'Done'}
          </p>
        </div>

        {invocation.state === 'result' && (
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && invocation.state === 'result' && invocation.result && (
        <div className="px-3 pb-3 pt-1">
          <pre className="text-[10px] text-muted-foreground overflow-auto max-h-40 bg-muted rounded p-2">
            {JSON.stringify(invocation.result, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

function getContextString(toolName: string, args: Record<string, unknown> | undefined): string {
  if (!args) return '';

  switch (toolName) {
    case 'investigateProject':
      return `Project: ${args.projectId || 'Unknown'}`;
    case 'analyzeLaborDetails':
      return args.sovLineId
        ? `Line: ${args.sovLineId}`
        : `Project: ${args.projectId || 'Unknown'}`;
    case 'checkBillingHealth':
      return `Project: ${args.projectId || 'Unknown'}`;
    case 'reviewChangeOrders':
      return `Project: ${args.projectId || 'Unknown'}`;
    case 'searchFieldNotes': {
      const kw = args.keywords as string[] | undefined;
      return `Keywords: ${kw?.slice(0, 2).join(', ') || 'searching...'}`;
    }
    case 'sendEmailReport':
      return `To: ${args.to || 'team'}`;
    default:
      return '';
  }
}

function getResultSummary(toolName: string, result: Record<string, unknown> | undefined): string {
  if (!result) return 'Done';

  try {
    switch (toolName) {
      case 'scanPortfolio': {
        const summary = result.portfolio_summary as Record<string, unknown> | undefined;
        return `Found ${summary?.total_projects || 0} projects`;
      }
      case 'investigateProject': {
        const sov = result.sov_analysis as unknown[] | undefined;
        return `Analyzed ${sov?.length || 0} line items`;
      }
      case 'analyzeLaborDetails':
        return `${result.total_records_analyzed || 0} labor records`;
      case 'checkBillingHealth': {
        const lines = result.underbilled_lines as unknown[] | undefined;
        return `${lines?.length || 0} underbilled items`;
      }
      case 'reviewChangeOrders': {
        const cos = result.change_orders as unknown[] | undefined;
        return `${cos?.length || 0} change orders`;
      }
      case 'searchFieldNotes': {
        const notes = result.matching_notes as unknown[] | undefined;
        return `${notes?.length || 0} notes found`;
      }
      case 'sendEmailReport':
        return result.success ? 'Email sent' : 'Failed to send';
      default:
        return 'Completed';
    }
  } catch {
    return 'Completed';
  }
}
