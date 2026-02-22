import { streamText } from 'ai';
import { z } from 'zod';
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

export async function POST(req: Request) {
  const { messages } = await req.json();
  const data = getData();

  const result = streamText({
    model: 'google/gemini-2.5-flash-preview-04-17',
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 15,
    tools: {
      // ── Tool 1: scanPortfolio ──
      scanPortfolio: {
        description:
          'Scan ALL projects in the portfolio to compute health metrics, risk levels, margin analysis, and key financial indicators for each project. ALWAYS call this FIRST when asked about portfolio health.',
        parameters: z.object({}),
        execute: async () => {
          const projects = data.contracts.map((contract) => {
            const pid = contract.project_id;

            const budgets = data.sovBudget.filter((b) => b.project_id === pid);
            const estimatedLaborCost = budgets.reduce((s, b) => s + (b.estimated_labor_cost || 0), 0);
            const estimatedMaterialCost = budgets.reduce((s, b) => s + (b.estimated_material_cost || 0), 0);
            const estimatedEquipmentCost = budgets.reduce((s, b) => s + (b.estimated_equipment_cost || 0), 0);
            const estimatedSubCost = budgets.reduce((s, b) => s + (b.estimated_sub_cost || 0), 0);
            const estimatedTotalCost = estimatedLaborCost + estimatedMaterialCost + estimatedEquipmentCost + estimatedSubCost;
            const estimatedTotalHours = budgets.reduce((s, b) => s + (b.estimated_labor_hours || 0), 0);

            const laborLogs = data.laborLogs.filter((l) => l.project_id === pid);
            const actualLaborCost = round(laborLogs.reduce((s, l) => s + laborCost(l), 0), 0);
            const actualSTHours = laborLogs.reduce((s, l) => s + (l.hours_st || 0), 0);
            const actualOTHours = laborLogs.reduce((s, l) => s + (l.hours_ot || 0), 0);
            const totalActualHours = actualSTHours + actualOTHours;
            const otPremiumCost = round(laborLogs.reduce((s, l) => s + overtimePremium(l), 0), 0);

            const materials = data.materialDeliveries.filter((m) => m.project_id === pid);
            const actualMaterialCost = round(materials.reduce((s, m) => s + (m.total_cost || 0), 0), 0);

            const costToDate = actualLaborCost + actualMaterialCost;

            const cos = data.changeOrders.filter((c) => c.project_id === pid);
            const approvedCOs = cos.filter((c) => c.status === 'Approved');
            const pendingCOs = cos.filter((c) => c.status === 'Pending');
            const approvedCOTotal = approvedCOs.reduce((s, c) => s + (c.amount || 0), 0);
            const pendingCOTotal = pendingCOs.reduce((s, c) => s + (c.amount || 0), 0);
            const adjustedContractValue = contract.original_contract_value + approvedCOTotal;

            const bidMarginPct = round(safeDivide(contract.original_contract_value - estimatedTotalCost, contract.original_contract_value) * 100, 1);
            const estimatedCostToComplete = Math.max(0, estimatedTotalCost - costToDate);
            const projectedTotalCost = costToDate + estimatedCostToComplete;
            const currentMarginPct = round(safeDivide(adjustedContractValue - projectedTotalCost, adjustedContractValue) * 100, 1);

            const billings = data.billingHistory.filter((b) => b.project_id === pid);
            const latestBilling = billings.length > 0 ? billings.reduce((max, b) => (b.application_number > max.application_number ? b : max)) : null;
            const cumulativeBilled = latestBilling?.cumulative_billed || 0;
            const retentionHeld = latestBilling?.retention_held || 0;
            const billingLagDollars = costToDate - cumulativeBilled;

            const laborHoursVariancePct = round(safeDivide(totalActualHours - estimatedTotalHours, estimatedTotalHours) * 100, 1);
            const overtimePct = round(safeDivide(actualOTHours, totalActualHours) * 100, 1);

            const rfis = data.rfis.filter((r) => r.project_id === pid);
            const openRFIs = rfis.filter((r) => r.status !== 'Closed');
            const costImpactRFIs = rfis.filter((r) => parseBool(r.cost_impact));
            const rfiNumbersWithCO = cos.map((c) => c.related_rfi).filter(Boolean);
            const unbilledRFIs = costImpactRFIs.filter((r) => !rfiNumbersWithCO.includes(r.rfi_number));

            const marginErosionPct = bidMarginPct > 0 ? safeDivide(bidMarginPct - currentMarginPct, bidMarginPct) * 100 : 0;
            let riskLevel: 'CRITICAL' | 'WATCH' | 'HEALTHY';
            const topConcerns: string[] = [];

            if (marginErosionPct > 50 || laborHoursVariancePct > 25 || currentMarginPct < 5) {
              riskLevel = 'CRITICAL';
            } else if (laborHoursVariancePct > 10 || overtimePct > 15 || billingLagDollars > adjustedContractValue * 0.05) {
              riskLevel = 'WATCH';
            } else {
              riskLevel = 'HEALTHY';
            }

            if (laborHoursVariancePct > 10) topConcerns.push(`Labor hours ${laborHoursVariancePct}% over budget`);
            if (overtimePct > 15) topConcerns.push(`Overtime at ${overtimePct}% (premium cost: $${otPremiumCost.toLocaleString()})`);
            if (billingLagDollars > 0) topConcerns.push(`$${billingLagDollars.toLocaleString()} in work completed but not yet billed`);
            if (pendingCOTotal > 0) topConcerns.push(`$${pendingCOTotal.toLocaleString()} in pending change orders`);
            if (unbilledRFIs.length > 0) topConcerns.push(`${unbilledRFIs.length} RFIs with cost impact but no change order`);

            return {
              project_id: pid,
              project_name: contract.project_name,
              gc_name: contract.gc_name,
              completion_date: contract.substantial_completion_date,
              original_contract_value: contract.original_contract_value,
              approved_co_total: approvedCOTotal,
              pending_co_total: pendingCOTotal,
              adjusted_contract_value: adjustedContractValue,
              estimated_total_cost: estimatedTotalCost,
              cost_to_date: costToDate,
              actual_labor_cost: actualLaborCost,
              actual_material_cost: actualMaterialCost,
              bid_margin_pct: bidMarginPct,
              current_margin_pct: currentMarginPct,
              margin_erosion_pct: round(marginErosionPct, 1),
              cumulative_billed: cumulativeBilled,
              retention_held: retentionHeld,
              billing_lag_dollars: billingLagDollars,
              estimated_total_hours: estimatedTotalHours,
              actual_total_hours: totalActualHours,
              labor_hours_variance_pct: laborHoursVariancePct,
              overtime_pct: overtimePct,
              ot_premium_cost: otPremiumCost,
              open_rfi_count: openRFIs.length,
              rfis_with_cost_impact_no_co: unbilledRFIs.length,
              risk_level: riskLevel,
              top_concerns: topConcerns,
            };
          });

          const riskOrder: Record<string, number> = { CRITICAL: 0, WATCH: 1, HEALTHY: 2 };
          projects.sort((a, b) => riskOrder[a.risk_level] - riskOrder[b.risk_level]);

          return {
            portfolio_summary: {
              total_projects: projects.length,
              critical_count: projects.filter((p) => p.risk_level === 'CRITICAL').length,
              watch_count: projects.filter((p) => p.risk_level === 'WATCH').length,
              healthy_count: projects.filter((p) => p.risk_level === 'HEALTHY').length,
              total_contract_value: projects.reduce((s, p) => s + p.adjusted_contract_value, 0),
              total_cost_to_date: projects.reduce((s, p) => s + p.cost_to_date, 0),
              total_billed: projects.reduce((s, p) => s + p.cumulative_billed, 0),
              total_pending_co_exposure: projects.reduce((s, p) => s + p.pending_co_total, 0),
            },
            projects,
          };
        },
      },

      // ── Tool 2: investigateProject ──
      investigateProject: {
        description:
          'Deep dive into a specific project with SOV line-by-line variance analysis comparing actual labor and material costs to budget. Shows exactly which line items are overrunning.',
        parameters: z.object({
          projectId: z.string().describe('Project ID, e.g. PRJ-2024-001'),
        }),
        execute: async ({ projectId }: { projectId: string }) => {
          const contract = data.contracts.find((c) => c.project_id === projectId);
          if (!contract) return { error: `Project ${projectId} not found` };

          const sovLines = data.sov.filter((s) => s.project_id === projectId);
          const budgets = data.sovBudget.filter((b) => b.project_id === projectId);

          const analysis = sovLines.map((sov) => {
            const budget = budgets.find((b) => b.sov_line_id === sov.sov_line_id);
            const logs = data.laborLogs.filter((l) => l.sov_line_id === sov.sov_line_id);
            const mats = data.materialDeliveries.filter((m) => m.sov_line_id === sov.sov_line_id);
            const billingLines = data.billingLineItems.filter((b) => b.sov_line_id === sov.sov_line_id);
            const latestBilling = billingLines.length > 0 ? billingLines.reduce((max, b) => (b.application_number > max.application_number ? b : max)) : null;

            const actualLaborHours = logs.reduce((s, l) => s + l.hours_st + l.hours_ot, 0);
            const actualLaborCostVal = round(logs.reduce((s, l) => s + laborCost(l), 0), 0);
            const actualMaterialCost = round(mats.reduce((s, m) => s + (m.total_cost || 0), 0), 0);
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
            if (pctBilled > 5) {
              estimatedAtCompletion = round(safeDivide(actualTotalCost, pctBilled / 100), 0);
            }
            const projectedOverrun = estimatedAtCompletion - estTotalCost;

            let status: 'CRITICAL' | 'OVERRUNNING' | 'ON_TRACK';
            if (laborHoursVariancePct > 30 || totalVariance > estTotalCost * 0.3) status = 'CRITICAL';
            else if (laborHoursVariancePct > 10 || totalVariance > estTotalCost * 0.1) status = 'OVERRUNNING';
            else status = 'ON_TRACK';

            return {
              sov_line_id: sov.sov_line_id,
              line_number: sov.line_number,
              description: sov.description,
              scheduled_value: sov.scheduled_value,
              estimated_labor_hours: estLaborHours,
              estimated_labor_cost: estLaborCost,
              estimated_material_cost: estMaterialCost,
              estimated_total_cost: estTotalCost,
              actual_labor_hours: round(actualLaborHours, 1),
              actual_labor_cost: actualLaborCostVal,
              actual_material_cost: actualMaterialCost,
              actual_total_cost: actualTotalCost,
              labor_hours_variance: round(laborHoursVariance, 1),
              labor_hours_variance_pct: laborHoursVariancePct,
              labor_cost_variance: laborCostVariance,
              material_cost_variance: materialCostVariance,
              total_variance: totalVariance,
              pct_billed: pctBilled,
              total_billed: totalBilled,
              estimated_at_completion: estimatedAtCompletion,
              projected_overrun: projectedOverrun,
              key_assumptions: budget?.key_assumptions || '',
              status,
            };
          });

          analysis.sort((a, b) => b.total_variance - a.total_variance);
          const totalVariance = analysis.reduce((s, a) => s + a.total_variance, 0);

          return {
            project_id: projectId,
            project_name: contract.project_name,
            original_contract_value: contract.original_contract_value,
            completion_date: contract.substantial_completion_date,
            total_sov_lines: analysis.length,
            lines_overrunning: analysis.filter((a) => a.status !== 'ON_TRACK').length,
            lines_critical: analysis.filter((a) => a.status === 'CRITICAL').length,
            total_variance: round(totalVariance, 0),
            sov_analysis: analysis,
          };
        },
      },

      // ── Tool 3: analyzeLaborDetails ──
      analyzeLaborDetails: {
        description:
          'Detailed labor analysis: breakdown by role, weekly trends, overtime analysis with premium costs, and top-cost employees. Use sovLineId to drill into a specific overrunning line item.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
          sovLineId: z.string().optional().describe('Optional: filter to a specific SOV line item'),
        }),
        execute: async ({ projectId, sovLineId }: { projectId: string; sovLineId?: string }) => {
          let logs = data.laborLogs.filter((l) => l.project_id === projectId);
          if (sovLineId) logs = logs.filter((l) => l.sov_line_id === sovLineId);
          if (logs.length === 0) return { error: `No labor logs found for ${projectId}${sovLineId ? ` / ${sovLineId}` : ''}` };

          const roleMap = new Map<string, { headcount: Set<string>; stHrs: number; otHrs: number; cost: number; rates: number[]; burdens: number[] }>();
          logs.forEach((l) => {
            const existing = roleMap.get(l.role) || { headcount: new Set<string>(), stHrs: 0, otHrs: 0, cost: 0, rates: [], burdens: [] };
            existing.headcount.add(l.employee_id);
            existing.stHrs += l.hours_st || 0;
            existing.otHrs += l.hours_ot || 0;
            existing.cost += laborCost(l);
            existing.rates.push(l.hourly_rate);
            existing.burdens.push(l.burden_multiplier);
            roleMap.set(l.role, existing);
          });

          const byRole = Array.from(roleMap.entries())
            .map(([role, d]) => ({
              role,
              headcount: d.headcount.size,
              total_st_hours: round(d.stHrs, 1),
              total_ot_hours: round(d.otHrs, 1),
              total_cost: round(d.cost, 0),
              avg_hourly_rate: round(d.rates.reduce((a, b) => a + b, 0) / d.rates.length, 2),
              avg_burden: round(d.burdens.reduce((a, b) => a + b, 0) / d.burdens.length, 2),
            }))
            .sort((a, b) => b.total_cost - a.total_cost);

          const weekMap = new Map<string, { stHrs: number; otHrs: number; cost: number; employees: Set<string> }>();
          logs.forEach((l) => {
            const week = getWeek(l.date);
            const existing = weekMap.get(week) || { stHrs: 0, otHrs: 0, cost: 0, employees: new Set<string>() };
            existing.stHrs += l.hours_st || 0;
            existing.otHrs += l.hours_ot || 0;
            existing.cost += laborCost(l);
            existing.employees.add(l.employee_id);
            weekMap.set(week, existing);
          });

          const weeklyTrend = Array.from(weekMap.entries())
            .map(([week, d]) => ({
              week,
              hours_st: round(d.stHrs, 1),
              hours_ot: round(d.otHrs, 1),
              total_hours: round(d.stHrs + d.otHrs, 1),
              cost: round(d.cost, 0),
              headcount: d.employees.size,
              ot_pct: round(safeDivide(d.otHrs, d.stHrs + d.otHrs) * 100, 1),
            }))
            .sort((a, b) => a.week.localeCompare(b.week));

          const totalST = logs.reduce((s, l) => s + (l.hours_st || 0), 0);
          const totalOT = logs.reduce((s, l) => s + (l.hours_ot || 0), 0);
          const otPremium = round(logs.reduce((s, l) => s + overtimePremium(l), 0), 0);
          const heavyOTWeeks = weeklyTrend.filter((w) => w.ot_pct > 20);
          const peakOTWeek = weeklyTrend.length > 0 ? weeklyTrend.reduce((max, w) => (w.hours_ot > max.hours_ot ? w : max)) : null;

          const empMap = new Map<string, { role: string; hours: number; cost: number }>();
          logs.forEach((l) => {
            const existing = empMap.get(l.employee_id) || { role: l.role, hours: 0, cost: 0 };
            existing.hours += l.hours_st + l.hours_ot;
            existing.cost += laborCost(l);
            empMap.set(l.employee_id, existing);
          });

          const topEmployees = Array.from(empMap.entries())
            .map(([id, d]) => ({ employee_id: id, role: d.role, total_hours: round(d.hours, 1), total_cost: round(d.cost, 0) }))
            .sort((a, b) => b.total_cost - a.total_cost)
            .slice(0, 10);

          let budgetComparison = null;
          if (sovLineId) {
            const budget = data.sovBudget.find((b) => b.sov_line_id === sovLineId);
            if (budget) {
              budgetComparison = {
                estimated_hours: budget.estimated_labor_hours,
                estimated_cost: budget.estimated_labor_cost,
                actual_hours: round(totalST + totalOT, 1),
                actual_cost: round(logs.reduce((s, l) => s + laborCost(l), 0), 0),
                hours_variance: round(totalST + totalOT - budget.estimated_labor_hours, 1),
                hours_variance_pct: round(safeDivide(totalST + totalOT - budget.estimated_labor_hours, budget.estimated_labor_hours) * 100, 1),
                cost_variance: round(logs.reduce((s, l) => s + laborCost(l), 0) - budget.estimated_labor_cost, 0),
                productivity_factor: budget.productivity_factor,
                key_assumptions: budget.key_assumptions,
              };
            }
          }

          return {
            project_id: projectId,
            sov_filter: sovLineId || 'ALL',
            total_records_analyzed: logs.length,
            by_role: byRole,
            weekly_trend: weeklyTrend,
            overtime_analysis: {
              total_st_hours: round(totalST, 1),
              total_ot_hours: round(totalOT, 1),
              ot_percentage: round(safeDivide(totalOT, totalST + totalOT) * 100, 1),
              ot_premium_cost: otPremium,
              weeks_with_heavy_ot: heavyOTWeeks.length,
              peak_ot_week: peakOTWeek ? `${peakOTWeek.week} (${peakOTWeek.hours_ot} OT hours)` : 'N/A',
            },
            top_cost_employees: topEmployees,
            budget_comparison: budgetComparison,
          };
        },
      },

      // ── Tool 4: checkBillingHealth ──
      checkBillingHealth: {
        description:
          'Analyze billing status: payment history, per-line-item billing gaps, underbilled work, retention held, and cash position. Call this when billing_lag_dollars is significant.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
        }),
        execute: async ({ projectId }: { projectId: string }) => {
          const contract = data.contracts.find((c) => c.project_id === projectId);
          if (!contract) return { error: `Project ${projectId} not found` };

          const billings = data.billingHistory
            .filter((b) => b.project_id === projectId)
            .sort((a, b) => a.application_number - b.application_number)
            .map((b) => ({
              app_number: b.application_number,
              period_end: b.period_end,
              period_total: b.period_total,
              cumulative: b.cumulative_billed,
              retention: b.retention_held,
              net_payment: b.net_payment_due,
              status: b.status,
            }));

          const allBillingLines = data.billingLineItems.filter((b) => b.project_id === projectId);
          const maxApp = allBillingLines.length > 0 ? Math.max(...allBillingLines.map((b) => b.application_number)) : 0;
          const latestLines = allBillingLines.filter((b) => b.application_number === maxApp);

          const sovLines = data.sov.filter((s) => s.project_id === projectId);
          const budgetsForProject = data.sovBudget.filter((b) => b.project_id === projectId);

          const lineHealth = sovLines.map((sov) => {
            const billing = latestLines.find((b) => b.sov_line_id === sov.sov_line_id);
            const budget = budgetsForProject.find((b) => b.sov_line_id === sov.sov_line_id);
            const logs = data.laborLogs.filter((l) => l.sov_line_id === sov.sov_line_id);
            const mats = data.materialDeliveries.filter((m) => m.sov_line_id === sov.sov_line_id);

            const actualLaborCostVal = logs.reduce((s, l) => s + laborCost(l), 0);
            const actualMaterialCost = mats.reduce((s, m) => s + (m.total_cost || 0), 0);
            const actualCostIncurred = round(actualLaborCostVal + actualMaterialCost, 0);

            const estTotalCost = budget
              ? budget.estimated_labor_cost + budget.estimated_material_cost + budget.estimated_equipment_cost + budget.estimated_sub_cost
              : sov.scheduled_value;

            const costBasedPctComplete = round(safeDivide(actualCostIncurred, estTotalCost) * 100, 1);
            const pctBilled = billing?.pct_complete || 0;
            const totalBilled = billing?.total_billed || 0;
            const billingGapPct = round(costBasedPctComplete - pctBilled, 1);
            const billingGapDollars = round((billingGapPct / 100) * sov.scheduled_value, 0);

            let status: 'UNDERBILLED' | 'ON_TRACK' | 'OVERBILLED';
            if (billingGapPct > 10) status = 'UNDERBILLED';
            else if (billingGapPct < -10) status = 'OVERBILLED';
            else status = 'ON_TRACK';

            return {
              sov_line_id: sov.sov_line_id,
              description: sov.description,
              scheduled_value: sov.scheduled_value,
              total_billed: totalBilled,
              pct_billed: pctBilled,
              actual_cost_incurred: actualCostIncurred,
              cost_based_pct_complete: costBasedPctComplete,
              billing_gap_pct: billingGapPct,
              billing_gap_dollars: billingGapDollars,
              status,
            };
          });

          lineHealth.sort((a, b) => b.billing_gap_dollars - a.billing_gap_dollars);

          const totalBilled = billings.length > 0 ? billings[billings.length - 1].cumulative : 0;
          const totalRetention = billings.length > 0 ? billings[billings.length - 1].retention : 0;
          const totalCostIncurred = lineHealth.reduce((s, l) => s + l.actual_cost_incurred, 0);
          const paidBillings = data.billingHistory.filter((b) => b.project_id === projectId && b.status === 'Paid');
          const netCashReceived = paidBillings.reduce((s, b) => s + b.net_payment_due, 0);
          const totalUnderbilled = lineHealth.filter((l) => l.status === 'UNDERBILLED').reduce((s, l) => s + l.billing_gap_dollars, 0);

          return {
            project_id: projectId,
            billing_history: billings,
            latest_app_number: maxApp,
            line_item_billing_health: lineHealth,
            summary: {
              contract_value: contract.original_contract_value,
              total_billed_cumulative: totalBilled,
              total_retention_held: totalRetention,
              total_cost_incurred: totalCostIncurred,
              net_cash_received: round(netCashReceived, 0),
              cash_gap: round(totalCostIncurred - netCashReceived, 0),
              total_underbilled_amount: round(totalUnderbilled, 0),
              lines_underbilled: lineHealth.filter((l) => l.status === 'UNDERBILLED').length,
              lines_overbilled: lineHealth.filter((l) => l.status === 'OVERBILLED').length,
            },
          };
        },
      },

      // ── Tool 5: reviewChangeOrders ──
      reviewChangeOrders: {
        description:
          'Review all change orders and RFIs for a project. Identifies pending COs, aging, and RFIs with cost impact that lack corresponding change orders (unbilled exposure).',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
        }),
        execute: async ({ projectId }: { projectId: string }) => {
          const cos = data.changeOrders.filter((c) => c.project_id === projectId);
          const rfis = data.rfis.filter((r) => r.project_id === projectId);
          const today = new Date();

          const changeOrders = cos.map((co) => {
            const daysPending =
              co.status === 'Pending' ? Math.floor((today.getTime() - new Date(co.date_submitted).getTime()) / 86400000) : null;

            return {
              co_number: co.co_number,
              date_submitted: co.date_submitted,
              reason_category: co.reason_category,
              description: co.description,
              amount: co.amount,
              status: co.status,
              related_rfi: co.related_rfi || null,
              affected_sov_lines: parseAffectedLines(co.affected_sov_lines),
              labor_hours_impact: co.labor_hours_impact,
              schedule_impact_days: co.schedule_impact_days,
              submitted_by: co.submitted_by,
              days_pending: daysPending,
              aging_flag: daysPending && daysPending > 21 ? 'OVERDUE' : daysPending ? 'PENDING' : null,
            };
          });

          const rfiNumbersWithCO = new Set(cos.map((c) => c.related_rfi).filter(Boolean));
          const rfiAnalysis = rfis.map((rfi) => {
            const hasCostImpact = parseBool(rfi.cost_impact);
            const hasScheduleImpact = parseBool(rfi.schedule_impact);
            const hasCorrespondingCO = rfiNumbersWithCO.has(rfi.rfi_number);
            const daysToRespond = rfi.date_responded
              ? Math.floor((new Date(rfi.date_responded).getTime() - new Date(rfi.date_submitted).getTime()) / 86400000)
              : null;

            return {
              rfi_number: rfi.rfi_number,
              date_submitted: rfi.date_submitted,
              subject: rfi.subject,
              priority: rfi.priority,
              status: rfi.status,
              cost_impact: hasCostImpact,
              schedule_impact: hasScheduleImpact,
              has_corresponding_co: hasCorrespondingCO,
              days_to_respond: daysToRespond,
              unbilled_flag: hasCostImpact && !hasCorrespondingCO ? 'UNBILLED_EXPOSURE' : null,
            };
          });

          const approved = changeOrders.filter((c) => c.status === 'Approved');
          const pending = changeOrders.filter((c) => c.status === 'Pending');
          const rejected = changeOrders.filter((c) => c.status === 'Rejected');
          const unbilledRFIs = rfiAnalysis.filter((r) => r.unbilled_flag === 'UNBILLED_EXPOSURE');

          return {
            project_id: projectId,
            change_orders: changeOrders,
            rfis: rfiAnalysis,
            summary: {
              approved_cos_count: approved.length,
              approved_cos_total: approved.reduce((s, c) => s + c.amount, 0),
              pending_cos_count: pending.length,
              pending_cos_total: pending.reduce((s, c) => s + c.amount, 0),
              rejected_cos_count: rejected.length,
              rejected_cos_total: rejected.reduce((s, c) => s + c.amount, 0),
              overdue_pending_cos: pending.filter((c) => c.aging_flag === 'OVERDUE').length,
              total_rfis: rfis.length,
              rfis_with_cost_impact: rfiAnalysis.filter((r) => r.cost_impact).length,
              rfis_with_cost_impact_no_co: unbilledRFIs.length,
              unbilled_rfi_subjects: unbilledRFIs.map((r) => `${r.rfi_number}: ${r.subject}`),
            },
          };
        },
      },

      // ── Tool 6: searchFieldNotes ──
      searchFieldNotes: {
        description:
          'Search daily field notes for specific keywords. Use this to find evidence of verbal approvals, scope creep, extra work, delays, or rework. ALWAYS search CRITICAL projects.',
        parameters: z.object({
          projectId: z.string().describe('Project ID'),
          keywords: z.array(z.string()).describe('Keywords to search for, e.g. ["verbal", "scope", "additional", "extra", "GC asked"]'),
        }),
        execute: async ({ projectId, keywords }: { projectId: string; keywords: string[] }) => {
          const notes = data.fieldNotes.filter((n) => n.project_id === projectId);

          const matches = notes
            .map((note) => {
              const contentLower = (note.content || '').toLowerCase();
              const matchedKeywords = keywords.filter((kw) => contentLower.includes(kw.toLowerCase()));
              if (matchedKeywords.length === 0) return null;
              return {
                note_id: note.note_id,
                date: note.date,
                author: note.author,
                note_type: note.note_type,
                content: note.content,
                matched_keywords: matchedKeywords,
              };
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime())
            .slice(0, 25);

          return {
            project_id: projectId,
            search_terms: keywords,
            total_notes_searched: notes.length,
            total_matches: matches.length,
            matches,
          };
        },
      },

      // ── Tool 7: sendEmailReport ──
      sendEmailReport: {
        description: 'Send a formatted HTML email report with findings and recommendations. Use professional HTML formatting with risk color coding.',
        parameters: z.object({
          to: z.string().describe('Recipient email address'),
          subject: z.string().describe('Email subject line'),
          htmlBody: z.string().describe('Email body in HTML format'),
        }),
        execute: async ({ to, subject, htmlBody }: { to: string; subject: string; htmlBody: string }) => {
          const webhookUrl = process.env.GAS_EMAIL_WEBHOOK_URL;
          if (!webhookUrl) return { success: false, message: 'Email webhook URL not configured. Set GAS_EMAIL_WEBHOOK_URL environment variable.' };

          try {
            const res = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, subject, body: htmlBody }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return { success: true, message: `Email sent successfully to ${to}` };
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, message: `Failed to send email: ${message}` };
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
