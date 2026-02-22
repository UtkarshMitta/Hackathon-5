'use client';

import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Loader2,
  ArrowRight,
  Building2,
  Users,
  FileCheck,
  FileClock,
} from 'lucide-react';

interface ProjectSummary {
  projectId: string;
  projectName: string;
  contractValue: number;
  gcName: string;
  completionDate: string;
  scheduledValue: number;
  cumulativeBilled: number;
  billedPct: number;
  totalLaborCost: number;
  totalSTHours: number;
  totalOTHours: number;
  otPct: number;
  approvedCOs: number;
  pendingCOs: number;
  approvedCOValue: number;
  pendingCOValue: number;
}

interface Totals {
  contractValue: number;
  totalBilled: number;
  totalLaborCost: number;
  totalPendingCOValue: number;
  projectCount: number;
  totalPendingCOs: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function RiskBadge({ otPct, pendingCOs }: { otPct: number; pendingCOs: number }) {
  if (otPct > 20 || pendingCOs > 3)
    return <Badge variant="destructive">High Risk</Badge>;
  if (otPct > 10 || pendingCOs > 1)
    return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Medium</Badge>;
  return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Healthy</Badge>;
}

export default function ReportsPage() {
  const [data, setData] = useState<{ projects: ProjectSummary[]; totals: Totals } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Portfolio Reports</h1>
            <p className="mt-1 text-muted-foreground">
              Real-time data from your HVAC project portfolio
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading portfolio data...</span>
            </div>
          )}

          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="font-medium text-destructive">Failed to load reports: {error}</p>
              </CardContent>
            </Card>
          )}

          {data && (
            <>
              {/* Summary Cards */}
              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Contract Value</p>
                      <p className="text-xl font-bold">{fmt(data.totals.contractValue)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Billed</p>
                      <p className="text-xl font-bold">{fmt(data.totals.totalBilled)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Labor Cost</p>
                      <p className="text-xl font-bold">{fmt(data.totals.totalLaborCost)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending CO Exposure</p>
                      <p className="text-xl font-bold">{fmt(data.totals.totalPendingCOValue)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Agent CTA */}
              <Card className="mb-10 border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
                  <div>
                    <p className="font-semibold">Want deeper analysis?</p>
                    <p className="text-sm text-muted-foreground">
                      The AI agent can investigate every project, find hidden margin risks,
                      and generate dollar-specific recovery actions.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/agent" className="flex items-center gap-2">
                      Launch Agent
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Project Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Project Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="p-3 text-left font-medium text-muted-foreground">Project</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Contract</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Billed %</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">Labor Cost</th>
                          <th className="p-3 text-right font-medium text-muted-foreground">OT %</th>
                          <th className="p-3 text-center font-medium text-muted-foreground">
                            <span className="flex items-center justify-center gap-1">
                              <FileCheck className="h-3.5 w-3.5" /> Approved
                            </span>
                          </th>
                          <th className="p-3 text-center font-medium text-muted-foreground">
                            <span className="flex items-center justify-center gap-1">
                              <FileClock className="h-3.5 w-3.5" /> Pending
                            </span>
                          </th>
                          <th className="p-3 text-center font-medium text-muted-foreground">Risk</th>
                          <th className="p-3 text-center font-medium text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.projects.map((p) => (
                          <tr key={p.projectId} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="font-medium">{p.projectName}</div>
                              <div className="text-xs text-muted-foreground">{p.gcName}</div>
                            </td>
                            <td className="p-3 text-right font-mono">{fmt(p.contractValue)}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(p.billedPct, 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-xs">{p.billedPct}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono">{fmt(p.totalLaborCost)}</td>
                            <td className="p-3 text-right">
                              <span className={p.otPct > 15 ? 'font-semibold text-destructive' : ''}>{p.otPct}%</span>
                            </td>
                            <td className="p-3 text-center font-mono">{p.approvedCOs}</td>
                            <td className="p-3 text-center">
                              {p.pendingCOs > 0 ? (
                                <span className="font-semibold text-amber-600 dark:text-amber-400">{p.pendingCOs}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <RiskBadge otPct={p.otPct} pendingCOs={p.pendingCOs} />
                            </td>
                            <td className="p-3 text-center">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/agent?prompt=${encodeURIComponent(`Investigate project ${p.projectId} "${p.projectName}" in detail. Check labor, billing, change orders, and field notes. Give me a full risk assessment with dollar amounts.`)}`}
                                  className="flex items-center gap-1 text-xs"
                                >
                                  Investigate
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
