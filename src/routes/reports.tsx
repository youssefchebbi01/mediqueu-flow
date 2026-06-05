import { useRequireRole } from "@/hooks/use-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { Calendar, Download, FileText, Mail, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — MediQueu" }] }),
  component: Reports,
});

type Schedule = {
  id: string;
  name: string;
  cadence: "daily" | "weekly" | "monthly";
  format: "pdf" | "csv";
  recipients: string;
  enabled: boolean;
};

const TEMPLATES = [
  { id: "ops-daily", name: "Daily operations summary", desc: "Appointments, no-shows, queue health, doctor utilization.", icon: Calendar },
  { id: "weekly-exec", name: "Weekly executive report", desc: "Volume trends, KPI deltas, top specialties, completion rates.", icon: FileText },
  { id: "doctor-perf", name: "Doctor performance pack", desc: "Per-doctor throughput, completion, cancellations.", icon: Repeat },
  { id: "billing-month", name: "Monthly billing snapshot", desc: "Plan usage, seats, SMS volume, invoice placeholders.", icon: Mail },
];

function Reports() {
  const __ok = useRequireRole(["admin"]);
  if (!__ok) return null;
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: "s1", name: "Daily ops digest", cadence: "daily", format: "pdf", recipients: "ops@clinic.com", enabled: true },
    { id: "s2", name: "Weekly KPIs", cadence: "weekly", format: "pdf", recipients: "leads@clinic.com", enabled: true },
  ]);
  const [form, setForm] = useState<Schedule>({ id: "", name: "", cadence: "weekly", format: "pdf", recipients: "", enabled: true });

  const addSchedule = () => {
    if (!form.name || !form.recipients) return toast.error("Name and recipients required");
    setSchedules((s) => [...s, { ...form, id: crypto.randomUUID() }]);
    setForm({ id: "", name: "", cadence: "weekly", format: "pdf", recipients: "", enabled: true });
    toast.success("Schedule added (delivery hook pending)");
  };

  return (
    <DashboardShell title="Reports" subtitle="Generate, export, and schedule clinic reports.">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Report templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-info/15 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{t.desc}</div>
                    <div className="mt-3 flex gap-2">
                      <Link to="/analytics"><Button size="sm" variant="outline" className="rounded-full"><Download className="mr-1.5 h-3.5 w-3.5" />Open in Analytics</Button></Link>
                      <Button size="sm" className="rounded-full" onClick={() => toast.success("Queued for generation")}><FileText className="mr-1.5 h-3.5 w-3.5" />Generate now</Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scheduled reports</h2>
          <Badge variant="outline" className="rounded-full">Delivery pipeline — preview</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
            {schedules.length === 0 ? (
              <div className="p-6">
                <EmptyState title="No schedules yet" description="Create one on the right to receive recurring reports." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {schedules.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-4">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Repeat className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.cadence} · {s.format.toUpperCase()} · {s.recipients}</div>
                    </div>
                    <Switch checked={s.enabled} onCheckedChange={(v) => setSchedules((arr) => arr.map((x) => x.id === s.id ? { ...x, enabled: v } : x))} />
                    <Button variant="ghost" size="sm" onClick={() => setSchedules((arr) => arr.filter((x) => x.id !== s.id))}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" />New schedule</div>
            <div className="mt-4 space-y-3">
              <div><Label>Name</Label><Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Daily ops digest" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cadence</Label>
                  <Select value={form.cadence} onValueChange={(v: any) => setForm({ ...form, cadence: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format</Label>
                  <Select value={form.format} onValueChange={(v: any) => setForm({ ...form, format: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Recipients</Label><Input className="mt-1.5" value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} placeholder="ops@clinic.com, ceo@clinic.com" /></div>
              <Button className="w-full rounded-full" onClick={addSchedule}>Add schedule</Button>
              <p className="text-[11px] text-muted-foreground">Delivery runs via a cron-driven server hook (wire-up pending).</p>
            </div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}