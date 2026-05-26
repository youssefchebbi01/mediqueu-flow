import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/mediqueu/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowRight, Building2, MapPin, Globe2, User2, Stethoscope, Sparkles } from "lucide-react";
import { useAuth, dashboardPath } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FullPageLoader } from "@/components/mediqueu/loading";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to MediQueu" }] }),
  component: Onboarding,
});

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome",
  "Europe/Amsterdam", "Europe/Stockholm", "Europe/Zurich", "UTC",
];

function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, role, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.specialty) setSpecialty(profile.specialty);
  }, [profile]);

  const steps = useMemo(() => {
    const base = [
      { key: "welcome", title: "Welcome", icon: Sparkles },
      { key: "profile", title: "Your profile", icon: User2 },
    ];
    if (role === "doctor") base.push({ key: "doctor", title: "Practice", icon: Stethoscope });
    if (role === "admin" || role === "receptionist") {
      base.push({ key: "clinic", title: "Clinic", icon: Building2 });
      base.push({ key: "location", title: "Location", icon: MapPin });
    }
    base.push({ key: "preferences", title: "Preferences", icon: Globe2 });
    base.push({ key: "done", title: "Finish", icon: Check });
    return base;
  }, [role]);

  if (loading || !user) return <FullPageLoader label="Preparing your workspace…" />;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      const profileUpdate: any = {
        full_name: fullName || profile?.full_name,
        phone: phone || profile?.phone,
      };
      if (role === "doctor" && specialty) profileUpdate.specialty = specialty;

      await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);

      if ((role === "admin" || role === "receptionist") && clinicName) {
        const { data: clinic } = await supabase
          .from("clinics")
          .insert({ name: clinicName, address: clinicAddress, phone: clinicPhone, timezone })
          .select("id")
          .single();
        if (clinic?.id) {
          await supabase.from("profiles").update({ clinic_id: clinic.id }).eq("user_id", user.id);
        }
      }

      try { localStorage.setItem(`mq_onboarded_${user.id}`, "1"); } catch {}
      toast.success("You're all set!");
      navigate({ to: dashboardPath[role ?? "patient"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (current.key === "profile" && !fullName.trim()) {
      toast.error("Please enter your name"); return;
    }
    if (isLast) return finish();
    setStep((s) => s + 1);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <button
            onClick={() => navigate({ to: dashboardPath[role ?? "patient"] })}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </header>

        {/* Progress */}
        <div className="mx-auto mt-10 w-full max-w-3xl">
          <ol className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ring-1 transition-colors",
                    i < step && "bg-primary text-primary-foreground ring-primary",
                    i === step && "bg-primary/15 text-primary ring-primary",
                    i > step && "bg-muted text-muted-foreground ring-border"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
                )}
              </li>
            ))}
          </ol>
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            {steps.map((s) => <span key={s.key} className="hidden sm:inline">{s.title}</span>)}
          </div>
        </div>

        {/* Card */}
        <div className="mx-auto mt-10 w-full max-w-2xl flex-1">
          <div className="gradient-border card-elevated rounded-3xl p-8 animate-pop">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-info/15 text-primary ring-1 ring-primary/15">
                <current.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {stepTitle(current.key, role)}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {current.key === "welcome" && (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Let's set up your workspace in under a minute. We'll collect a few essentials so MediQueu is tailored to your clinic from day one.</p>
                  <ul className="grid gap-2">
                    {["Your professional profile", "Clinic & primary location", "Time zone and locale"].map((t) => (
                      <li key={t} className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-success" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {current.key === "profile" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label="Full name" required>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Avery Chen" />
                  </FieldRow>
                  <FieldRow label="Phone">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
                  </FieldRow>
                </div>
              )}

              {current.key === "doctor" && (
                <FieldRow label="Primary specialty">
                  <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Cardiology" />
                </FieldRow>
              )}

              {current.key === "clinic" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label="Clinic name" required>
                    <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Riverside Medical" />
                  </FieldRow>
                  <FieldRow label="Clinic phone">
                    <Input value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} placeholder="+1 555 0100" />
                  </FieldRow>
                </div>
              )}

              {current.key === "location" && (
                <>
                  <FieldRow label="Primary address">
                    <Input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} placeholder="221B Baker Street, London" />
                  </FieldRow>
                  <p className="text-xs text-muted-foreground">
                    You can add more locations from <span className="text-foreground">Settings → Locations</span> later.
                  </p>
                </>
              )}

              {current.key === "preferences" && (
                <FieldRow label="Time zone">
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>
              )}

              {current.key === "done" && (
                <div className="rounded-2xl border border-border bg-primary-soft/40 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" /> You're ready to go
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your workspace is configured. You can refine anything later from Settings.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || saving}
              >
                Back
              </Button>
              <Button onClick={next} disabled={saving} className="rounded-full">
                {isLast ? (saving ? "Saving…" : "Enter workspace") : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function stepTitle(k: string, role: string | null) {
  switch (k) {
    case "welcome": return role === "patient" ? "Welcome to MediQueu" : "Let's set up your clinic";
    case "profile": return "Tell us about you";
    case "doctor": return "Your practice";
    case "clinic": return "Your clinic";
    case "location": return "Primary location";
    case "preferences": return "Locale & time zone";
    case "done": return "All set";
    default: return k;
  }
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}