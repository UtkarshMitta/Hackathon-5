import Link from 'next/link';
import { ArrowRight, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-4 py-1.5 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">AI-Powered Margin Protection</span>
              </div>

              <h1 className="text-balance text-5xl font-bold leading-tight text-foreground lg:text-6xl">
                Protect your margins.
                <br />
                <span className="text-primary">Grow your profits.</span>
              </h1>

              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                MarginGuard AI autonomously analyzes your HVAC portfolio, identifies margin
                risks, and delivers specific recovery actions—all in minutes.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="text-base">
                  <Link href="/agent" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/vision">Learn More</Link>
                </Button>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    Portfolio analysis in minutes, not weeks
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    Identify unbilled work and change order opportunities
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">
                    Get dollar-specific recovery recommendations
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Visualization */}
            <div className="relative">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">MarginGuard AI</h3>
                      <p className="text-xs text-muted-foreground">Analyzing portfolio...</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                    <div
                      className="h-2 w-2 animate-pulse rounded-full bg-primary"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-pulse rounded-full bg-primary"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive"></div>
                      <span className="text-sm font-medium text-foreground">High Risk</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Project #2847: $47,000 in unbilled work detected
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium text-foreground">Medium Risk</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Project #2851: Verbal approval without change order
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Recommended Action
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Submit change order documentation within 48 hours
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-lg bg-primary/10 p-4">
                  <span className="text-sm font-medium text-foreground">
                    Potential Recovery
                  </span>
                  <span className="text-2xl font-bold text-primary">$47,000</span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
