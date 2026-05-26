import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { Building2, MapPin, Plus, Keyboard } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MediQueu" }] }),
  component: Settings,
});

const TIMEZONES = [
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "Europe/London","Europe/Paris","Europe/Berlin","Europe/Madrid","Europe/Rome",
  "Europe/Amsterdam","Europe/Stockholm","Europe/Zurich","UTC",
];

function Settings() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState<{ id: string; name: string; address: string | null; phone: string | null; timezone: string | null } | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setSpecialty(profile?.specialty ?? "");
  }, [profile]);

  useEffect(() => {
    if (!profile?.clinic_id) return;
    supabase.from("clinics").select("*").eq("id", profile.clinic_id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setClinic(data as any);
      setClinicName(data.name ?? "");
      setClinicAddress(data.address ?? "");
      setClinicPhone(data.phone ?? "");
      setTimezone(data.timezone ?? "UTC");
    });
  }, [profile?.clinic_id]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, phone, specialty: specialty || null,
    }).eq("user_id", user.id);
    setSaving(false);
    error ? toast.error(error.message) : toast.success("Profile saved");
  }

  async function saveClinic() {
    if (!clinic?.id) { toast.error("No clinic linked yet"); return; }
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      name: clinicName, address: clinicAddress, phone: clinicPhone, timezone,
    }).eq("id", clinic.id);
    setSaving(false);
    error ? toast.error(error.message) : toast.success("Clinic updated");
  }

  return (
    <DashboardShell title="Settings" subtitle="Manage your profile, clinic and preferences.">
      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="clinic">Clinic</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Field label="Email" value={user?.email ?? ""} disabled />
              <Field label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Field label="Specialty (clinicians)" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Cardiology" />
            </div>
            <Save onClick={saveProfile} disabled={saving} />
          </Card>
        </TabsContent>

        <TabsContent value="clinic" className="mt-6">
          <Card title="Clinic settings">
            {!clinic ? (
              <EmptyState
                icon={Building2}
                title="No clinic linked yet"
                description="Complete onboarding or ask an admin to invite you to a clinic."
                action={<Button asChild className="rounded-full"><a href="/onboarding">Run setup</a></Button>}
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Clinic name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                  <Field label="Phone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
                  <Field label="Address" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
                  <div>
                    <Label className="text-sm">Time zone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Save onClick={saveClinic} disabled={saving} />
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card title="Locations">
            <EmptyState
              icon={MapPin}
              title="Multi-location coming soon"
              description="Run multiple sites from one workspace. Add satellite clinics, route patients, and share doctors across locations."
              action={
                <Button className="rounded-full" disabled>
                  <Plus className="h-4 w-4" /> Add location
                </Button>
              }
            />
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card title="Notification preferences">
            {[
              ["Appointment reminders", "Get a heads-up before your visits."],
              ["Queue updates", "Notify me when I'm next in line."],
              ["Doctor delays", "Alert me if my doctor is delayed."],
              ["Marketing", "Occasional product updates."],
            ].map(([t, d], i) => (
              <div key={t} className="flex items-center justify-between border-b border-border py-4 last:border-0">
                <div>
                  <div className="text-sm font-medium">{t}</div>
                  <div className="text-xs text-muted-foreground">{d}</div>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
            <Save onClick={() => toast.success("Preferences saved")} />
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card title="Display & language">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Language</Label>
                <Select defaultValue="en"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Theme</Label>
                <Select defaultValue="auto"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Save onClick={() => toast.success("Saved")} />
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="mt-6">
          <Card title="Keyboard shortcuts">
            <div className="divide-y divide-border">
              {[
                ["⌘/Ctrl + K", "Open command palette"],
                ["G then D", "Go to dashboard"],
                ["G then Q", "Open live queue"],
                ["N", "Create new appointment"],
                ["?", "Show shortcuts"],
              ].map(([k, d]) => (
                <div key={k} className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Keyboard className="h-4 w-4 text-muted-foreground" /> {d}
                  </span>
                  <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs">{k}</kbd>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input className="mt-1.5" {...rest} />
    </div>
  );
}

function Save({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-end">
      <Button onClick={onClick ?? (() => toast.success("Saved"))} disabled={disabled} className="rounded-full">
        {disabled ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
