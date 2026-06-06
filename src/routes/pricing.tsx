import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PLAN_PRICING, PLAN_LIMITS, fmtLimit } from "@/lib/plan-features";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MediQueu" },
      { name: "description", content: "Simple, transparent pricing for clinics of every size. Start with a 14-day free trial — no credit card required." },
      { property: "og:title", content: "MediQueu Pricing — Plans for every clinic" },
      { property: "og:description", content: "Starter, Professional, and Enterprise plans. 14-day free trial. Cancel anytime." },
    ],
  }),
  component: PricingPage,
});

const FEATURE_MATRIX: { label: string; key: keyof typeof PLAN_LIMITS["starter"] }[] = [
  { label: "Staff seats", key: "seats" },
  { label: "Appointments / month", key: "appointmentsPerMonth" },
  { label: "Locations", key: "locations" },
  { label: "SMS notifications / month", key: "smsPerMonth" },
  { label: "Advanced analytics", key: "advancedAnalytics" },
  { label: "Public API & webhooks", key: "apiAccess" },
  { label: "Custom branding", key: "customBranding" },
  { label: "Priority support", key: "prioritySupport" },
  { label: "SSO / SAML", key: "sso" },
  { label: "Dedicated CSM", key: "dedicatedCSM" },
];

function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const discount = (p: number) => yearly ? Math.round(p * 0.8) : p;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-semibold">MediQueu</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/pricing" className="font-medium">Pricing</Link>
            <Link to="/help" className="text-muted-foreground hover:text-foreground">Help</Link>
            <Link to="/contact-sales" className="text-muted-foreground hover:text-foreground">Contact sales</Link>
            <Link to="/login"><Button size="sm" className="rounded-full">Sign in</Button></Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-warning" /> 14-day free trial — no card required
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Pricing that grows with your clinic</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Built for private clinics in North America and Europe. Pay monthly or save 20% with annual billing.
        </p>
        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-sm">
          <button onClick={() => setYearly(false)} className={cn("rounded-full px-4 py-1.5", !yearly && "bg-foreground text-background")}>Monthly</button>
          <button onClick={() => setYearly(true)}  className={cn("rounded-full px-4 py-1.5", yearly && "bg-foreground text-background")}>Annual <span className="ml-1 text-[10px] opacity-70">-20%</span></button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 md:grid-cols-3">
        {(Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map((id) => {
          const p = PLAN_PRICING[id];
          const featured = id === "growth";
          return (
            <div key={id} className={cn(
              "relative rounded-2xl border bg-card p-6",
              featured ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}>
              {featured && <div className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Most popular</div>}
              <div className="text-lg font-semibold">{p.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">${discount(p.price)}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <Link to="/login"><Button className="mt-5 w-full rounded-full" variant={featured ? "default" : "outline"}>
                Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button></Link>
              <ul className="mt-5 space-y-2 text-sm">
                {FEATURE_MATRIX.slice(0,6).map(f => {
                  const v = PLAN_LIMITS[id][f.key];
                  return (
                    <li key={f.label} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span><span className="text-muted-foreground">{f.label}:</span> {typeof v === "boolean" ? (v ? "Included" : "—") : fmtLimit(v)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-6 py-3 text-sm font-semibold">Compare every feature</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 font-medium text-muted-foreground">Feature</th>
                  {(Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map(id => (
                    <th key={id} className="px-6 py-3 font-semibold">{PLAN_PRICING[id].name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map(f => (
                  <tr key={f.label} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-3 text-muted-foreground">{f.label}</td>
                    {(Object.keys(PLAN_PRICING) as Array<keyof typeof PLAN_PRICING>).map(id => {
                      const v = PLAN_LIMITS[id][f.key];
                      return <td key={id} className="px-6 py-3">{typeof v === "boolean" ? (v ? <Check className="h-4 w-4 text-success" /> : <span className="text-muted-foreground">—</span>) : fmtLimit(v)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Link to="/contact-sales"><Button variant="outline" className="rounded-full">Need a custom plan? Talk to sales</Button></Link>
        </div>
      </section>
    </div>
  );
}