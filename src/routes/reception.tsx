import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { Users, CalendarCheck, Clock, AlertCircle, UserPlus, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Appt = Tables<"appointments">;
type QueueRow = Tables<"queue_entries">;
type Doctor = Tables<"doctors_directory">;

export const Route = createFileRoute("/reception")({
  head: () => ({ meta: [{ title: "Reception — MediQueu" }] }),
  component: Reception,
});

function Reception() {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const { rows: appts } = useRealtimeTable<Appt>("appointments", {
    orderBy: { column: "scheduled_at", ascending: true },
  });
  const { rows: queue } = useRealtimeTable<QueueRow>("queue_entries", {
    orderBy: { column: "position", ascending: true },
  });

  useEffect(() => {
    supabase.from("doctors_directory").select("*").then(({ data }) => setDoctors(data ?? []));
  }, []);

  const today = new Date().toDateString();
  const todayAppts = appts.filter((a) => new Date(a.scheduled_at).toDateString() === today);
  const filtered = todayAppts.filter((a) => !search || a.doctor_name.toLowerCase().includes(search.toLowerCase()));
  const inWaiting = queue.filter((q) => q.status === "Waiting").length;
  const delays = queue.filter((q) => (q.eta_min ?? 0) > 20).length;
  const avgWait = queue.length
    ? Math.round(queue.reduce((s, q) => s + (q.eta_min ?? 0), 0) / queue.length)
    : 0;

  const markArrived = async (a: Appt) => {
    await supabase.from("appointments").update({ status: "Waiting" }).eq("id", a.id);
    toast.success(`${a.doctor_name} · patient marked as arrived`);
  };

  const completeQueue = async (q: QueueRow) => {
    await supabase.from("queue_entries").update({ status: "Completed" }).eq("id", q.id);
    toast.success("Marked completed");
  };

  return (
    <DashboardShell title="Front Desk" subtitle={`${new Date().toLocaleDateString([], { weekday: "long" })} · live clinic flow.`}>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's appointments" value={String(todayAppts.length)} trend={`${todayAppts.filter((a) => a.status === "Confirmed").length} confirmed`} />
        <StatCard icon={Users} label="In waiting room" value={String(inWaiting)} trend="Live" />
        <StatCard icon={Clock} label="Avg wait" value={`${avgWait} min`} />
        <StatCard icon={AlertCircle} label="Delays" value={String(delays)} trend={delays ? "ETA > 20m" : "On track"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="font-semibold">Today's appointments</h3>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search doctor" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-40 pl-9 sm:w-48" />
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.info("Use the booking page to add walk-ins")}>
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
                  <th className="px-4 py-3 text-left font-medium sm:px-6">Time</th>
                  <th className="px-4 py-3 text-left font-medium sm:px-6">Doctor</th>
                  <th className="hidden px-6 py-3 text-left font-medium md:table-cell">Specialty</th>
                  <th className="hidden px-6 py-3 text-left font-medium lg:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left font-medium sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">No appointments today.</td></tr>
                )}
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-medium sm:px-6">
                      {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 sm:px-6">{a.doctor_name}</td>
                    <td className="hidden px-6 py-3 text-muted-foreground md:table-cell">{a.specialty}</td>
                    <td className="hidden px-6 py-3 text-muted-foreground lg:table-cell">{a.reason ?? "—"}</td>
                    <td className="px-4 py-3 sm:px-6"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <Button size="sm" variant="ghost" onClick={() => markArrived(a)}>Arrived</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h3 className="font-semibold">Doctor availability</h3>
          <ul className="mt-4 space-y-3">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary text-xs">{(d.avatar ?? d.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
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
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="font-semibold">Active queue</h3>
          <span className="text-xs text-muted-foreground">Live · {queue.filter((q) => q.status !== "Completed").length} active</span>
        </div>
        {queue.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">No active tickets.</div>
        ) : (
          <ul className="divide-y divide-border">
            {queue.filter((q) => q.status !== "Completed").map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{q.ticket}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{q.doctor_name ?? "Unassigned"}</div>
                    <div className="truncate text-xs text-muted-foreground">arrived {new Date(q.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-muted-foreground">ETA {q.eta_min ?? 0}m</span>
                  <StatusBadge status={q.status} />
                  <Button size="sm" variant="ghost" onClick={() => completeQueue(q)}>Complete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}