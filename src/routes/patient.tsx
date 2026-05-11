import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Clock, FileText, Activity, Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";

type Appt = Tables<"appointments">;
type QueueRow = Tables<"queue_entries">;
type Notif = Tables<"notifications">;

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient Dashboard — MediQueu" }] }),
  component: Patient,
});

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Patient() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  const { rows: appts } = useRealtimeTable<Appt>("appointments", {
    filter: userId ? { column: "patient_id", value: userId } : null,
    orderBy: { column: "scheduled_at", ascending: true },
    enabled: !!userId,
  });
  const { rows: myQueue } = useRealtimeTable<QueueRow>("queue_entries", {
    filter: userId ? { column: "patient_id", value: userId } : null,
    orderBy: { column: "position", ascending: true },
    enabled: !!userId,
  });
  const { rows: notifs } = useRealtimeTable<Notif>("notifications", {
    filter: userId ? { column: "user_id", value: userId } : null,
    orderBy: { column: "created_at", ascending: false },
    enabled: !!userId,
  });

  const upcoming = appts.filter((a) => ["Confirmed", "Pending"].includes(a.status)).slice(0, 4);
  const next = upcoming[0];
  const myEntry = myQueue.find((q) => q.status !== "Completed");

  return (
    <DashboardShell title={`Good day, ${name}`} subtitle="Your appointments and live queue, in real time.">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Calendar} label="Next appointment" value={next ? fmtDate(next.scheduled_at) : "—"} trend={next ? `${next.doctor_name} · ${next.specialty}` : "Nothing booked"} />
        <StatCard icon={Clock} label="Estimated wait" value={myEntry ? `${myEntry.eta_min ?? 0} min` : "—"} trend={myEntry ? `Position #${myEntry.position}` : "Not in queue"} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={Activity} label="Upcoming" value={String(upcoming.length)} trend="Confirmed + pending" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 sm:p-6 card-elevated">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Queue</div>
              <div className="mt-1 truncate text-2xl font-semibold">{myEntry ? `Ticket ${myEntry.ticket}` : "You're not in line"}</div>
            </div>
            {myEntry && <StatusBadge status={myEntry.status} />}
          </div>
          <div className="mt-6">
            {myEntry ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-4xl font-semibold tracking-tight sm:text-5xl">#{myEntry.position}</div>
                    <div className="truncate text-sm text-muted-foreground">in line for {myEntry.doctor_name ?? "your doctor"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">ETA</div>
                    <div className="text-2xl font-semibold text-primary">~{myEntry.eta_min ?? 0} min</div>
                  </div>
                </div>
                <Progress value={Math.max(10, 100 - (myEntry.position * 15))} className="mt-5" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Arrived {new Date(myEntry.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>Live updates</span>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                When reception checks you in, you'll see your live position and ETA here.
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/queue"><Button variant="outline" size="sm">View live board</Button></Link>
            <Link to="/book"><Button size="sm" className="rounded-full">Book appointment</Button></Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <span className="text-xs text-muted-foreground">{notifs.filter((n) => !n.read).length} new</span>
          </div>
          <div className="mt-4 space-y-3">
            {notifs.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                You'll see reminders and queue updates here.
              </div>
            )}
            {notifs.slice(0, 5).map((n) => (
              <div key={n.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{n.title}</div>
                  <span className="flex-shrink-0 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {n.body && <div className="mt-1 text-xs text-muted-foreground">{n.body}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-semibold">Upcoming appointments</h3>
            <Link to="/book"><Button size="sm" className="rounded-full">Book new</Button></Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">No upcoming appointments.</div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="grid h-11 w-14 flex-shrink-0 place-items-center rounded-xl bg-primary-soft text-primary text-[11px] font-semibold leading-tight">
                      {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{a.doctor_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.specialty}{a.reason ? ` · ${a.reason}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                    <StatusBadge status={a.status} />
                    <ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h3 className="font-semibold">Medical documents</h3>
          <p className="mt-1 text-xs text-muted-foreground">Share lab results or prescriptions with your doctor.</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/40 hover:bg-primary-soft/30">
            <Upload className="mb-2 h-5 w-5 text-primary" />
            <div className="text-sm font-medium">Upload file</div>
            <div className="text-xs text-muted-foreground">PDF, JPG up to 10MB</div>
            <input type="file" className="hidden" />
          </label>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>No documents yet</span></div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}