import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { queue } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Clock, Users, Activity, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Live Queue — MediQueu" }] }),
  component: Queue,
});

function Queue() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <DashboardShell title="Live Queue" subtitle="Updates automatically every few seconds.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="In queue" value={String(queue.length)} />
        <StatCard icon={Clock} label="Next ETA" value={`${queue[0]?.etaMin ?? 0} min`} />
        <StatCard icon={Activity} label="Now serving" value={queue[0]?.ticket ?? "—"} trend={queue[0]?.doctor} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground card-elevated">
          <div className="text-xs uppercase tracking-wider opacity-80">Now serving</div>
          <div className="mt-2 text-6xl font-semibold tracking-tight">{queue[0]?.ticket}</div>
          <div className="mt-1 text-sm opacity-90">{queue[0]?.patient} · {queue[0]?.doctor}</div>
          <Progress value={75} className="mt-6 bg-primary-foreground/20" />
          <div className="mt-2 flex justify-between text-xs opacity-80">
            <span>In consultation</span>
            <span>~3 min remaining</span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Up next</h3>
            <Button size="sm" variant="outline"><Bell className="mr-1.5 h-4 w-4" />Notify me</Button>
          </div>
          <ul className="divide-y divide-border">
            {queue.slice(1).map((q, i) => (
              <li key={q.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary text-sm font-semibold">{i + 2}</div>
                  <div>
                    <div className="text-sm font-medium">{q.patient}</div>
                    <div className="text-xs text-muted-foreground">{q.ticket} · {q.doctor}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary">~{q.etaMin}m</span>
                  <StatusBadge status={q.status} />
                </div>
              </li>
            ))}
          </ul>
          <div className="px-6 py-3 text-right text-[11px] text-muted-foreground">Last refresh: just now</div>
        </div>
      </div>
    </DashboardShell>
  );
}
