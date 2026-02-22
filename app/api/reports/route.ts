import { getData } from '@/lib/data-loader';
import { laborCost, round, safeDivide } from '@/lib/calculations';

// Route segment config for Vercel
export const maxDuration = 60;

export async function GET() {
  try {
    const data = getData();

    // Build per-project summaries
    const projects = data.contracts.map((c) => {
      const projectLabor = data.laborLogs.filter((l) => l.project_id === c.project_id);
      const projectCOs = data.changeOrders.filter((co) => co.project_id === c.project_id);
      const projectBilling = data.billingHistory.filter((b) => b.project_id === c.project_id);
      const projectSOV = data.sov.filter((s) => s.project_id === c.project_id);

      const totalLaborCost = projectLabor.reduce((sum, l) => sum + laborCost(l), 0);
      const totalOTHours = projectLabor.reduce((sum, l) => sum + (l.hours_ot || 0), 0);
      const totalSTHours = projectLabor.reduce((sum, l) => sum + (l.hours_st || 0), 0);

      const approvedCOs = projectCOs.filter((co) => co.status === 'Approved');
      const pendingCOs = projectCOs.filter((co) => co.status === 'Pending');
      const approvedCOValue = approvedCOs.reduce((s, co) => s + (co.amount || 0), 0);
      const pendingCOValue = pendingCOs.reduce((s, co) => s + (co.amount || 0), 0);

      const latestBill = projectBilling.sort((a, b) => b.application_number - a.application_number)[0];
      const cumulativeBilled = latestBill?.cumulative_billed || 0;

      const scheduledValue = projectSOV.reduce((s, line) => s + (line.scheduled_value || 0), 0);
      const billedPct = round(safeDivide(cumulativeBilled, scheduledValue) * 100);

      return {
        projectId: c.project_id,
        projectName: c.project_name,
        contractValue: c.original_contract_value,
        gcName: c.gc_name,
        completionDate: c.substantial_completion_date,
        scheduledValue,
        cumulativeBilled,
        billedPct,
        totalLaborCost: round(totalLaborCost),
        totalSTHours: round(totalSTHours),
        totalOTHours: round(totalOTHours),
        otPct: round(safeDivide(totalOTHours, totalSTHours + totalOTHours) * 100),
        approvedCOs: approvedCOs.length,
        pendingCOs: pendingCOs.length,
        approvedCOValue: round(approvedCOValue),
        pendingCOValue: round(pendingCOValue),
      };
    });

    const totals = {
      contractValue: projects.reduce((s, p) => s + p.contractValue, 0),
      totalBilled: round(projects.reduce((s, p) => s + p.cumulativeBilled, 0)),
      totalLaborCost: round(projects.reduce((s, p) => s + p.totalLaborCost, 0)),
      totalPendingCOValue: round(projects.reduce((s, p) => s + p.pendingCOValue, 0)),
      projectCount: projects.length,
      totalPendingCOs: projects.reduce((s, p) => s + p.pendingCOs, 0),
    };

    return Response.json({ projects, totals });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
