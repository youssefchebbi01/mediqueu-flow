import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { analytics, doctors } from "@/lib/mock-data";
import { Clock, Smile, TrendingDown, CalendarCheck } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — MediQueu" }] }),
  component: Analytics,
});

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-info)"];

function Analytics() {
  return (
    <DashboardShell title="Analytics" subtitle="Performance, wait times and patient flow.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Clock} label="Avg wait" value={`${analytics.avgWait} min`} trend="−18% MoM" />
        <StatCard icon={CalendarCheck} label="Appts / day" value="73" trend="+9 vs last week" />
        <StatCard icon={TrendingDown} label="Cancellations" value={`${analytics.cancellationRate}%`} trend="Healthy" />
        <StatCard icon={Smile} label="Satisfaction" value={`${analytics.satisfaction}/5`} trend="312 ratings" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Wait time trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.weekly} margin={{ left: -10, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
              <Line type="monotone" dataKey="wait" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Specialty mix">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={analytics.specialtyMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {analytics.specialtyMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Doctor performance</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctors.map((d) => ({ name: d.name.replace("Dr. ", ""), seen: Math.floor(Math.random() * 30 + 10) }))} margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Bar dataKey="seen" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Top reasons for visit</h3>
          <ul className="mt-4 space-y-3">
            {[
              ["Annual check-up", 28],
              ["Dental cleaning", 19],
              ["Vaccination", 14],
              ["Follow-up", 11],
              ["Skin consultation", 9],
            ].map(([r, v]) => (
              <li key={r as string}>
                <div className="flex justify-between text-sm">
                  <span>{r}</span>
                  <span className="text-muted-foreground">{v}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
