import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Palette, Save, Clock } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useRequireRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/branding")({
  head: () => ({ meta: [{ title: "Branding & Retention — MediQueu" }] }),
  component: BrandingPage,
});

function BrandingPage() {
  const __ok = useRequireRole(["admin"]);
  const { org, refresh } = useCurrentOrg();
  const [primary, setPrimary] = useState("#3b82f6");
  const [accent, setAccent] = useState("#6366f1");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [audit, setAudit] = useState(365);
  const [appt, setAppt] = useState(1825);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!org) return;
    (async () => {
      const { data } = await (supabase as any).from("organizations").select("*").eq("id", org.id).single();
      if (!data) return;
      setPrimary(data.primary_color ?? "#3b82f6");
      setAccent(data.accent_color ?? "#6366f1");
      setEmail(data.support_email ?? "");
      setWebsite(data.website_url ?? "");
      setLogo(data.logo_url ?? "");
      setAudit(data.audit_retention_days ?? 365);
      setAppt(data.appointment_retention_days ?? 1825);
    })();
  }, [org?.id]);

  if (!__ok) return null;

  async function save() {
    if (!org) return;
    setBusy(true);
    const { error } = await (supabase as any).from("organizations").update({
      primary_color: primary, accent_color: accent, support_email: email || null,
      website_url: website || null, logo_url: logo || null,
      audit_retention_days: audit, appointment_retention_days: appt,
    }).eq("id", org.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh?.();
  }

  return (
    <DashboardShell title="Branding & retention" subtitle="Workspace identity and data lifecycle">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4" /> Brand identity</div>
          <div className="space-y-4">
            <div>
              <Label>Logo URL</Label>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary color</Label>
                <div className="flex items-center gap-2"><Input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-14 p-1" /><Input value={primary} onChange={(e) => setPrimary(e.target.value)} /></div>
              </div>
              <div>
                <Label>Accent color</Label>
                <div className="flex items-center gap-2"><Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-14 p-1" /><Input value={accent} onChange={(e) => setAccent(e.target.value)} /></div>
              </div>
            </div>
            <div>
              <Label>Support email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@clinic.com" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://clinic.com" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /> Data retention</div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm"><Label>Audit log retention</Label><span className="text-muted-foreground">{audit} days</span></div>
              <Slider value={[audit]} onValueChange={(v) => setAudit(v[0])} min={30} max={2555} step={30} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Older audit entries are auto-purged.</p>
            </div>
            <div>
              <div className="flex justify-between text-sm"><Label>Appointment history retention</Label><span className="text-muted-foreground">{appt} days</span></div>
              <Slider value={[appt]} onValueChange={(v) => setAppt(v[0])} min={365} max={3650} step={30} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">Set to meet local HIPAA/GDPR retention rules.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={busy} className="rounded-full"><Save className="mr-2 h-4 w-4" />Save changes</Button>
      </div>
    </DashboardShell>
  );
}