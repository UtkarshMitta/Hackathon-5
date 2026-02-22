import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-4xl font-bold text-foreground">Portfolio Reports</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Comprehensive analysis of your HVAC projects and margin protection
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Project Overview
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Complete visibility into all active HVAC projects and their current status
              </p>
              <Button variant="outline" className="w-full">
                View Report
              </Button>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Margin Analysis
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Track profit margins and identify opportunities for improvement
              </p>
              <Button variant="outline" className="w-full">
                View Report
              </Button>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Risk Assessment
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Identify and mitigate potential risks before they impact your bottom line
              </p>
              <Button variant="outline" className="w-full">
                View Report
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
