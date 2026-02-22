import { getData } from '@/lib/data-loader';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import {
  laborCost,
  overtimePremium,
  parseAffectedLines,
  parseBool,
  getWeek,
  safeDivide,
  round,
} from '@/lib/calculations';

export const maxDuration = 300;

// ── Gemini REST helpers ──

const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=`;

// Convert our chat messages to Gemini format
function toGeminiContents(messages: { role: string; content: string }[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

// Tool declarations for Gemini function calling
const TOOL_DECLARATIONS = [
  {
    name: 'scanPortfolio',
    description: 'Scan ALL projects in the portfolio to compute health metrics, risk levels, margin analysis. ALWAYS call this FIRST.',
    parameters: { type: 'OBJECT' as const, properties: {}, required: [] },
  },
  {
    name: 'investigateProject',
    description: 'Deep dive into a specific project with SOV line-by-line variance analysis.',
    parameters: {
      type: 'OBJECT' as const,
      properties: { projectId: { type: 'STRING' as const, description: 'Project ID, e.g. PRJ-2024-001' } },
      required: ['projectId'],
    },
  },
  {
    name: 'analyzeLaborDetails',
    description: 'Detailed labor analysis: breakdown by role, weekly trends, overtime analysis.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        projectId: { type: 'STRING' as const, description: 'Project ID' },
        sovLineId: { type: 'STRING' as const, description: 'Optional: filter to a specific SOV line item' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'checkBillingHealth',
    description: 'Analyze billing status: payment history, per-line-item billing gaps, underbilled work.',
    parameters: {
      type: 'OBJECT' as const,
      properties: { projectId: { type: 'STRING' as const, description: 'Project ID' } },
      required: ['projectId'],
    },
  },
  {
    name: 'reviewChangeOrders',
    description: 'Review all change orders and RFIs. Identifies pending COs, aging, and RFIs with cost impact lacking COs.',
    parameters: {
      type: 'OBJECT' as const,
      properties: { projectId: { type: 'STRING' as const, description: 'Project ID' } },
      required: ['projectId'],
    },
  },
  {
    name: 'searchFieldNotes',
    description: 'Search daily field notes for keywords like verbal, scope, additional, extra.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        projectId: { type: 'STRING' as const, description: 'Project ID' },
        keywords: { type: 'ARRAY' as const, items: { type: 'STRING' as const }, description: 'Keywords to search' },
      },
      required: ['projectId', 'keywords'],
    },
  },
  {
    name: 'sendEmailReport',
    description: 'Send a formatted HTML email report with findings and recommendations.',
    parameters: {
      type: 'OBJECT' as const,
      properties: {
        to: { type: 'STRING' as const, description: 'Recipient email address' },
        subject: { type: 'STRING' as const, description: 'Email subject line' },
        htmlBody: { type: 'STRING' as const, description: 'Email body in HTML format' },
      },
      required: ['to', 'subject', 'htmlBody'],
    },
  },
];

// ── Tool execute functions ──

function executeToolCall(name: string, args: Record<string, unknown>): unknown {
  const data = getData();

  switch (name) {
    case 'scanPortfolio':
      return executeScanPortfolio(data);
    case 'investigateProject':
      return executeInvestigateProject(data, args.projectId as string);
    case 'analyzeLaborDetails':
      return executeAnalyzeLaborDetails(data, args.projectId as string, args.sovLineId as string | undefined);
    case 'checkBillingHealth':
      return executeCheckBillingHealth(data, args.projectId as string);
    case 'reviewChangeOrders':
      return executeReviewChangeOrders(data, args.projectId as string);
    case 'searchFieldNotes':
      return executeSearchFieldNotes(data, args.projectId as string, args.keywords as string[]);
    case 'sendEmailReport':
      return executeSendEmailReport(args.to as string, args.subject as string, args.htmlBody as string);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeScanPortfolio(data: any) {
  const projects = data.contracts.map((contract: { project_id: string; project_name: string; gc_name: string; substantial_completion_date: string; original_contract_value: number }) => {
    const pid = contract.project_id;
    const budgets = data.sovBudget.filter((b: { project_id: string }) => b.project_id === pid);
    const estimatedLaborCost = budgets.reduce((s: number, b: { estimated_labor_cost?: number }) => s + (b.estimated_labor_cost || 0), 0);
    const estimatedMaterialCost = budgets.reduce((s: number, b: { estimated_material_cost?: number }) => s + (b.estimated_material_cost || 0), 0);
    const estimatedEquipmentCost = budgets.reduce((s: number, b: { estimated_equipment_cost?: number }) => s + (b.estimated_equipment_cost || 0), 0);
    const estimatedSubCost = budgets.reduce((s: number, b: { estimated_sub_cost?: number }) => s + (b.estimated_sub_cost || 0), 0);
    const estimatedTotalCost = estimatedLaborCost + estimatedMaterialCost + estimatedEquipmentCost + estimatedSubCost;
    const estimatedTotalHours = budgets.reduce((s: number, b: { estimated_labor_hours?: number }) => s + (b.estimated_labor_hours || 0), 0);

    const laborLogs = data.laborLogs.filter((l: { project_id: string }) => l.project_id === pid);
    const actualLaborCost = round(laborLogs.reduce((s: number, l: Parameters<typeof laborCost>[0]) => s + laborCost(l), 0), 0);
    const actualSTHours = laborLogs.reduce((s: number, l: { hours_st?: number }) => s + (l.hours_st || 0), 0);
    const actualOTHours = laborLogs.reduce((s: number, l: { hours_ot?: number }) => s + (l.hours_ot || 0), 0);
    const totalActualHours = actualSTHours + actualOTHours;
    const otPremiumCost = round(laborLogs.reduce((s: number, l: Parameters<typeof overtimePremium>[0]) => s + overtimePremium(l), 0), 0);

    const materials = data.materialDeliveries.filter((m: { project_id: string }) => m.project_id === pid);
    const actualMaterialCost = round(materials.reduce((s: number, m: { total_cost?: number }) => s + (m.total_cost || 0), 0), 0);
    const costToDate = actualLaborCost + actualMaterialCost;

    const cos = data.changeOrders.filter((c: { project_id: string }) => c.project_id === pid);
    const approvedCOs = cos.filter((c: { status: string }) => c.status === 'Approved');
    const pendingCOs = cos.filter((c: { status: string }) => c.status === 'Pending');
    const approvedCOTotal = approvedCOs.reduce((s: number, c: { amount?: number }) => s + (c.amount || 0), 0);
    const pendingCOTotal = pendingCOs.reduce((s: number, c: { amount?: number }) => s + (c.amount || 0), 0);
    const adjustedContractValue = contract.original_contract_value + approvedCOTotal;

    const bidMarginPct = round(safeDivide(contract.original_contract_value - estimatedTotalCost, contract.original_contract_value) * 100, 1);
    const estimatedCostToComplete = Math.max(0, estimatedTotalCost - costToDate);
    const projectedTotalCost = costToDate + estimatedCostToComplete;
    const currentMarginPct = round(safeDivide(adjustedContractValue - projectedTotalCost, adjustedContractValue) * 100, 1);

    const billings = data.billingHistory.filter((b: { project_id: string }) => b.project_id === pid);
    const latestBilling = billings.length > 0 ? billings.reduce((max: { application_number: number }, b: { application_number: number }) => (b.application_number > max.application_number ? b : max)) : null;
    const cumulativeBilled = latestBilling?.cumulative_billed || 0;
    const retentionHeld = latestBilling?.retention_held || 0;
    const billingLagDollars = costToDate - cumulativeBilled;

    const laborHoursVariancePct = round(safeDivide(totalActualHours - estimatedTotalHours, estimatedTotalHours) * 100, 1);
    const overtimePct = round(safeDivide(actualOTHours, totalActualHours) * 100, 1);

    const rfis = data.rfis.filter((r: { project_id: string }) => r.project_id === pid);
    const openRFIs = rfis.filter((r: { status: string }) => r.status !== 'Closed');
    const costImpactRFIs = rfis.filter((r: { cost_impact: unknown }) => parseBool(r.cost_impact));
    const rfiNumbersWithCO = cos.map((c: { related_rfi?: string }) => c.related_rfi).filter(Boolean);
    const unbilledRFIs = costImpactRFIs.filter((r: { rfi_number: string }) => !rfiNumbersWithCO.includes(r.rfi_number));

    const marginErosionPct = bidMarginPct > 0 ? safeDivide(bidMarginPct - currentMarginPct, bidMarginPct) * 100 : 0;
    let riskLevel: string;
    const topConcerns: string[] = [];

    if (marginErosionPct > 50 || laborHoursVariancePct > 25 || currentMarginPct < 5) riskLevel = 'CRITICAL';
    else if (laborHoursVariancePct > 10 || overtimePct > 15 || billingLagDollars > adjustedContractValue * 0.05) riskLevel = 'WATCH';
    else riskLevel = 'HEALTHY';

    if (laborHoursVariancePct > 10) topConcerns.push(`Labor hours ${laborHoursVariancePct}% over budget`);
    if (overtimePct > 15) topConcerns.push(`Overtime at ${overtimePct}% (premium cost: $${otPremiumCost.toLocaleString()})`);
    if (billingLagDollars > 0) topConcerns.push(`$${billingLagDollars.toLocaleString()} in work completed but not yet billed`);
    if (pendingCOTotal > 0) topConcerns.push(`$${pendingCOTotal.toLocaleString()} in pending change orders`);
    if (unbilledRFIs.length > 0) topConcerns.push(`${unbilledRFIs.length} RFIs with cost impact but no change order`);

    return {
      project_id: pid, project_name: contract.project_name, gc_name: contract.gc_name,
      completion_date: contract.substantial_completion_date, original_contract_value: contract.original_contract_value,
      approved_co_total: approvedCOTotal, pending_co_total: pendingCOTotal, adjusted_contract_value: adjustedContractValue,
      estimated_total_cost: estimatedTotalCost, cost_to_date: costToDate, actual_labor_cost: actualLaborCost,
      actual_material_cost: actualMaterialCost, bid_margin_pct: bidMarginPct, current_margin_pct: currentMarginPct,
      margin_erosion_pct: round(marginErosionPct, 1), cumulative_billed: cumulativeBilled, retention_held: retentionHeld,
      billing_lag_dollars: billingLagDollars, estimated_total_hours: estimatedTotalHours,
      actual_total_hours: totalActualHours, labor_hours_variance_pct: laborHoursVariancePct, overtime_pct: overtimePct,
      ot_premium_cost: otPremiumCost, open_rfi_count: openRFIs.length,
      rfis_with_cost_impact_no_co: unbilledRFIs.length, risk_level: riskLevel, top_concerns: topConcerns,
    };
  });

  const riskOrder: Record<string, number> = { CRITICAL: 0, WATCH: 1, HEALTHY: 2 };
  projects.sort((a: { risk_level: string }, b: { risk_level: string }) => riskOrder[a.risk_level] - riskOrder[b.risk_level]);

  return {
    portfolio_summary: {
      total_projects: projects.length,
      critical_count: projects.filter((p: { risk_level: string }) => p.risk_level === 'CRITICAL').length,
      watch_count: projects.filter((p: { risk_level: string }) => p.risk_level === 'WATCH').length,
      healthy_count: projects.filter((p: { risk_level: string }) => p.risk_level === 'HEALTHY').length,
      total_contract_value: projects.reduce((s: number, p: { adjusted_contract_value: number }) => s + p.adjusted_contract_value, 0),
      total_cost_to_date: projects.reduce((s: number, p: { cost_to_date: number }) => s + p.cost_to_date, 0),
      total_billed: projects.reduce((s: number, p: { cumulative_billed: number }) => s + p.cumulative_billed, 0),
      total_pending_co_exposure: projects.reduce((s: number, p: { pending_co_total: number }) => s + p.pending_co_total, 0),
    },
    projects,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeInvestigateProject(data: any, projectId: string) {
  const contract = data.contracts.find((c: { project_id: string }) => c.project_id === projectId);
  if (!contract) return { error: `Project ${projectId} not found` };

  const sovLines = data.sov.filter((s: { project_id: string }) => s.project_id === projectId);
  const budgets = data.sovBudget.filter((b: { project_id: string }) => b.project_id === projectId);

  const analysis = sovLines.map((sov: { sov_line_id: string; line_number: number; description: string; scheduled_value: number; project_id: string }) => {
    const budget = budgets.find((b: { sov_line_id: string }) => b.sov_line_id === sov.sov_line_id);
    const logs = data.laborLogs.filter((l: { sov_line_id: string }) => l.sov_line_id === sov.sov_line_id);
    const mats = data.materialDeliveries.filter((m: { sov_line_id: string }) => m.sov_line_id === sov.sov_line_id);
    const billingLines = data.billingLineItems.filter((b: { sov_line_id: string }) => b.sov_line_id === sov.sov_line_id);
    const latestBilling = billingLines.length > 0 ? billingLines.reduce((max: { application_number: number }, b: { application_number: number }) => b.application_number > max.application_number ? b : max) : null;

    const actualLaborHours = logs.reduce((s: number, l: { hours_st: number; hours_ot: number }) => s + l.hours_st + l.hours_ot, 0);
    const actualLaborCostVal = round(logs.reduce((s: number, l: Parameters<typeof laborCost>[0]) => s + laborCost(l), 0), 0);
    const actualMaterialCost = round(mats.reduce((s: number, m: { total_cost?: number }) => s + (m.total_cost || 0), 0), 0);
    const actualTotalCost = actualLaborCostVal + actualMaterialCost;

    const estLaborHours = budget?.estimated_labor_hours || 0;
    const estLaborCost = budget?.estimated_labor_cost || 0;
    const estMaterialCost = budget?.estimated_material_cost || 0;
    const estTotalCost = estLaborCost + estMaterialCost + (budget?.estimated_equipment_cost || 0) + (budget?.estimated_sub_cost || 0);

    const laborHoursVariance = actualLaborHours - estLaborHours;
    const laborHoursVariancePct = round(safeDivide(laborHoursVariance, estLaborHours) * 100, 1);
    const laborCostVariance = actualLaborCostVal - estLaborCost;
    const materialCostVariance = actualMaterialCost - estMaterialCost;
    const totalVariance = laborCostVariance + materialCostVariance;
    const pctBilled = latestBilling?.pct_complete || 0;
    const totalBilled = latestBilling?.total_billed || 0;

    let estimatedAtCompletion = estTotalCost;
    if (pctBilled > 5) estimatedAtCompletion = round(safeDivide(actualTotalCost, pctBilled / 100), 0);

    let status: string;
    if (laborHoursVariancePct > 30 || totalVariance > estTotalCost * 0.3) status = 'CRITICAL';
    else if (laborHoursVariancePct > 10 || totalVariance > estTotalCost * 0.1) status = 'OVERRUNNING';
    else status = 'ON_TRACK';

    return {
      sov_line_id: sov.sov_line_id, line_number: sov.line_number, description: sov.description,
      scheduled_value: sov.scheduled_value, estimated_total_cost: estTotalCost,
      actual_total_cost: actualTotalCost, labor_hours_variance_pct: laborHoursVariancePct,
      total_variance: totalVariance, pct_billed: pctBilled, total_billed: totalBilled,
      estimated_at_completion: estimatedAtCompletion, projected_overrun: estimatedAtCompletion - estTotalCost,
      status,
    };
  });

  analysis.sort((a: { total_variance: number }, b: { total_variance: number }) => b.total_variance - a.total_variance);
  return {
    project_id: projectId, project_name: contract.project_name,
    original_contract_value: contract.original_contract_value,
    total_sov_lines: analysis.length,
    lines_overrunning: analysis.filter((a: { status: string }) => a.status !== 'ON_TRACK').length,
    lines_critical: analysis.filter((a: { status: string }) => a.status === 'CRITICAL').length,
    total_variance: round(analysis.reduce((s: number, a: { total_variance: number }) => s + a.total_variance, 0), 0),
    sov_analysis: analysis,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeAnalyzeLaborDetails(data: any, projectId: string, sovLineId?: string) {
  let logs = data.laborLogs.filter((l: { project_id: string }) => l.project_id === projectId);
  if (sovLineId) logs = logs.filter((l: { sov_line_id: string }) => l.sov_line_id === sovLineId);
  if (logs.length === 0) return { error: `No labor logs found for ${projectId}` };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logs.forEach((l: any) => {
    const existing = roleMap.get(l.role) || { headcount: new Set(), stHrs: 0, otHrs: 0, cost: 0 };
    existing.headcount.add(l.employee_id);
    existing.stHrs += l.hours_st || 0;
    existing.otHrs += l.hours_ot || 0;
    existing.cost += laborCost(l);
    roleMap.set(l.role, existing);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byRole = Array.from(roleMap.entries()).map(([role, d]: [string, any]) => ({
    role, headcount: d.headcount.size, total_st_hours: round(d.stHrs, 1),
    total_ot_hours: round(d.otHrs, 1), total_cost: round(d.cost, 0),
  })).sort((a, b) => b.total_cost - a.total_cost);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalST = logs.reduce((s: number, l: any) => s + (l.hours_st || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalOT = logs.reduce((s: number, l: any) => s + (l.hours_ot || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const otPremium = round(logs.reduce((s: number, l: any) => s + overtimePremium(l), 0), 0);

  return {
    project_id: projectId, sov_filter: sovLineId || 'ALL',
    total_records: logs.length, by_role: byRole,
    overtime_analysis: {
      total_st_hours: round(totalST, 1), total_ot_hours: round(totalOT, 1),
      ot_percentage: round(safeDivide(totalOT, totalST + totalOT) * 100, 1),
      ot_premium_cost: otPremium,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeCheckBillingHealth(data: any, projectId: string) {
  const contract = data.contracts.find((c: { project_id: string }) => c.project_id === projectId);
  if (!contract) return { error: `Project ${projectId} not found` };

  const billings = data.billingHistory.filter((b: { project_id: string }) => b.project_id === projectId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.application_number - b.application_number);

  const allBillingLines = data.billingLineItems.filter((b: { project_id: string }) => b.project_id === projectId);
  const maxApp = allBillingLines.length > 0 ? Math.max(...allBillingLines.map((b: { application_number: number }) => b.application_number)) : 0;
  const latestLines = allBillingLines.filter((b: { application_number: number }) => b.application_number === maxApp);
  const sovLines = data.sov.filter((s: { project_id: string }) => s.project_id === projectId);
  const budgetsForProject = data.sovBudget.filter((b: { project_id: string }) => b.project_id === projectId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineHealth = sovLines.map((sov: any) => {
    const billing = latestLines.find((b: { sov_line_id: string }) => b.sov_line_id === sov.sov_line_id);
    const budget = budgetsForProject.find((b: { sov_line_id: string }) => b.sov_line_id === sov.sov_line_id);
    const logs = data.laborLogs.filter((l: { sov_line_id: string }) => l.sov_line_id === sov.sov_line_id);
    const mats = data.materialDeliveries.filter((m: { sov_line_id: string }) => m.sov_line_id === sov.sov_line_id);

    const actualCost = round(
      logs.reduce((s: number, l: Parameters<typeof laborCost>[0]) => s + laborCost(l), 0) +
      mats.reduce((s: number, m: { total_cost?: number }) => s + (m.total_cost || 0), 0), 0);

    const estTotalCost = budget
      ? budget.estimated_labor_cost + budget.estimated_material_cost + budget.estimated_equipment_cost + budget.estimated_sub_cost
      : sov.scheduled_value;

    const costPct = round(safeDivide(actualCost, estTotalCost) * 100, 1);
    const pctBilled = billing?.pct_complete || 0;
    const billingGapPct = round(costPct - pctBilled, 1);
    const billingGapDollars = round((billingGapPct / 100) * sov.scheduled_value, 0);

    let status: string;
    if (billingGapPct > 10) status = 'UNDERBILLED';
    else if (billingGapPct < -10) status = 'OVERBILLED';
    else status = 'ON_TRACK';

    return {
      sov_line_id: sov.sov_line_id, description: sov.description,
      scheduled_value: sov.scheduled_value, pct_billed: pctBilled,
      cost_based_pct: costPct, billing_gap_pct: billingGapPct,
      billing_gap_dollars: billingGapDollars, status,
    };
  });

  lineHealth.sort((a: { billing_gap_dollars: number }, b: { billing_gap_dollars: number }) => b.billing_gap_dollars - a.billing_gap_dollars);
  const totalUnderbilled = lineHealth.filter((l: { status: string }) => l.status === 'UNDERBILLED')
    .reduce((s: number, l: { billing_gap_dollars: number }) => s + l.billing_gap_dollars, 0);

  return {
    project_id: projectId, billing_history: billings.length, line_item_health: lineHealth,
    summary: {
      contract_value: contract.original_contract_value,
      total_underbilled: round(totalUnderbilled, 0),
      lines_underbilled: lineHealth.filter((l: { status: string }) => l.status === 'UNDERBILLED').length,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeReviewChangeOrders(data: any, projectId: string) {
  const cos = data.changeOrders.filter((c: { project_id: string }) => c.project_id === projectId);
  const rfis = data.rfis.filter((r: { project_id: string }) => r.project_id === projectId);
  const today = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changeOrders = cos.map((co: any) => {
    const daysPending = co.status === 'Pending' ? Math.floor((today.getTime() - new Date(co.date_submitted).getTime()) / 86400000) : null;
    return {
      co_number: co.co_number, reason_category: co.reason_category, description: co.description,
      amount: co.amount, status: co.status, related_rfi: co.related_rfi || null,
      affected_sov_lines: parseAffectedLines(co.affected_sov_lines),
      days_pending: daysPending, aging_flag: daysPending && daysPending > 21 ? 'OVERDUE' : daysPending ? 'PENDING' : null,
    };
  });

  const rfiNumbersWithCO = new Set(cos.map((c: { related_rfi?: string }) => c.related_rfi).filter(Boolean));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rfiAnalysis = rfis.map((rfi: any) => {
    const hasCostImpact = parseBool(rfi.cost_impact);
    const hasCorrespondingCO = rfiNumbersWithCO.has(rfi.rfi_number);
    return {
      rfi_number: rfi.rfi_number, subject: rfi.subject, priority: rfi.priority,
      status: rfi.status, cost_impact: hasCostImpact, has_corresponding_co: hasCorrespondingCO,
      unbilled_flag: hasCostImpact && !hasCorrespondingCO ? 'UNBILLED_EXPOSURE' : null,
    };
  });

  const approved = changeOrders.filter((c: { status: string }) => c.status === 'Approved');
  const pending = changeOrders.filter((c: { status: string }) => c.status === 'Pending');
  const unbilledRFIs = rfiAnalysis.filter((r: { unbilled_flag: string | null }) => r.unbilled_flag === 'UNBILLED_EXPOSURE');

  return {
    project_id: projectId, change_orders: changeOrders, rfis: rfiAnalysis,
    summary: {
      approved_count: approved.length, approved_total: approved.reduce((s: number, c: { amount: number }) => s + c.amount, 0),
      pending_count: pending.length, pending_total: pending.reduce((s: number, c: { amount: number }) => s + c.amount, 0),
      overdue_pending: pending.filter((c: { aging_flag: string | null }) => c.aging_flag === 'OVERDUE').length,
      rfis_with_cost_impact_no_co: unbilledRFIs.length,
      unbilled_rfi_subjects: unbilledRFIs.map((r: { rfi_number: string; subject: string }) => `${r.rfi_number}: ${r.subject}`),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function executeSearchFieldNotes(data: any, projectId: string, keywords: string[]) {
  const notes = data.fieldNotes.filter((n: { project_id: string }) => n.project_id === projectId);
  const matches = notes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((note: any) => {
      const contentLower = String(note.content ?? '').toLowerCase();
      const matchedKeywords = keywords.filter((kw) => contentLower.includes(kw.toLowerCase()));
      if (matchedKeywords.length === 0) return null;
      return { note_id: note.note_id, date: note.date, author: note.author, note_type: note.note_type, content: note.content, matched_keywords: matchedKeywords };
    })
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 25);

  return { project_id: projectId, search_terms: keywords, total_notes_searched: notes.length, total_matches: matches.length, matches };
}

async function executeSendEmailReport(to: string, subject: string, htmlBody: string) {
  const webhookUrl = process.env.GAS_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, message: 'Email webhook URL not configured.' };
  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, body: htmlBody }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, message: `Email sent to ${to}` };
  } catch (error: unknown) {
    return { success: false, message: `Failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// ── Main POST handler using direct Gemini REST API ──

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it in the Vars sidebar.' }, { status: 500 });
  }

  const { messages } = await req.json();

  // Build conversation history for Gemini
  const geminiContents = toGeminiContents(messages);

  // Agentic loop: keep calling Gemini, executing tools, feeding results back
  const conversationContents = [
    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Understood. I am MarginGuard AI, ready to autonomously protect HVAC contractor margins. I will chain multiple tools and provide specific dollar amounts with every finding.' }] },
    ...geminiContents,
  ];

  const MAX_TOOL_ROUNDS = 12;
  let toolRound = 0;

  // Collect all text to stream at the end
  let finalText = '';
  let streamingStarted = false;

  // Create a readable stream to send back chunks
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (toolRound < MAX_TOOL_ROUNDS) {
          toolRound++;

          // Non-streaming call for tool rounds, streaming for final response
          const isToolRound = toolRound < MAX_TOOL_ROUNDS;
          const url = isToolRound
            ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
            : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

          const body = {
            contents: conversationContents,
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(encoder.encode(`Error from Gemini API (${res.status}): ${errText}`));
            controller.close();
            return;
          }

          // Check if this is a tool call or text response
          if (isToolRound) {
            // Non-streaming: read full JSON
            const json = await res.json();
            const candidate = json.candidates?.[0];
            if (!candidate) {
              controller.enqueue(encoder.encode('No response from Gemini.'));
              controller.close();
              return;
            }

            const parts = candidate.content?.parts || [];
            const functionCalls = parts.filter((p: { functionCall?: unknown }) => p.functionCall);

            if (functionCalls.length === 0) {
              // No tool calls - this is the final text response, stream it
              const textParts = parts.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text);
              finalText = textParts.join('');

              // Send as streaming chunks
              const words = finalText.split(' ');
              for (let i = 0; i < words.length; i++) {
                const chunk = (i === 0 ? '' : ' ') + words[i];
                controller.enqueue(encoder.encode(chunk));
                // Tiny delay for visible streaming effect
                await new Promise((r) => setTimeout(r, 15));
              }

              controller.close();
              return;
            }

            // Execute all function calls
            const functionResponseParts = [];
            for (const part of functionCalls) {
              const { name, args } = part.functionCall;

              // Stream a status message about tool execution
              if (!streamingStarted) {
                streamingStarted = true;
              }
              const toolStatus = `[Calling tool: ${name}...]\n`;
              controller.enqueue(encoder.encode(toolStatus));

              const result = name === 'sendEmailReport'
                ? await executeToolCall(name, args || {})
                : executeToolCall(name, args || {});

              functionResponseParts.push({
                functionResponse: { name, response: result },
              });
            }

            // Add model response and tool results to conversation
            conversationContents.push({ role: 'model', parts: functionCalls });
            conversationContents.push({ role: 'user', parts: functionResponseParts });
          } else {
            // Streaming response for final round
            const reader = res.body?.getReader();
            if (!reader) {
              controller.enqueue(encoder.encode('Failed to read streaming response.'));
              controller.close();
              return;
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const parts = parsed.candidates?.[0]?.content?.parts || [];

                  // Check for function calls in streaming response
                  const fCalls = parts.filter((p: { functionCall?: unknown }) => p.functionCall);
                  if (fCalls.length > 0) {
                    // Oops, got tool calls in streaming mode - handle them
                    const functionResponseParts = [];
                    for (const part of fCalls) {
                      const { name, args } = part.functionCall;
                      controller.enqueue(encoder.encode(`[Calling tool: ${name}...]\n`));
                      const result = name === 'sendEmailReport'
                        ? await executeToolCall(name, args || {})
                        : executeToolCall(name, args || {});
                      functionResponseParts.push({ functionResponse: { name, response: result } });
                    }
                    conversationContents.push({ role: 'model', parts: fCalls });
                    conversationContents.push({ role: 'user', parts: functionResponseParts });
                    // Continue the outer while loop for another round
                    break;
                  }

                  for (const part of parts) {
                    if (part.text) {
                      controller.enqueue(encoder.encode(part.text));
                    }
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }

            controller.close();
            return;
          }
        }

        // If we exhausted all tool rounds, just close
        controller.enqueue(encoder.encode('\n\n(Reached maximum tool execution rounds)'));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\nError: ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
