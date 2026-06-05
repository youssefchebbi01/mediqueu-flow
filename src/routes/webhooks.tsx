import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Webhook, Plus, Send, Trash2, Activity } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useRequireRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { dispatchWebhook } from "@/lib/webhooks.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/webhooks")({
  head: () => ({ meta: [{ title: "Webhooks — MediQueu" }] }),
  component: WebhooksPage,
});

const EVENTS = [
  "appointment.created", "appointment.updated", "appointment.completed", "appointment.cancelled",
  "queue.updated", "doctor.availability_changed",
  "organization.member_added", "organization.member_removed",
];

type Hook = { id: string; name: string; target_url: string; events: string[]; active: boolean; created_at: string; secret: string };
type Delivery = { id: string; event: string; status_code: number | null; succeeded: boolean; created_at: string; webhook_id: string };

function WebhooksPage() {
  const __ok = useRequireRole(["admin"]);
  const { org } = useCurrentOrg();
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const dispatch = useServerFn(dispatchWebhook);

  async function refresh() {
    if (!org) return;
    const [{ data: h }, { data: d }] = await Promise.all([
      (supabase as any).from("webhooks").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
      (supabase as any).from("webhook_deliveries").select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setHooks((h ?? []) as Hook[]);
    setDeliveries((d ?? []) as Delivery[]);
  }
  useEffect(() => { refresh(); }, [org?.id]);
  if (!__ok) return null;

  async function save() {
    if (!org) return;
    try {
      new URL(url);
    } catch { return toast.error("Invalid URL"); }
    const { error } = await (supabase as any).from("webhooks").insert({
      org_id: org.id, name, target_url: url, events,
    });
    if (error) return toast.error(error.message);
    setName(""); setUrl(""); setEvents([]); setOpen(false); refresh();
  }

  async function toggle(h: Hook) {
    await (supabase as any).from("webhooks").update({ active: !h.active }).eq("id", h.id);
    refresh();
  }
  async function remove(id: string) {
    await (supabase as any).from("webhooks").delete().eq("id", id);
    refresh();
  }
  async function sendTest(id: string) {
    try { const r = await dispatch({ data: { webhook_id: id, event: "test.ping" } }); toast[r.ok ? "success" : "error"](`HTTP ${r.status}`); refresh(); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  return (
    <DashboardShell title="Webhooks" subtitle="Push organization events to your services">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="text-sm font-medium flex items-center gap-2"><Webhook className="h-4 w-4" /> Subscriptions</div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Add webhook</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production CRM" /></div>
                <div><Label>Target URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/hooks/mediqueu" /></div>
                <div>
                  <Label>Events</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {EVENTS.map((ev) => (
                      <label key={ev} className="flex items-center gap-2 text-xs">
                        <Checkbox checked={events.includes(ev)} onCheckedChange={(v) =>
                          setEvents((cur) => v ? [...new Set([...cur, ev])] : cur.filter((x) => x !== ev))
                        } />
                        <span className="font-mono">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter><Button onClick={save} disabled={!name || !url || events.length === 0} className="rounded-full">Create</Button></DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {hooks.length === 0
          ? <EmptyState icon={Webhook} title="No webhooks" description="Add a webhook to receive real-time events." />
          : (
            <div className="divide-y divide-border">
              {hooks.map((h) => (
                <div key={h.id} className="p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{h.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{h.target_url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={h.active} onCheckedChange={() => toggle(h)} />
                      <Button size="sm" variant="outline" onClick={() => sendTest(h.id)}><Send className="mr-1 h-3.5 w-3.5" />Test</Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px] font-mono">{e}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-border p-4 text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" /> Recent deliveries
        </div>
        {deliveries.length === 0
          ? <EmptyState icon={Activity} title="No deliveries yet" />
          : (
            <div className="divide-y divide-border">
              {deliveries.map((d) => (
                <div key={d.id} className="grid grid-cols-[180px_1fr_100px_120px] items-center gap-3 p-3 text-xs">
                  <div className="text-muted-foreground tabular-nums">{new Date(d.created_at).toLocaleString()}</div>
                  <div className="font-mono">{d.event}</div>
                  <Badge variant={d.succeeded ? "default" : "destructive"}>{d.status_code ?? "ERR"}</Badge>
                  <div className="text-muted-foreground">{d.succeeded ? "Delivered" : "Failed"}</div>
                </div>
              ))}
            </div>
          )}
      </Card>
    </DashboardShell>
  );
}