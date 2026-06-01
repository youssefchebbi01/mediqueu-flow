import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { StatusBadge } from "@/components/mediqueu/status-badge";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { Users, CalendarCheck, Clock, AlertCircle, UserPlus, Printer, ArrowUp, ArrowDown, PlayCircle, X, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { DataTable, type Column } from "@/components/mediqueu/data-table";
import { AdvancedFilters, type FilterValues } from "@/components/mediqueu/advanced-filters";
import { EmptyState } from "@/components/mediqueu/empty-state";

type Appt = Tables<"appointments">;
type QueueRow = Tables<"queue_entries">;
type Doctor = Tables<"doctors_directory">;
type Profile = Tables<"profiles">;

export const Route = createFileRoute("/reception")({
  head: () => ({ meta: [{ title: "Reception — MediQueu" }] }),
  component: Reception,
});

function Reception() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkPatient, setWalkPatient] = useState("");
  const [walkDoctor, setWalkDoctor] = useState("");
  const [filters, setFilters] = useState<FilterValues>({
    q: "", doctor: "all", specialty: "all", status: "all", when: "today",
  });

  const { rows: appts } = useRealtimeTable<Appt>("appointments", {
    orderBy: { column: "scheduled_at", ascending: true },
  });
  const { rows: queue } = useRealtimeTable<QueueRow>("queue_entries", {
    orderBy: { column: "position", ascending: true },
  });

  useEffect(() => {
    supabase.from("doctors_directory").select("*").order("name").then(({ data }) => setDoctors(data ?? []));
    supabase.from("profiles").select("*").order("full_name").then(({ data }) => setPatients(data ?? []));
  }, []);

  const todayStr = new Date().toDateString();
  const filtered = useMemo(() => {
    const q = (filters.q ?? "").toLowerCase();
    return appts.filter((a) => {
      const d = new Date(a.scheduled_at);
      const isToday = d.toDateString() === todayStr;
      if (filters.when === "today" && !isToday) return false;
      if (filters.when === "upcoming" && d.getTime() < Date.now()) return false;
      if (filters.when === "completed" && a.status !== "Completed") return false;
      if (filters.when === "noshow" && a.status !== "No Show") return false;
      if (filters.doctor !== "all" && a.doctor_id !== filters.doctor) return false;
      if (filters.specialty !== "all" && a.specialty !== filters.specialty) return false;
      if (filters.status !== "all" && a.status !== filters.status) return false;
      if (q && !(a.doctor_name.toLowerCase().includes(q) || (a.reason ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [appts, filters, todayStr]);

  const todayAppts = appts.filter((a) => new Date(a.scheduled_at).toDateString() === todayStr);
  const inWaiting = queue.filter((q) => q.status === "Waiting").length;
  const delays = queue.filter((q) => (q.eta_min ?? 0) > 20).length;
  const avgWait = queue.length
    ? Math.round(queue.reduce((s, q) => s + (q.eta_min ?? 0), 0) / queue.length)
    : 0;

  const nextTicket = () => {
    const n = queue.length + 1;
    return `A-${String(n).padStart(3, "0")}`;
  };

  const markArrived = async (a: Appt) => {
    await supabase.from("appointments").update({ status: "Waiting" }).eq("id", a.id);
    // Create queue entry if not already
    const exists = queue.find((q) => q.patient_id === a.patient_id && q.status !== "Completed");
    if (!exists) {
      const pos = queue.filter((q) => q.status !== "Completed").length + 1;
      await supabase.from("queue_entries").insert({
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        doctor_name: a.doctor_name,
        clinic_id: a.clinic_id,
        ticket: nextTicket(),
        position: pos,
        eta_min: pos * 8,
        status: "Waiting",
      });
    }
    await supabase.from("notifications").insert({
      user_id: a.patient_id,
      title: "You're checked in",
      body: `Waiting for ${a.doctor_name}`,
      type: "info",
    });
    toast.success(`${a.doctor_name} · patient checked in`);
  };

  const startConsult = async (a: Appt) => {
    await supabase.from("appointments").update({ status: "In Consultation" }).eq("id", a.id);
    const q = queue.find((q) => q.patient_id === a.patient_id && q.status !== "Completed");
    if (q) await supabase.from("queue_entries").update({ status: "Active", eta_min: 0 }).eq("id", q.id);
    toast.success("Consultation started");
  };

  const cancelAppt = async (a: Appt, status: "Cancelled" | "No Show") => {
    await supabase.from("appointments").update({ status }).eq("id", a.id);
    toast(status === "Cancelled" ? "Appointment cancelled" : "Marked as no-show");
  };

  const bulkUpdate = async (ids: string[], status: "Cancelled" | "Confirmed") => {
    await supabase.from("appointments").update({ status }).in("id", ids);
    toast.success(`${ids.length} appointment(s) updated`);
  };

  const moveQueue = async (q: QueueRow, dir: -1 | 1) => {
    const active = queue.filter((x) => x.status !== "Completed").sort((a, b) => a.position - b.position);
    const idx = active.findIndex((x) => x.id === q.id);
    const swap = active[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("queue_entries").update({ position: swap.position }).eq("id", q.id),
      supabase.from("queue_entries").update({ position: q.position }).eq("id", swap.id),
    ]);
  };

  const startQueue = async (q: QueueRow) => {
    await supabase.from("queue_entries").update({ status: "Active", eta_min: 0 }).eq("id", q.id);
    toast.success("Now serving " + q.ticket);
  };

  const completeQueue = async (q: QueueRow) => {
    await supabase.from("queue_entries").update({ status: "Completed" }).eq("id", q.id);
    toast.success("Marked completed");
  };

  const addWalkIn = async () => {
    if (!walkPatient || !walkDoctor) {
      toast.error("Pick patient and doctor");
      return;
    }
    const doc = doctors.find((d) => d.id === walkDoctor);
    if (!doc) return;
    const pat = patients.find((p) => p.user_id === walkPatient);
    if (!pat) return;
    const scheduled = new Date();
    const { error: aErr } = await supabase.from("appointments").insert({
      patient_id: pat.user_id,
      doctor_id: doc.id,
      doctor_name: doc.name,
      specialty: doc.specialty,
      scheduled_at: scheduled.toISOString(),
      status: "Waiting",
      reason: "Walk-in",
      clinic_id: doc.clinic_id,
    });
    const pos = queue.filter((q) => q.status !== "Completed").length + 1;
    await supabase.from("queue_entries").insert({
      patient_id: pat.user_id,
      doctor_id: doc.id,
      doctor_name: doc.name,
      clinic_id: doc.clinic_id,
      ticket: nextTicket(),
      position: pos,
      eta_min: pos * 8,
      status: "Waiting",
    });
    if (aErr) {
      toast.error(aErr.message);
      return;
    }
    toast.success("Walk-in added");
    setWalkInOpen(false);
    setWalkPatient("");
    setWalkDoctor("");
  };

  const specialtyOpts = useMemo(() => {
    const set = new Set<string>();
    appts.forEach((a) => a.specialty && set.add(a.specialty));
    return Array.from(set).sort();
  }, [appts]);

  const apptColumns: Column<Appt>[] = [
    {
      id: "time", header: "Time", sortable: true,
      accessor: (a) => a.scheduled_at,
      cell: (a) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    { id: "doctor", header: "Doctor", sortable: true, accessor: (a) => a.doctor_name },
    { id: "specialty", header: "Specialty", sortable: true, accessor: (a) => a.specialty, hideBelow: "md",
      cell: (a) => <span className="text-muted-foreground">{a.specialty}</span> },
    { id: "reason", header: "Reason", accessor: (a) => a.reason ?? "—", hideBelow: "lg",
      cell: (a) => <span className="text-muted-foreground">{a.reason ?? "—"}</span> },
    { id: "status", header: "Status", sortable: true, accessor: (a) => a.status,
      cell: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <DashboardShell title="Front Desk" subtitle={`${new Date().toLocaleDateString([], { weekday: "long" })} · live clinic flow.`}>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Today's appointments" value={String(todayAppts.length)} trend={`${todayAppts.filter((a) => a.status === "Confirmed").length} confirmed`} />
        <StatCard icon={Users} label="In waiting room" value={String(inWaiting)} trend="Live" />
        <StatCard icon={Clock} label="Avg wait" value={`${avgWait} min`} />
        <StatCard icon={AlertCircle} label="Delays" value={String(delays)} trend={delays ? "ETA > 20m" : "On track"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Appointments</h3>
            <div className="flex flex-wrap gap-2">
              <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><UserPlus className="mr-1.5 h-4 w-4" />Walk-in</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add walk-in patient</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Patient</Label>
                      <Select value={walkPatient} onValueChange={setWalkPatient}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select patient" /></SelectTrigger>
                        <SelectContent>
                          {patients.map((p) => (
                            <SelectItem key={p.user_id} value={p.user_id}>{p.full_name ?? p.user_id.slice(0, 8)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Doctor</Label>
                      <Select value={walkDoctor} onValueChange={setWalkDoctor}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                        <SelectContent>
                          {doctors.filter((d) => d.available).map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name} · {d.specialty}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setWalkInOpen(false)}>Cancel</Button>
                    <Button onClick={addWalkIn}>Add to queue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => toast("Ticket printed")}>
                <Printer className="mr-1.5 h-4 w-4" />Ticket
              </Button>
            </div>
          </div>

          <AdvancedFilters
            storageKey="reception_appts"
            values={filters}
            onChange={setFilters}
            fields={[
              { kind: "search", id: "q", placeholder: "Search doctor or reason" },
              { kind: "select", id: "when", label: "When", options: [
                { value: "today", label: "Today" },
                { value: "upcoming", label: "Upcoming" },
                { value: "completed", label: "Completed" },
                { value: "noshow", label: "No-shows" },
                { value: "all", label: "All time" },
              ]},
              { kind: "select", id: "doctor", label: "Doctor", options: [
                { value: "all", label: "All doctors" },
                ...doctors.map((d) => ({ value: d.id, label: d.name })),
              ]},
              { kind: "select", id: "specialty", label: "Specialty", options: [
                { value: "all", label: "All specialties" },
                ...specialtyOpts.map((s) => ({ value: s, label: s })),
              ]},
              { kind: "select", id: "status", label: "Status", options: [
                { value: "all", label: "Any status" },
                { value: "Pending", label: "Pending" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Waiting", label: "Waiting" },
                { value: "In Consultation", label: "In Consultation" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" },
                { value: "No Show", label: "No Show" },
              ]},
            ]}
          />

          <DataTable<Appt>
            rows={filtered}
            columns={apptColumns}
            storageKey="reception_appts"
            pageSize={12}
            selectable
            initialSort={{ id: "time", dir: "asc" }}
            empty={{
              icon: CalendarX,
              title: "No appointments match these filters",
              description: "Try widening the date range, clearing filters, or adding a walk-in.",
              action: <Button size="sm" onClick={() => setWalkInOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" />Add walk-in</Button>,
            }}
            bulkActions={(sel, clear) => (
              <>
                <Button size="sm" variant="ghost" className="h-7 px-2"
                  onClick={async () => { await bulkUpdate(sel.map((s) => s.id), "Confirmed"); clear(); }}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive"
                  onClick={async () => { await bulkUpdate(sel.map((s) => s.id), "Cancelled"); clear(); }}>
                  Cancel
                </Button>
              </>
            )}
            rowActions={(a) => (
              <div className="flex justify-end gap-1">
                {a.status === "Confirmed" || a.status === "Pending" ? (
                  <Button size="sm" variant="ghost" onClick={() => markArrived(a)}>Arrived</Button>
                ) : a.status === "Waiting" ? (
                  <Button size="sm" variant="ghost" onClick={() => startConsult(a)}><PlayCircle className="mr-1 h-3.5 w-3.5" />Start</Button>
                ) : null}
                {!["Completed", "Cancelled", "No Show"].includes(a.status) && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => cancelAppt(a, "Cancelled")} title="Cancel"><X className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelAppt(a, "No Show")} title="No-show"><AlertCircle className="h-3.5 w-3.5" /></Button>
                  </>
                )}
              </div>
            )}
          />
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
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="Queue is empty"
              description="When patients arrive or are added as walk-ins, they'll appear here in real time."
              action={<Button size="sm" onClick={() => setWalkInOpen(true)}><UserPlus className="mr-1.5 h-4 w-4" />Add walk-in</Button>}
            />
          </div>
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
                  <div className="flex gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveQueue(q, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveQueue(q, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  </div>
                  {q.status === "Waiting" && <Button size="sm" variant="ghost" onClick={() => startQueue(q)}>Start</Button>}
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