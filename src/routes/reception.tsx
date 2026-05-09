import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { appointments, queue, doctors } from "@/lib/mock-data";
import { Users, CalendarCheck, Clock, AlertCircle, UserPlus, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export const Route = createFileRoute("/reception")({
  head: () => ({ meta: [{ title: "Reception — MediQueu" }] }),
  component: Reception,
});

function Reception() {
  return (
    <DashboardShell title="Front Desk" subtitle="Wednesday, 9:42 AM · Manage today's flow at a glance.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's appointments" value="42" trend="6 walk-ins added" />
        <StatCard icon={Users} label="In waiting room" value="9" trend="2 just arrived" />
        <StatCard icon={Clock} label="Avg wait" value="11 min" trend="−4 vs yesterday" />
        <StatCard icon={AlertCircle} label="Delays" value="1" trend="Dr. O'Connor +10m" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <h3 className="font-semibold">Today's appointments</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search patient" className="h-9 w-48 pl-9" />
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success("Walk-in added to queue")}>
                <UserPlus className="mr-1.5 h-4 w-4" />Walk-in
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast("Ticket printed")}>
                <Printer className="mr-1.5 h-4 w-4" />Ticket
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Time</th>
                  <th className="px-6 py-3 text-left font-medium">Patient</th>
                  <th className="px-6 py-3 text-left font-medium">Doctor</th>
                  <th className="px-6 py-3 text-left font-medium">Reason</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments.filter((a) => a.date === "Today").map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{a.time}</td>
                    <td className="px-6 py-3">{a.patient}</td>
                    <td className="px-6 py-3 text-muted-foreground">{a.doctor}</td>
                    <td className="px-6 py-3 text-muted-foreground">{a.reason}</td>
                    <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => toast.success(`${a.patient} marked as arrived`)}>Mark arrived</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Doctor availability</h3>
          <ul className="mt-4 space-y-3">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary text-xs">{d.avatar}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{d.specialty}</div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs ${d.available ? "text-success" : "text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${d.available ? "bg-success" : "bg-muted-foreground"}`} />
                  {d.available ? "Available" : "Busy"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-semibold">Active queue</h3>
          <span className="text-xs text-muted-foreground">Drag rows to reorder</span>
        </div>
        <ul className="divide-y divide-border">
          {queue.map((q) => (
            <li key={q.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-4">
                <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{q.ticket}</span>
                <div>
                  <div className="text-sm font-medium">{q.patient}</div>
                  <div className="text-xs text-muted-foreground">{q.doctor} · arrived {q.arrivedAt}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">ETA {q.etaMin}m</span>
                <StatusBadge status={q.status} />
                <Button size="sm" variant="ghost" onClick={() => toast.success("Marked completed")}>Complete</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
