import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Building2, Users, Stethoscope, Calendar, Palette, CreditCard, ArrowRight } from "lucide-react";
import { useAuth, useRequireRole } from "@/hooks/use-auth";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/getting-started")({
  head: () => ({ meta: [{ title: "Getting started — MediQueu" }] }),
  component: GettingStarted,
});

type StepKey = "profile" | "clinic" | "invite" | "doctor" | "appointment" | "branding" | "plan";

function GettingStarted() {
  const __ok = useRequireRole(["admin"]);
  if (!__ok) return null;
  const { profile } = useAuth();
  const { org } = useCurrentOrg();
  const [done, setDone] = useState<Record<StepKey, boolean>>({
    profile: false, clinic: false, invite: false, doctor: false, appointment: false, branding: false, plan: false,
  });

  useEffect(() => {
    if (!org) return;
    (async () => {
      const [members, doctors, appts] = await Promise.all([
        supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("org_id", org.id),
        supabase.from("doctors_directory").select("id", { count: "exact", head: true }).eq("clinic_id", profile?.clinic_id ?? ""),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
      ]);
      setDone({
        profile: !!profile?.full_name,
        clinic: !!org.name,
        invite: (members.count ?? 0) > 1,
        doctor: (doctors.count ?? 0) > 0,
        appointment: (appts.count ?? 0) > 0,
        branding: !!org.logo_url,
        plan: org.plan !== "trial",
      });
    })();
  }, [org?.id, profile?.full_name]);

  const steps: { key: StepKey; icon: any; title: string; desc: string; cta: string; to: any }[] = [
    { key: "profile",     icon: Users,        title: "Complete your profile",      desc: "Add your name and role so your team can recognize you.", cta: "Open settings",  to: "/settings" },
    { key: "clinic",      icon: Building2,    title: "Set up your clinic",         desc: "Name, timezone, address and operating hours.",          cta: "Open organization", to: "/organization" },
    { key: "invite",      icon: Users,        title: "Invite your first teammate", desc: "Send an invite to your receptionist or partner.",       cta: "Invite staff",   to: "/organization" },
    { key: "doctor",      icon: Stethoscope,  title: "Add a doctor",               desc: "Doctors power scheduling, queues and analytics.",       cta: "Add doctor",     to: "/team" },
    { key: "appointment", icon: Calendar,     title: "Book your first appointment",desc: "Walk through the booking flow end-to-end.",             cta: "Book one",       to: "/book" },
    { key: "branding",    icon: Palette,      title: "Brand your patient pages",   desc: "Upload your logo and pick your accent color.",          cta: "Customize",      to: "/branding" },
    { key: "plan",        icon: CreditCard,   title: "Pick a plan",                desc: "Stay on Professional after your trial ends.",            cta: "See plans",      to: "/billing" },
  ];

  const completed = steps.filter(s => done[s.key]).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <DashboardShell title="Getting started" subtitle="A guided checklist to launch your clinic on MediQueu.">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Setup progress</div>
            <div className="mt-1 text-2xl font-semibold">{completed} of {steps.length} steps complete</div>
          </div>
          <div className="text-3xl font-bold text-primary tabular-nums">{pct}%</div>
        </div>
        <Progress value={pct} className="mt-4 h-2" />
      </Card>

      <div className="mt-6 space-y-3">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const ok = done[s.key];
          return (
            <div key={s.key} className={cn(
              "flex items-center gap-4 rounded-2xl border bg-card p-4 transition",
              ok ? "border-success/30 bg-success/[0.03]" : "border-border hover:shadow-md"
            )}>
              <div className={cn(
                "grid h-11 w-11 place-items-center rounded-xl ring-1",
                ok ? "bg-success/15 text-success ring-success/20" : "bg-primary/10 text-primary ring-primary/15"
              )}>
                {ok ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Step {idx + 1}</span>
                  {ok && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Done</span>}
                </div>
                <div className="font-semibold">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <Link to={s.to}><Button variant={ok ? "outline" : "default"} size="sm" className="rounded-full">{ok ? "Review" : s.cta}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}