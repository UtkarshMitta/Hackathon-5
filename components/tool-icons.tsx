/** Custom SVG icons for each of the 7 agent tools */

interface IconProps {
  className?: string;
}

export function ScanPortfolioIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h5" />
      <path d="M8 15h3" />
      <circle cx="17" cy="14" r="3" />
      <path d="m21 18-1.5-1.5" />
    </svg>
  );
}

export function InvestigateProjectIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      <circle cx="17" cy="8" r="2" />
      <path d="m19 10 2 2" />
    </svg>
  );
}

export function AnalyzeLaborIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M18 8h4" />
      <path d="M20 6v4" />
    </svg>
  );
}

export function CheckBillingIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
      <path d="M6 4v-1" />
      <path d="M18 4v-1" />
      <path d="M2 9h20" />
    </svg>
  );
}

export function ReviewChangeOrdersIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
      <path d="m9 11 2 2 4-4" />
    </svg>
  );
}

export function SearchFieldNotesIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <circle cx="13" cy="10" r="3" />
      <path d="m16 13-1.5-1.5" />
    </svg>
  );
}

export function SendEmailIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="M18 14l3 3" />
      <path d="M21 14l-3 3" />
    </svg>
  );
}

export function GenericToolIcon({ className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

/** Get the right icon component for a tool name */
export function getToolIcon(toolName: string) {
  const map: Record<string, React.ComponentType<IconProps>> = {
    scanPortfolio: ScanPortfolioIcon,
    investigateProject: InvestigateProjectIcon,
    analyzeLaborDetails: AnalyzeLaborIcon,
    checkBillingHealth: CheckBillingIcon,
    reviewChangeOrders: ReviewChangeOrdersIcon,
    searchFieldNotes: SearchFieldNotesIcon,
    sendEmailReport: SendEmailIcon,
  };
  return map[toolName] || GenericToolIcon;
}

/** Human-readable labels for each tool */
export function getToolLabel(toolName: string): string {
  const map: Record<string, string> = {
    scanPortfolio: 'Scanning Portfolio',
    investigateProject: 'Investigating Project',
    analyzeLaborDetails: 'Analyzing Labor Details',
    checkBillingHealth: 'Checking Billing Health',
    reviewChangeOrders: 'Reviewing Change Orders',
    searchFieldNotes: 'Searching Field Notes',
    sendEmailReport: 'Sending Email Report',
  };
  return map[toolName] || toolName;
}
