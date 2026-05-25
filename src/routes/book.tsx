import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { timeSlots } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";

type Doctor = Tables<"doctors_directory">;
type Specialty = Tables<"specialties">;

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book Appointment — MediQueu" }] }),
  component: Book,
});

function Book() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [step, setStep] = useState(0);
  const [specialty, setSpecialty] = useState<string>("");
  const [doctorId, setDoctorId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: sp }, { data: docs }] = await Promise.all([
        supabase.from("specialties").select("*").order("name"),
        supabase.from("doctors_directory").select("*").order("name"),
      ]);
      setSpecialties(sp ?? []);
      setDoctors(docs ?? []);
      if (sp?.length && !specialty) setSpecialty(sp[0].name);
    })();
  }, []);

  const filteredDoctors = doctors.filter((d) => d.specialty === specialty);
  const steps = ["Specialty", "Doctor", "Date & time", "Confirm"];

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor || !date || !slot) {
      toast.error("Please complete all steps");
      return;
    }
    setBusy(true);
    const [h, m] = slot.split(":").map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(h, m, 0, 0);
    const { error } = await supabase.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      specialty,
      scheduled_at: scheduled.toISOString(),
      reason: reason || null,
      status: "Confirmed",
      clinic_id: doctor.clinic_id,
    });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Appointment booked",
        body: `${doctor.name} · ${scheduled.toLocaleString()}`,
        type: "success",
      });
    }
    setBusy(false);
    if (error) {
      toast.error("Booking failed", { description: error.message });
      return;
    }
    toast.success("Appointment booked", { description: `${scheduled.toDateString()} at ${slot}` });
    navigate({ to: "/patient" });
  };

  return (
    <DashboardShell title="Book an appointment" subtitle="Four quick steps. Reschedule any time.">
      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn(
              "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
              i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 card-elevated">
        {step === 0 && (
          <div>
            <h3 className="text-lg font-semibold">Choose a specialty</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.map((s) => (
                <button key={s.id} onClick={() => setSpecialty(s.name)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    specialty === s.name ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                  )}>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{Math.floor(Math.random() * 6 + 2)} doctors available</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold">Pick a doctor</h3>
            <div className="mt-4 space-y-2">
              {filteredDoctors.length === 0 && <div className="text-sm text-muted-foreground">No doctors in this specialty.</div>}
              {filteredDoctors.map((d) => (
                <button key={d.id} onClick={() => setDoctorId(d.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
                    doctorId === d.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                  )}>
                  <Avatar className="h-11 w-11"><AvatarFallback className="bg-primary text-primary-foreground">{(d.avatar ?? d.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.specialty} · ★ {d.rating ?? 4.8} · Next: {d.next_slot ?? "—"}</div>
                  </div>
                  <span className={`text-xs ${d.available ? "text-success" : "text-muted-foreground"}`}>{d.available ? "Available" : "Limited"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">Choose a date</h3>
              <div className="mt-4 rounded-xl border border-border p-2">
                <Calendar mode="single" selected={date} onSelect={setDate} className="w-full" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Available slots</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timeSlots.map((t) => (
                  <button key={t} onClick={() => setSlot(t)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm transition",
                      slot === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
                    )}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold">Confirm details</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Detail k="Specialty" v={specialty} />
              <Detail k="Doctor" v={doctors.find((d) => d.id === doctorId)?.name ?? "—"} />
              <Detail k="Date" v={date?.toDateString() ?? "—"} />
              <Detail k="Time" v={slot || "—"} />
            </dl>
            <div className="mt-5">
              <Label htmlFor="reason">Reason for visit (optional)</Label>
              <Textarea id="reason" rows={3} className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief description so the doctor can prepare." />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
          {step < 3
            ? <Button onClick={next} className="rounded-full" disabled={(step === 1 && !doctorId) || (step === 2 && !slot)}>Continue</Button>
            : <Button onClick={submit} className="rounded-full" disabled={busy}>Confirm booking</Button>}
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 text-sm font-medium">{v}</div>
    </div>
  );
}
