import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { appointments, queue } from "@/lib/mock-data";
import { Users, Clock, CheckCircle2, FileText, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [{ title: "Doctor — MediQueu" }] }),
  component: Doctor,
});

function Doctor() {
  const [paused, setPaused] = useState(false);
  const my = appointments.filter((a) => a.doctor.includes("Hassan") && a.date === "Today");
  const current = my.find((a) => a.status === "In Consultation") ?? my[0];

  return (
    <DashboardShell title="Dr. Amira Hassan" subtitle="General Medicine · Wed · Today's clinic">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Patients today" value="14" trend="3 already seen" />
        <StatCard icon={Clock} label="Avg consult" value="13 min" />
        <StatCard icon={CheckCircle2} label="Completed" value="3" trend="On time" />
        <StatCard icon={FileText} label="Pending notes" value="2" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Current patient */}
          <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Now consulting</div>
                <div className="mt-1 text-2xl font-semibold">{current?.patient}</div>
                <div className="text-sm text-muted-foreground">{current?.reason} · started {current?.time}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={current?.status ?? "Waiting"} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setPaused((p) => !p); toast(paused ? "Queue resumed" : "Queue paused"); }}>
                    {paused ? <><Play className="mr-1.5 h-4 w-4" />Resume</> : <><Pause className="mr-1.5 h-4 w-4" />Pause queue</>}
                  </Button>
                  <Button size="sm" onClick={() => toast.success("Consultation completed")}>Complete</Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">Consultation notes</label>
              <Textarea rows={6} placeholder="Subjective, objective, assessment, plan…" defaultValue="Patient reports mild headache for 3 days. BP 120/78. No fever." />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm">Save draft</Button>
                <Button size="sm" onClick={() => toast.success("Notes saved")}>Save notes</Button>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-semibold">Today's schedule</h3>
            </div>
            <ul className="divide-y divide-border">
              {my.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-14 place-items-center rounded-lg bg-muted text-xs font-medium">{a.time}</div>
                    <div>
                      <div className="text-sm font-medium">{a.patient}</div>
                      <div className="text-xs text-muted-foreground">{a.reason}</div>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Queue side */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Up next</h3>
            <span className="text-xs text-muted-foreground">{queue.length} waiting</span>
          </div>
          <ol className="mt-4 space-y-3">
            {queue.map((q, i) => (
              <li key={q.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary text-sm font-semibold">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{q.patient}</div>
                  <div className="truncate text-xs text-muted-foreground">{q.ticket} · ETA {q.etaMin}m</div>
                </div>
                <StatusBadge status={q.status} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DashboardShell>
  );
}
