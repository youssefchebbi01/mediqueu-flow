import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Check, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlanBadge } from "@/components/mediqueu/plan-badge";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/billing")({ component: BillingPage });

const PLANS = [
  { id: "starter", name: "Starter", price: 49, features: ["1 location", "5 staff seats", "500 appointments / mo", "Email support"] },
  { id: "growth",  name: "Growth",  price: 149, features: ["3 locations", "15 staff seats", "5,000 appointments / mo", "SMS notifications", "Priority support"], featured: true },
  { id: "scale",   name: "Scale",   price: 399, features: ["Unlimited locations", "Unlimited seats", "Unlimited appointments", "Custom integrations", "Dedicated CSM"] },
];

function BillingPage() {
  const { org } = useCurrentOrg();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

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

  const daysLeft = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <DashboardShell title="Billing" subtitle="Plan, usage, and invoices">
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
            <Button onClick={() => toast.message("Stripe checkout coming soon")} className="rounded-full">
              <CreditCard className="mr-2 h-4 w-4" /> Manage billing
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <UsageMeter label="Appointments" value={usage?.appointments_count ?? 0} max={5000} />
            <UsageMeter label="SMS sent" value={usage?.sms_count ?? 0} max={1000} />
            <UsageMeter label="Active users" value={usage?.active_users_count ?? 0} max={org?.seat_limit ?? 5} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Subscription</div>
          <div className="mt-2 text-sm">
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary">{sub?.status ?? "—"}</Badge></div>
            <div className="mt-1"><span className="text-muted-foreground">Seats:</span> {sub?.seats ?? "—"}</div>
            <div className="mt-1"><span className="text-muted-foreground">Renews:</span> {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</div>
          </div>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Choose a plan</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map(p => (
          <Card key={p.id} className={`p-6 ${p.featured ? "border-primary ring-2 ring-primary/20" : ""}`}>
            {p.featured && <Badge className="mb-2">Most popular</Badge>}
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="mt-2"><span className="text-3xl font-bold">${p.price}</span><span className="text-sm text-muted-foreground">/mo</span></div>
            <ul className="mt-4 space-y-2">
              {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{f}</li>)}
            </ul>
            <Button className="mt-5 w-full rounded-full" variant={p.featured ? "default" : "outline"}
              onClick={() => toast.message("Stripe checkout coming soon")}>
              {org?.plan === p.id ? "Current plan" : `Upgrade to ${p.name}`}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <div className="text-sm font-medium">Invoices</div>
        <p className="mt-1 text-xs text-muted-foreground">Invoice history will appear here once Stripe is connected.</p>
      </Card>
    </DashboardShell>
  );
}

function UsageMeter({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value} / {max}</span></div>
      <Progress value={pct} className="mt-1.5 h-1.5" />
    </div>
  );
}