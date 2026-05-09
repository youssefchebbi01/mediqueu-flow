import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { analytics, doctors, specialties } from "@/lib/mock-data";
import { Users, Clock, CalendarCheck, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MediQueu" }] }),
  component: Admin,
});

function Admin() {
  return (
    <DashboardShell title="Clinic Overview" subtitle="Real-time picture of your clinic's performance.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Clock} label="Avg wait" value={`${analytics.avgWait} min`} trend="−18% MoM" />
        <StatCard icon={CalendarCheck} label="Appointments today" value={String(analytics.appointmentsToday)} trend="+12 vs yesterday" />
        <StatCard icon={TrendingDown} label="Cancellation rate" value={`${analytics.cancellationRate}%`} trend="−1.4 pts" />
        <StatCard icon={Users} label="Active doctors" value={String(doctors.filter((d) => d.available).length)} trend={`${doctors.length} total`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Appointments this week</h3>
            <Link to="/analytics"><Button variant="ghost" size="sm">View analytics</Button></Link>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weekly} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Area type="monotone" dataKey="appts" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Peak hours</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourly} margin={{ left: -20, right: 0, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Bar dataKey="v" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Doctors</h3>
            <Button size="sm" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Add doctor</Button>
          </div>
          <ul className="divide-y divide-border">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-6 py-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary text-xs">{d.avatar}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{d.specialty} · ★ {d.rating}</div>
                </div>
                <span className={`text-xs ${d.available ? "text-success" : "text-muted-foreground"}`}>{d.available ? "Active" : "Off"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Specialties & departments</h3>
            <Button size="sm" variant="outline" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Add</Button>
          </div>
          <ul className="grid grid-cols-2 gap-3 p-4">
            {specialties.map((s) => (
              <li key={s.id} className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{Math.floor(Math.random() * 20 + 5)} appts today</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
