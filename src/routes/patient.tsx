import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { appointments, queue, notifications } from "@/lib/mock-data";
import { Calendar, Clock, FileText, Activity, Upload, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/patient")({
  head: () => ({ meta: [{ title: "Patient Dashboard — MediQueu" }] }),
  component: Patient,
});

function Patient() {
  const upcoming = appointments.filter((a) => ["Confirmed", "Pending"].includes(a.status)).slice(0, 4);
  const myQueue = queue[1]; // pretend the user is the 2nd in queue

  return (
    <DashboardShell title="Good morning, Alex" subtitle="Here's what's happening with your care today.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Calendar} label="Next appointment" value="Today · 10:00" trend="Dr. Hassan · General" />
        <StatCard icon={Clock} label="Estimated wait" value="8 min" trend="Queue position #2" />
        <StatCard icon={Activity} label="Visits this year" value="6" trend="+2 vs last year" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Live queue card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 card-elevated">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Queue</div>
              <div className="mt-1 text-2xl font-semibold">Ticket {myQueue.ticket}</div>
            </div>
            <StatusBadge status={myQueue.status} />
          </div>
          <div className="mt-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-5xl font-semibold tracking-tight">#{myQueue.position + 1}</div>
                <div className="text-sm text-muted-foreground">in line for {myQueue.doctor}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">ETA</div>
                <div className="text-2xl font-semibold text-primary">~{myQueue.etaMin} min</div>
              </div>
            </div>
            <Progress value={60} className="mt-5" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Arrived 09:48</span>
              <span>Updates every minute</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/queue"><Button variant="outline" size="sm">View live board</Button></Link>
            <Button variant="ghost" size="sm">Notify me when I'm next</Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <span className="text-xs text-muted-foreground">{notifications.length} new</span>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{n.title}</div>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Upcoming */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Upcoming appointments</h3>
            <Link to="/book"><Button size="sm" className="rounded-full">Book new</Button></Link>
          </div>
          <ul className="divide-y divide-border">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary text-xs font-semibold">
                    {a.time}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{a.doctor}</div>
                    <div className="text-xs text-muted-foreground">{a.specialty} · {a.date} · {a.reason}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Medical documents</h3>
          <p className="mt-1 text-xs text-muted-foreground">Share lab results or prescriptions with your doctor.</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary/40 hover:bg-primary-soft/30">
            <Upload className="mb-2 h-5 w-5 text-primary" />
            <div className="text-sm font-medium">Upload file</div>
            <div className="text-xs text-muted-foreground">PDF, JPG up to 10MB</div>
            <input type="file" className="hidden" />
          </label>
          <div className="mt-4 space-y-2">
            {[
              { n: "Blood test — Mar 2025", s: "1.2 MB" },
              { n: "Prescription — Jan 2025", s: "320 KB" },
            ].map((f) => (
              <div key={f.n} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{f.n}</span>
                </div>
                <span className="text-xs text-muted-foreground">{f.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
