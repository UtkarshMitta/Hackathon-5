'use client';

import type { ToolInvocation } from 'ai';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const TOOL_CONFIG: Record<string, { label: string; icon: string; activeVerb: string }> = {
  scanPortfolio: {
    label: 'Portfolio Scan',
    icon: '🔍',
    activeVerb: 'Scanning all projects...',
  },
  investigateProject: {
    label: 'Project Investigation',
    icon: '📊',
    activeVerb: 'Investigating project...',
  },
  analyzeLaborDetails: {
    label: 'Labor Analysis',
    icon: '👷',
    activeVerb: 'Analyzing labor data...',
  },
  checkBillingHealth: {
    label: 'Billing Health Check',
    icon: '💰',
    activeVerb: 'Checking billing status...',
  },
  reviewChangeOrders: {
    label: 'Change Order Review',
    icon: '📋',
    activeVerb: 'Reviewing change orders & RFIs...',
  },
  searchFieldNotes: {
    label: 'Field Note Search',
    icon: '📝',
    activeVerb: 'Searching field notes...',
  },
  sendEmailReport: {
    label: 'Email Report',
    icon: '📧',
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
    icon: '🔧',
    activeVerb: 'Processing...',
  };

  const isInProgress = invocation.state === 'call';

  // Build context string from args
  const contextStr = getContextString(invocation.toolName, invocation.args);

  // Build result summary
  const resultSummary = invocation.state === 'result'
    ? getResultSummary(invocation.toolName, invocation.result)
    : null;

  return (
    <Card className={`border ${isInProgress ? 'border-emerald-800 bg-emerald-950/30' : 'border-zinc-800 bg-zinc-900/50'} overflow-hidden`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        {/* Icon */}
        <span className={`text-lg ${isInProgress ? 'animate-pulse-subtle' : ''}`}>
          {config.icon}
        </span>

        {/* Label and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">
              {config.label}
            </span>
            {isInProgress ? (
              <Badge variant="outline" className="text-[10px] border-emerald-700 text-emerald-400 animate-pulse-subtle">
                Running
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                Complete
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 truncate">
            {isInProgress ? contextStr || config.activeVerb : resultSummary || 'Done'}
          </p>
        </div>

        {/* Expand arrow (only if has result) */}
        {invocation.state === 'result' && (
          <ChevronDown 
            className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      {/* Expanded result details */}
      {isOpen && invocation.state === 'result' && invocation.result && (
        <div className="px-3 pb-3 pt-1">
          <pre className="text-[10px] text-zinc-500 overflow-auto max-h-40 bg-zinc-950 rounded p-2">
            {JSON.stringify(invocation.result, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

function getContextString(toolName: string, args: any): string {
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
    case 'searchFieldNotes':
      return `Keywords: ${args.keywords?.slice(0, 2).join(', ') || 'searching...'}`;
    case 'sendEmailReport':
      return `To: ${args.to || 'team'}`;
    default:
      return '';
  }
}

function getResultSummary(toolName: string, result: any): string {
  if (!result) return 'Done';
  
  try {
    switch (toolName) {
      case 'scanPortfolio':
        return `Found ${result.portfolio_summary?.total_projects || 0} projects`;
      case 'investigateProject':
        return `Analyzed ${result.sov_analysis?.length || 0} line items`;
      case 'analyzeLaborDetails':
        return `${result.total_records_analyzed || 0} labor records`;
      case 'checkBillingHealth':
        return `${result.underbilled_lines?.length || 0} underbilled items`;
      case 'reviewChangeOrders':
        return `${result.change_orders?.length || 0} change orders`;
      case 'searchFieldNotes':
        return `${result.matching_notes?.length || 0} notes found`;
      case 'sendEmailReport':
        return result.success ? 'Email sent' : 'Failed to send';
      default:
        return 'Completed';
    }
  } catch {
    return 'Completed';
  }
}
