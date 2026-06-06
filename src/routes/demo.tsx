import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Try the demo — MediQueu" },
      { name: "description", content: "Explore MediQueu instantly with a guided demo workspace. No setup required." },
    ],
  }),
  component: Demo,
});

const DEMO_ACCOUNTS = [
  { role: "Admin",        email: "demo-admin@mediqueu.app",       desc: "Full clinic overview, analytics and billing." },
  { role: "Receptionist", email: "demo-reception@mediqueu.app",   desc: "Front desk, walk-ins and live queue." },
  { role: "Doctor",       email: "demo-doctor@mediqueu.app",      desc: "Personal schedule, consultation notes." },
  { role: "Patient",      email: "demo-patient@mediqueu.app",     desc: "Patient-side booking and queue tracking." },
];
const DEMO_PASSWORD = "demo-mediqueu-2026";

function Demo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  async function signInAs(email: string) {
    setLoading(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
    setLoading(null);
    if (error) {
      toast.error("Demo workspace not provisioned yet. Try the live trial — it takes 60 seconds.");
      return;
    }
    toast.success("Welcome to the MediQueu demo workspace");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-semibold">MediQueu</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
          <PlayCircle className="h-3.5 w-3.5 text-primary" /> Public demo · read-mostly
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Step inside a working clinic</h1>
        <p className="mt-3 text-muted-foreground">Pick a role to instantly enter a sandbox workspace pre-loaded with realistic appointments, queues and analytics. Data resets nightly.</p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map(a => (
            <button key={a.email} onClick={() => signInAs(a.email)} disabled={!!loading}
              className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{a.role}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
              <div className="mt-2 text-[11px] text-muted-foreground">{loading === a.email ? "Signing in…" : a.email}</div>
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Demo data is anonymized and rebuilt every night.
        </div>
        <div className="mt-6">
          <Link to="/login"><Button variant="outline" className="rounded-full">Or start your own trial</Button></Link>
        </div>
      </div>
    </div>
  );
}