import { Navigation } from '@/components/navigation';
import { ArrowLeft, Shield, Zap, Target } from 'lucide-react';
import Link from 'next/link';

export default function VisionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="space-y-12">
            <div>
              <h1 className="mb-4 text-5xl font-bold text-foreground">Our Vision</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Empowering HVAC contractors with AI-driven insights to protect and grow
                their margins in an increasingly complex market.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-foreground">
                    Protection First
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe every contractor deserves to be paid fairly for their work.
                    Our AI autonomously identifies margin erosion before it impacts your
                    bottom line, giving you the tools to protect what you've earned.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-foreground">
                    Speed & Precision
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Manual portfolio review takes weeks and misses critical details. Our AI
                    analyzes every project in minutes, surfacing actionable insights with
                    dollar-specific recovery opportunities.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="mb-2 text-2xl font-semibold text-foreground">
                    Built for Contractors
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Created by people who understand the HVAC industry's unique challenges.
                    From change orders to unbilled work, we focus on the issues that matter
                    most to your profitability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
