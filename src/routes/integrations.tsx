import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, Plug, RefreshCw, Sparkles, Webhook, ShieldCheck, Zap } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useAuth, useRequireRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrations — MediQueu" }] }),
  component: IntegrationsPage,
});

type Cal = {
  id: string; provider: "google" | "microsoft"; status: string;
  sync_direction: "one_way" | "two_way" | "disabled"; last_sync_at: string | null;
  external_account: string | null; last_error: string | null;
};

function IntegrationsPage() {
  const __ok = useRequireRole(["admin", "doctor", "receptionist"]);
  const { user } = useAuth();
  const { org } = useCurrentOrg();
  const [cals, setCals] = useState<Cal[]>([]);

  useEffect(() => {
    if (!org || !user) return;
    (async () => {
      const { data } = await (supabase as any).from("calendar_integrations")
        .select("*").eq("org_id", org.id).eq("user_id", user.id);
      setCals((data ?? []) as Cal[]);
    })();
  }, [org?.id, user?.id]);

  if (!__ok) return null;

  async function connect(provider: "google" | "microsoft") {
    if (!org || !user) return;
    const { data, error } = await (supabase as any).from("calendar_integrations").upsert({
      org_id: org.id, user_id: user.id, provider,
      status: "pending", sync_direction: "one_way",
    }, { onConflict: "user_id,provider,org_id" }).select("*").single();
    if (error) return toast.error(error.message);
    toast.message("Calendar connection prepared", {
      description: "OAuth handshake will complete in a follow-up release.",
    });
    setCals((c) => [data as Cal, ...c.filter((x) => x.id !== (data as any).id)]);
  }

  async function setDirection(id: string, dir: Cal["sync_direction"]) {
    await (supabase as any).from("calendar_integrations").update({ sync_direction: dir }).eq("id", id);
    setCals((c) => c.map((x) => (x.id === id ? { ...x, sync_direction: dir } : x)));
  }

  async function disconnect(id: string) {
    await (supabase as any).from("calendar_integrations").update({ status: "disconnected" }).eq("id", id);
    setCals((c) => c.map((x) => (x.id === id ? { ...x, status: "disconnected" } : x)));
  }

  return (
    <DashboardShell title="Integrations" subtitle="Calendars, communications, and marketplace">
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar"><CalendarCheck className="mr-2 h-4 w-4" />Calendar</TabsTrigger>
          <TabsTrigger value="marketplace"><Sparkles className="mr-2 h-4 w-4" />Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ProviderCard
              name="Google Calendar"
              description="Two-way sync for clinic appointments and personal availability."
              status={cals.find((c) => c.provider === "google")?.status}
              onConnect={() => connect("google")}
            />
            <ProviderCard
              name="Microsoft 365"
              description="Outlook calendar sync with shared mailbox support."
              status={cals.find((c) => c.provider === "microsoft")?.status}
              onConnect={() => connect("microsoft")}
            />
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border p-4 text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Sync status
            </div>
            {cals.length === 0
              ? <EmptyState icon={CalendarCheck} title="No calendars connected"
                  description="Connect Google or Microsoft above to start syncing appointments." />
              : (
                <div className="divide-y divide-border">
                  {cals.map((c) => (
                    <div key={c.id} className="grid grid-cols-[120px_1fr_220px_140px_120px] items-center gap-3 p-4 text-sm">
                      <div className="font-medium capitalize">{c.provider}</div>
                      <div className="text-muted-foreground">
                        {c.external_account ?? <span className="italic">Account not linked</span>}
                        {c.last_error && <span className="ml-2 text-destructive">{c.last_error}</span>}
                      </div>
                      <Select value={c.sync_direction} onValueChange={(v) => setDirection(c.id, v as Cal["sync_direction"])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_way">One-way (MediQueu → Calendar)</SelectItem>
                          <SelectItem value="two_way">Two-way sync</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant={c.status === "connected" ? "default" : "secondary"} className="justify-self-start capitalize">
                        {c.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => disconnect(c.id)}>Disconnect</Button>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Tile icon={Webhook} title="Zapier" desc="Trigger Zaps from appointment events." />
            <Tile icon={Zap} title="Slack" desc="Post queue alerts to a channel." />
            <Tile icon={ShieldCheck} title="Okta SSO" desc="SAML 2.0 for enterprise." />
            <Tile icon={Plug} title="Stripe Billing" desc="Sync subscriptions and invoices." />
            <Tile icon={Plug} title="HL7 / FHIR" desc="Healthcare record interoperability." />
            <Tile icon={Plug} title="Twilio Voice" desc="Outbound IVR reminders." />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function ProviderCard({ name, description, status, onConnect }: { name: string; description: string; status?: string; onConnect: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {status && <Badge variant="outline" className="capitalize">{status}</Badge>}
      </div>
      <Button onClick={onConnect} className="mt-4 rounded-full">
        {status ? "Reconnect" : "Connect"}
      </Button>
    </Card>
  );
}

function Tile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="p-5 hover:border-primary/40 transition">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{desc}</p>
      <Button variant="outline" size="sm" className="mt-4 rounded-full">Request access</Button>
    </Card>
  );
}