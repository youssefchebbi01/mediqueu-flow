import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Check, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/contact-sales")({
  head: () => ({
    meta: [
      { title: "Talk to sales — MediQueu" },
      { name: "description", content: "See MediQueu in your clinic. Get a tailored quote, security review and onboarding plan." },
    ],
  }),
  component: ContactSales,
});

function ContactSales() {
  const [form, setForm] = useState({ name: "", email: "", clinic: "", role: "", size: "1-5", country: "United States", message: "" });
  const [sent, setSent] = useState(false);

  function submit() {
    if (!form.name || !form.email || !form.clinic) return toast.error("Name, email and clinic are required");
    setSent(true);
    toast.success("Thanks — a specialist will reach out within one business day.");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-semibold">MediQueu</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">View pricing</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            <Building2 className="h-3.5 w-3.5" /> For clinics and clinic groups
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">See MediQueu in your clinic</h1>
          <p className="mt-3 text-muted-foreground">Get a personalized 25-minute demo, a tailored quote, and a security review pack.</p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              "BAA, SOC 2, GDPR documentation",
              "Tailored onboarding for 3+ locations",
              "SSO / SAML & SCIM provisioning",
              "Dedicated implementation engineer",
              "Custom SLAs and 99.99% uptime",
            ].map(b => (
              <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-success" />{b}</li>
            ))}
          </ul>

          <div className="mt-10 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> sales@mediqueu.com</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 (415) 555-0142</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success"><Check className="h-7 w-7" /></div>
              <div className="mt-4 text-lg font-semibold">Request received</div>
              <p className="mt-1 text-sm text-muted-foreground">A specialist will email you within one business day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Full name</Label><Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Work email</Label><Input type="email" className="mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div><Label>Clinic / Organization</Label><Input className="mt-1.5" value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Your role</Label><Input className="mt-1.5" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Clinic owner" /></div>
                <div>
                  <Label>Clinic size</Label>
                  <Select value={form.size} onValueChange={v => setForm({ ...form, size: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1-5","6-15","16-50","51-200","200+"].map(s => <SelectItem key={s} value={s}>{s} staff</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Country</Label>
                <Select value={form.country} onValueChange={v => setForm({ ...form, country: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["United States","Canada","United Kingdom","France","Germany","Spain","Italy","Netherlands","Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>What would you like to solve?</Label><Textarea className="mt-1.5" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Wait times, scheduling, no-shows, multi-location reporting…" /></div>
              <Button onClick={submit} className="w-full rounded-full">Request a demo</Button>
              <p className="text-[11px] text-muted-foreground">By submitting, you agree to our terms and privacy notice.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}