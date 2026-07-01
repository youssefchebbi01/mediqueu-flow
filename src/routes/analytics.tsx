import { useRequireRole } from "@/hooks/use-auth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Activity, CalendarCheck, Clock, TrendingDown, Users, Timer,
  ArrowUpRight, ArrowDownRight, Download, FileText, Stethoscope, Percent,
} from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrg } from "@/hooks/use-current-org";
import {
  rangePreset, type DateRange, inRange, pct,
  groupByDay, hourlyDistribution, bySpecialty, byDoctor,
  averageWaitMin, bookingLeadDays, exportCSV, exportPDF,
  type Appt, type Queue,
} from "@/lib/analytics-utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — MediQueu" }] }),
  component: Analytics,
});

const COLORS = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-info)",
];

type PresetKey = "7d" | "30d" | "90d" | "mtd" | "ytd";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "mtd", label: "MTD" },
  { key: "ytd", label: "YTD" },
];

function Analytics() {
  const __ok = useRequireRole(["admin", "doctor"]);
  
  const { org } = useCurrentOrg();
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [queue, setQueue] = useState<Queue[]>([]);

  const range: DateRange = useMemo(() => rangePreset(preset), [preset]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const fromISO = range.from.toISOString();
      const toISO = range.to.toISOString();
      let aq = supabase.from("appointments").select("*")
        .gte("scheduled_at", fromISO).lte("scheduled_at", toISO)
        .order("scheduled_at", { ascending: false });
      let qq = supabase.from("queue_entries").select("*")
        .gte("arrived_at", fromISO).lte("arrived_at", toISO);
      if (org?.id) { aq = aq.eq("organization_id", org.id); qq = qq.eq("organization_id", org.id); }
      const [{ data: a }, { data: q }] = await Promise.all([aq, qq]);
      if (cancelled) return;
      setAppts((a as Appt[]) ?? []);
      setQueue((q as Queue[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [org?.id, range.from, range.to]);

  // KPIs
  const todayKey = new Date().toDateString();
  const todayAppts = appts.filter((a) => new Date(a.scheduled_at).toDateString() === todayKey);
  const completed = appts.filter((a) => a.status === "Completed").length;
  const cancelled = appts.filter((a) => a.status === "Cancelled").length;
  const noShows = appts.filter((a) => a.status === "No Show").length;
  const monthAppts = appts.filter((a) => inRange(a.scheduled_at, rangePreset("mtd"))).length;
  const avgWait = averageWaitMin(queue);
  const noShowRate = pct(noShows, appts.length);
  const completionRate = pct(completed, appts.length);
  const leadDays = bookingLeadDays(appts);

  const doctorsAgg = byDoctor(appts);
  const activeDoctors = doctorsAgg.length;
  const throughput = Math.round((completed / Math.max(1, daysBetween(range))) * 10) / 10;
  const utilization = pct(completed, Math.max(1, activeDoctors * daysBetween(range) * 8)); // assume 8 slots/doc/day

  // Series
  const daily = useMemo(() => groupByDay(appts, range), [appts, range]);
  const hourly = useMemo(() => hourlyDistribution(appts), [appts]);
  const specMix = useMemo(() => bySpecialty(appts), [appts]);
  const queueByHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ h: `${String(h).padStart(2, "0")}h`, wait: 0, count: 0 }));
    for (const q of queue) {
      const h = new Date(q.arrived_at).getHours();
      if (q.eta_min != null) { buckets[h].wait += q.eta_min; buckets[h].count++; }
    }
    return buckets.slice(6, 22).map((b) => ({ h: b.h, avg: b.count ? Math.round(b.wait / b.count) : 0, count: b.count }));
  }, [queue]);

  const downloadCSV = () => {
    exportCSV(`appointments_${preset}.csv`, appts.map((a) => ({
      scheduled_at: a.scheduled_at, doctor: a.doctor_name, specialty: a.specialty,
      status: a.status, reason: a.reason ?? "",
    })));
  };
  const downloadPDF = () =>
    exportPDF(`Clinic Report ${preset.toUpperCase()}`, [
      {
        heading: "Key metrics",
        head: ["Metric", "Value"],
        rows: [
          ["Appointments (range)", appts.length],
          ["Completed", completed],
          ["Cancelled", cancelled],
          ["No-shows", noShows],
          ["No-show rate", `${noShowRate}%`],
          ["Completion rate", `${completionRate}%`],
          ["Avg wait (min)", avgWait],
          ["Avg booking lead (days)", leadDays],
          ["Active doctors", activeDoctors],
          ["Throughput / day", throughput],
        ],
      },
      {
        heading: "Doctor performance",
        head: ["Doctor", "Total", "Completed", "Cancelled/No-show"],
        rows: doctorsAgg.map((d) => [d.name, d.total, d.completed, d.cancelled]),
      },
      {
        heading: "Specialty mix",
        head: ["Specialty", "Appointments"],
        rows: specMix.map((s) => [s.name, s.value]),
      },
    ]);

  return (
    <DashboardShell title="Analytics" subtitle="Operational intelligence for your clinic.">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                preset === p.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={downloadCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" className="rounded-full" onClick={downloadPDF}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi loading={loading} icon={CalendarCheck} label="Today" value={String(todayAppts.length)} trend={`+${todayAppts.filter((a) => a.status !== "Cancelled" && a.status !== "No Show").length} active`} positive />
        <Kpi loading={loading} icon={Activity} label="This month" value={String(monthAppts)} trend={`${appts.length} in range`} />
        <Kpi loading={loading} icon={Clock} label="Avg wait" value={`${avgWait} min`} trend={avgWait < 20 ? "Healthy" : "Watch"} positive={avgWait < 20} />
        <Kpi loading={loading} icon={TrendingDown} label="No-show rate" value={`${noShowRate}%`} trend={`${noShows} no-shows`} positive={noShowRate < 7} />
        <Kpi loading={loading} icon={Percent} label="Completion" value={`${completionRate}%`} trend={`${completed} completed`} positive={completionRate > 70} />
        <Kpi loading={loading} icon={Stethoscope} label="Active doctors" value={String(activeDoctors)} trend={`${throughput}/day throughput`} />
        <Kpi loading={loading} icon={Timer} label="Booking lead" value={`${leadDays}d`} trend="avg patient lead time" />
        <Kpi loading={loading} icon={Users} label="Utilization" value={`${utilization}%`} trend="of capacity" positive={utilization > 60} />
      </div>

      <Tabs defaultValue="appointments" className="mt-8">
        <TabsList className="rounded-full bg-muted/60 p-1">
          <TabsTrigger value="appointments" className="rounded-full">Appointments</TabsTrigger>
          <TabsTrigger value="queue" className="rounded-full">Queue</TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-full">Doctors</TabsTrigger>
          <TabsTrigger value="mix" className="rounded-full">Specialty mix</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-5">
          <Panel title="Appointment volume" loading={loading} empty={!appts.length}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={daily} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#vol)" />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Cancellations & no-shows" loading={loading} empty={!appts.length}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={daily} margin={{ left: -10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="x" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="noShow" name="No-show" stackId="x" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Hourly traffic" loading={loading} empty={!appts.length}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hourly} margin={{ left: -10, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="h" stroke="var(--color-muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="v" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-5">
          <Panel title="Average wait by hour" loading={loading} empty={!queue.length}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={queueByHour} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} unit="m" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" name="Avg wait (min)" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="count" name="Patients" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Active in queue" value={String(queue.filter((q) => q.status === "Waiting" || q.status === "Active").length)} />
            <MetricCard label="Median wait" value={`${avgWait} min`} />
            <MetricCard label="Peak hour" value={peakHour(queueByHour)} />
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="mt-5">
          <Panel title="Doctor performance" loading={loading} empty={!doctorsAgg.length}>
            <ResponsiveContainer width="100%" height={Math.max(280, doctorsAgg.length * 36)}>
              <BarChart data={doctorsAgg} layout="vertical" margin={{ left: 0, right: 20, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} width={140} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" name="Completed" stackId="d" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="cancelled" name="Cancelled/No-show" stackId="d" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold">Roster utilization</div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-2 text-left">Doctor</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">Completed</th><th className="px-3 py-2 text-right">Completion %</th><th className="px-5 py-2 text-right">Cancelled / No-show</th></tr>
              </thead>
              <tbody>
                {doctorsAgg.map((d) => (
                  <tr key={d.name} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-2.5 font-medium">{d.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{d.total}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{d.completed}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{pct(d.completed, d.total)}%</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{d.cancelled}</td>
                  </tr>
                ))}
                {!doctorsAgg.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No doctor activity in this range.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="mix" className="mt-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Specialty mix" loading={loading} empty={!specMix.length}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={specMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={2}>
                    {specMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Top specialties" loading={loading} empty={!specMix.length}>
              <ul className="space-y-3 p-2">
                {specMix.slice(0, 8).map((s, i) => (
                  <li key={s.name}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground tabular-nums">{s.value} · {pct(s.value, appts.length)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct(s.value, appts.length)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function daysBetween(r: DateRange) {
  return Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000));
}
function peakHour(rows: { h: string; count: number }[]) {
  if (!rows.length) return "—";
  const top = rows.reduce((a, b) => (b.count > a.count ? b : a));
  return top.count ? top.h : "—";
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  fontSize: 12,
};

function Kpi({
  icon: Icon, label, value, trend, positive, loading,
}: { icon: any; label: string; value: string; trend?: string; positive?: boolean; loading?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-50 transition-opacity group-hover:opacity-80" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</div>
          )}
          {trend && !loading && (
            <div className={cn("mt-1 inline-flex items-center gap-1 text-xs", positive ? "text-success" : "text-muted-foreground")}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-info/15 text-primary ring-1 ring-primary/15">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children, loading, empty }: { title: string; children: React.ReactNode; loading?: boolean; empty?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">
        {loading ? <Skeleton className="h-64 w-full" /> : empty ? (
          <EmptyState title="No data yet" description="Adjust the date range or wait for activity." />
        ) : children}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}