import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { useAuth, useRequireRole } from "@/hooks/use-auth";
import { Users, Clock, CheckCircle2, FileText, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Appt = Tables<"appointments">;
type QueueRow = Tables<"queue_entries">;

export const Route = createFileRoute("/doctor")({
  head: () => ({ meta: [{ title: "Doctor — MediQueu" }] }),
  component: Doctor,
});

function Doctor() {
  const __ok = useRequireRole(["doctor", "admin"]);
  if (!__ok) return null;
  const { user, profile } = useAuth();
  const [paused, setPaused] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [myDoctorId, setMyDoctorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("doctors_directory").select("id, available").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMyDoctorId(data.id);
          setPaused(!data.available);
        }
      });
  }, [user]);

  const { rows: appts } = useRealtimeTable<Appt>("appointments", {
    orderBy: { column: "scheduled_at", ascending: true },
  });
  const { rows: queue } = useRealtimeTable<QueueRow>("queue_entries", {
    orderBy: { column: "position", ascending: true },
  });

  const today = new Date().toDateString();
  const myName = profile?.full_name ?? "";
  const my = appts.filter((a) => new Date(a.scheduled_at).toDateString() === today && (myName ? a.doctor_name === myName : true));
  const current = my.find((a) => a.status === "In Consultation") ?? my.find((a) => a.status === "Waiting") ?? my[0];
  const completed = my.filter((a) => a.status === "Completed").length;

  const startCurrent = async () => {
    if (!current) return;
    await supabase.from("appointments").update({ status: "In Consultation" }).eq("id", current.id);
    const q = queue.find((q) => q.patient_id === current.patient_id && q.status !== "Completed");
    if (q) await supabase.from("queue_entries").update({ status: "Active", eta_min: 0 }).eq("id", q.id);
    toast.success("Consultation started");
  };

  const completeCurrent = async () => {
    if (!current) return;
    // Save consultation note
    await supabase.from("consultation_notes").insert({
      appointment_id: current.id,
      patient_id: current.patient_id,
      doctor_id: current.doctor_id,
      doctor_user_id: user?.id ?? null,
      chief_complaint: chiefComplaint || null,
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      prescription: prescription || null,
      clinic_id: current.clinic_id,
    });
    await supabase.from("appointments").update({ status: "Completed" }).eq("id", current.id);
    const q = queue.find((q) => q.patient_id === current.patient_id && q.status !== "Completed");
    if (q) await supabase.from("queue_entries").update({ status: "Completed" }).eq("id", q.id);
    await supabase.from("notifications").insert({
      user_id: current.patient_id,
      title: "Consultation complete",
      body: "Notes and prescription are ready.",
      type: "success",
    });
    toast.success("Consultation completed");
    setChiefComplaint(""); setDiagnosis(""); setTreatment(""); setPrescription("");
  };

  const togglePause = async () => {
    const newPaused = !paused;
    setPaused(newPaused);
    if (myDoctorId) {
      await supabase.from("doctors_directory").update({ available: !newPaused }).eq("id", myDoctorId);
    }
    toast(newPaused ? "Availability paused" : "Availability resumed");
  };

  return (
    <DashboardShell title={profile?.full_name ?? "Doctor"} subtitle={`${profile?.specialty ?? "Clinician"} · today's clinic`}>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Patients today" value={String(my.length)} trend={`${completed} done`} />
        <StatCard icon={Clock} label="Avg consult" value="13 min" />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completed)} trend="On time" />
        <StatCard icon={FileText} label="Up next" value={String(my.filter((a) => a.status === "Confirmed" || a.status === "Waiting").length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 card-elevated">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Now consulting</div>
                <div className="mt-1 truncate text-2xl font-semibold">{current?.doctor_name ? `Patient · ${current.specialty}` : "No active patient"}</div>
                <div className="text-sm text-muted-foreground">{current?.reason ?? "—"}</div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                {current && <StatusBadge status={current.status} />}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={togglePause}>
                    {paused ? <><Play className="mr-1.5 h-4 w-4" />Resume</> : <><Pause className="mr-1.5 h-4 w-4" />Pause</>}
                  </Button>
                  {current?.status !== "In Consultation" && <Button size="sm" variant="outline" disabled={!current} onClick={startCurrent}>Start</Button>}
                  <Button size="sm" disabled={!current} onClick={completeCurrent}>Complete</Button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Chief complaint</Label>
                  <Input value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} className="mt-1.5" placeholder="e.g. Persistent headache" />
                </div>
                <div>
                  <Label>Diagnosis</Label>
                  <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="mt-1.5" placeholder="ICD or free text" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Treatment plan</Label>
                  <Textarea rows={3} value={treatment} onChange={(e) => setTreatment(e.target.value)} className="mt-1.5" placeholder="Recommended treatment, follow-up…" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Prescription</Label>
                  <Textarea rows={3} value={prescription} onChange={(e) => setPrescription(e.target.value)} className="mt-1.5" placeholder="Medication, dosage, duration" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Notes are saved when you mark the consultation complete.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h3 className="font-semibold">Today's schedule</h3>
            </div>
            {my.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">No appointments scheduled today.</div>
            ) : (
              <ul className="divide-y divide-border">
                {my.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className="grid h-10 w-14 flex-shrink-0 place-items-center rounded-lg bg-muted text-xs font-medium">
                        {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.specialty}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.reason ?? "—"}</div>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Up next</h3>
            <span className="text-xs text-muted-foreground">{queue.filter((q) => q.status !== "Completed").length} waiting</span>
          </div>
          <ol className="mt-4 space-y-3">
            {queue.filter((q) => q.status !== "Completed").slice(0, 8).map((q, i) => (
              <li key={q.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-primary-soft text-primary text-sm font-semibold">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{q.ticket}</div>
                  <div className="truncate text-xs text-muted-foreground">{q.doctor_name ?? "—"} · ETA {q.eta_min ?? 0}m</div>
                </div>
                <StatusBadge status={q.status} />
              </li>
            ))}
            {queue.filter((q) => q.status !== "Completed").length === 0 && (
              <li className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Queue is empty.</li>
            )}
          </ol>
        </div>
      </div>
    </DashboardShell>
  );
}