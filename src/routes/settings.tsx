import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MediQueu" }] }),
  component: Settings,
});

function Settings() {
  return (
    <DashboardShell title="Settings" subtitle="Manage your profile, clinic and preferences.">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="clinic">Clinic</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" defaultValue="Alex Morgan" />
              <Field label="Email" defaultValue="alex@mediqueu.app" />
              <Field label="Phone" defaultValue="+1 555 0103" />
              <Field label="Date of birth" type="date" defaultValue="1992-04-12" />
            </div>
            <Save />
          </Card>
        </TabsContent>

        <TabsContent value="clinic" className="mt-6">
          <Card title="Clinic settings">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Clinic name" defaultValue="MediQueu Demo Clinic" />
              <Field label="Phone" defaultValue="+1 555 0100" />
              <Field label="Address" defaultValue="221B Baker Street" />
              <div>
                <Label className="text-sm">Time zone</Label>
                <Select defaultValue="utc"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern (EST)</SelectItem>
                    <SelectItem value="cet">Central Europe (CET)</SelectItem>
                    <SelectItem value="gst">Gulf (GST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Save />
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
            <Save />
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
            <Save />
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

function Save() {
  return (
    <div className="mt-6 flex justify-end">
      <Button onClick={() => toast.success("Settings saved")} className="rounded-full">Save changes</Button>
    </div>
  );
}
