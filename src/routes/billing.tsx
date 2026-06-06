import { useRequireRole } from "@/hooks/use-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Check, Sparkles, ArrowUpRight, ArrowDownRight, Download, FileText, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlanBadge } from "@/components/mediqueu/plan-badge";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PLAN_PRICING, PLAN_LIMITS, fmtLimit, trialDaysLeft } from "@/lib/plan-features";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/billing")({ component: BillingPage });

const PLAN_ORDER: Array<keyof typeof PLAN_PRICING> = ["starter", "growth", "scale"];
const RANK: Record<string, number> = { trial: 0, starter: 1, growth: 2, scale: 3 };

function BillingPage() {
  const __ok = useRequireRole(["admin"]);
  if (!__ok) return null;
  const { org } = useCurrentOrg();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    if (!org) return;
    (async () => {
      const [{ data: s }, { data: u }] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("org_id", org.id).maybeSingle(),
        supabase.from("usage_counters").select("*").eq("org_id", org.id).order("period_start", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setSub(s); setUsage(u);
    })();
  }, [org?.id]);

  const daysLeft = trialDaysLeft(org?.trial_ends_at);
  const limits = org ? PLAN_LIMITS[org.plan] : null;

  async function requestChange(target: string, direction: "upgrade" | "downgrade") {
    if (!org) return;
    await logAudit(org.id, `billing.${direction}_requested`, "subscription", null, { from: org.plan, to: target });
    toast.success(`${direction === "upgrade" ? "Upgrade" : "Downgrade"} requested — Stripe checkout will open here once connected.`);
  }

  return (
    <DashboardShell title="Billing" subtitle="Plan, usage, and invoices">
      {org?.plan === "trial" && daysLeft <= 7 && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 border-warning/30 bg-warning/5 p-4">
          <Sparkles className="h-4 w-4 text-warning" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">{daysLeft === 0 ? "Trial ends today." : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left on your trial.`}</span>
            <span className="text-muted-foreground"> Pick a plan to keep SMS, multiple seats and advanced analytics.</span>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => requestChange("growth", "upgrade")}>Upgrade now</Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Current plan</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                {org && <PlanBadge plan={org.plan} />} <span className="capitalize">{org?.plan}</span>
              </div>
              {org?.plan === "trial" && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <Sparkles className="inline h-3.5 w-3.5 mr-1 text-warning" />
                  {daysLeft} day{daysLeft === 1 ? "" : "s"} left in trial
                </div>
              )}
            </div>
            <Button onClick={() => toast.message("Stripe customer portal opens here once Stripe is connected")} className="rounded-full">
              <CreditCard className="mr-2 h-4 w-4" /> Manage billing
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <UsageMeter label="Appointments" value={usage?.appointments_count ?? 0} max={limits?.appointmentsPerMonth ?? 500} />
            <UsageMeter label="SMS sent" value={usage?.sms_count ?? 0} max={limits?.smsPerMonth ?? 100} />
            <UsageMeter label="Active users" value={usage?.active_users_count ?? 0} max={limits?.seats ?? org?.seat_limit ?? 5} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Subscription</div>
          <div className="mt-2 text-sm">
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary">{sub?.status ?? "—"}</Badge></div>
            <div className="mt-1"><span className="text-muted-foreground">Seats:</span> {sub?.seats ?? "—"}</div>
            <div className="mt-1"><span className="text-muted-foreground">Renews:</span> {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</div>
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Stripe customer ID will appear here after connecting Stripe.
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Choose a plan</h2>
          <p className="text-sm text-muted-foreground">Upgrade or downgrade anytime. Annual saves 20%.</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
          <button onClick={() => setYearly(false)} className={`rounded-full px-3 py-1 ${!yearly ? "bg-foreground text-background" : ""}`}>Monthly</button>
          <button onClick={() => setYearly(true)}  className={`rounded-full px-3 py-1 ${yearly ? "bg-foreground text-background" : ""}`}>Annual</button>
        </div>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map(id => {
          const p = PLAN_PRICING[id];
          const featured = id === "growth";
          const current = org?.plan === id;
          const price = yearly ? Math.round(p.price * 0.8) : p.price;
          const dir: "upgrade" | "downgrade" = (RANK[id] > RANK[org?.plan ?? "trial"]) ? "upgrade" : "downgrade";
          return (
            <Card key={id} className={`p-6 ${featured ? "border-primary ring-2 ring-primary/20" : ""}`}>
              {featured && <Badge className="mb-2">Most popular</Badge>}
              <div className="text-lg font-semibold">{p.name}</div>
              <p className="text-xs text-muted-foreground">{p.tagline}</p>
              <div className="mt-2"><span className="text-3xl font-bold">${price}</span><span className="text-sm text-muted-foreground">/mo</span></div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{fmtLimit(PLAN_LIMITS[id].seats)} staff seats</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{fmtLimit(PLAN_LIMITS[id].appointmentsPerMonth)} appointments / mo</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />{fmtLimit(PLAN_LIMITS[id].smsPerMonth)} SMS / mo</li>
                {PLAN_LIMITS[id].apiAccess && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Public API & webhooks</li>}
                {PLAN_LIMITS[id].prioritySupport && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Priority support</li>}
                {PLAN_LIMITS[id].sso && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />SSO / SAML</li>}
                {PLAN_LIMITS[id].dedicatedCSM && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-success" />Dedicated CSM</li>}
              </ul>
              <Button className="mt-5 w-full rounded-full" variant={featured ? "default" : "outline"}
                disabled={current}
                onClick={() => requestChange(id, dir)}>
                {current ? "Current plan" : dir === "upgrade"
                  ? <><ArrowUpRight className="mr-1.5 h-4 w-4" />Upgrade to {p.name}</>
                  : <><ArrowDownRight className="mr-1.5 h-4 w-4" />Switch to {p.name}</>}
              </Button>
            </Card>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <Link to="/pricing" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          See full comparison <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Invoice history</div>
            <p className="mt-0.5 text-xs text-muted-foreground">Synced from Stripe after the first paid invoice.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" disabled><Download className="mr-1.5 h-3.5 w-3.5" />Export CSV</Button>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-2 h-6 w-6 opacity-50" />
          No invoices yet. Your first invoice will appear here when your trial converts.
        </div>
      </Card>
    </DashboardShell>
  );
}

function UsageMeter({ label, value, max }: { label: string; value: number; max: number }) {
  const safeMax = max === Number.POSITIVE_INFINITY ? value || 1 : Math.max(1, max);
  const pct = max === Number.POSITIVE_INFINITY ? 5 : Math.min(100, Math.round((value / safeMax) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value} / {max === Number.POSITIVE_INFINITY ? "∞" : max}</span>
      </div>
      <Progress value={pct} className="mt-1.5 h-1.5" />
    </div>
  );
}