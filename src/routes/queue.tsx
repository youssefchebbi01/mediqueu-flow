import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { Clock, Users, Activity, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";

type QueueRow = Tables<"queue_entries">;

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Live Queue — MediQueu" }] }),
  component: Queue,
});

function Queue() {
  const { rows, loading } = useRealtimeTable<QueueRow>("queue_entries", {
    orderBy: { column: "position", ascending: true },
  });

  const active = rows.filter((r) => r.status !== "Completed");
  const nowServing = active.find((r) => r.status === "Active") ?? active[0];
  const upNext = active.filter((r) => r.id !== nowServing?.id);

  return (
    <DashboardShell title="Live Queue" subtitle="Powered by realtime updates from your clinic.">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="In queue" value={String(active.length)} />
        <StatCard icon={Clock} label="Next ETA" value={`${active[0]?.eta_min ?? 0} min`} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={Activity} label="Now serving" value={nowServing?.ticket ?? "—"} trend={nowServing?.doctor_name ?? undefined} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground card-elevated">
          <div className="text-xs uppercase tracking-wider opacity-80">Now serving</div>
          <div className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">
            {nowServing?.ticket ?? "—"}
          </div>
          <div className="mt-1 text-sm opacity-90 truncate">
            {nowServing?.doctor_name ?? (loading ? "Loading…" : "Queue empty")}
          </div>
          <Progress value={nowServing?.status === "Active" ? 75 : 0} className="mt-6 bg-primary-foreground/20" />
          <div className="mt-2 flex justify-between text-xs opacity-80">
            <span>{nowServing?.status ?? "Idle"}</span>
            <span>~{nowServing?.eta_min ?? 0}m</span>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
            <h3 className="font-semibold">Up next</h3>
            <Button size="sm" variant="outline"><Bell className="mr-1.5 h-4 w-4" />Notify me</Button>
          </div>
          {upNext.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              {loading ? "Loading queue…" : "No one is waiting right now."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upNext.map((q, i) => (
                <li key={q.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary-soft text-primary text-sm font-semibold sm:h-11 sm:w-11">{i + 2}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{q.ticket}</div>
                      <div className="truncate text-xs text-muted-foreground">{q.doctor_name ?? "Unassigned"}</div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                    <span className="text-sm font-medium text-primary">~{q.eta_min ?? 0}m</span>
                    <StatusBadge status={q.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-6 py-3 text-right text-[11px] text-muted-foreground">Live · updates instantly</div>
        </div>
      </div>
    </DashboardShell>
  );
}