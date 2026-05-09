import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/mediqueu/logo";
import { setRole, dashboardPath } from "@/lib/role";
import type { Role } from "@/lib/mock-data";
import { Stethoscope, User, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediQueu" }] }),
  component: AuthPage,
});

const roles: { id: Role; label: string; icon: any; desc: string }[] = [
  { id: "patient", label: "Patient", icon: User, desc: "Book and track visits" },
  { id: "receptionist", label: "Reception", icon: Building2, desc: "Run the front desk" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, desc: "See your day & patients" },
  { id: "admin", label: "Admin", icon: ShieldCheck, desc: "Manage the clinic" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [role, setSelected] = useState<Role>("patient");
  const [name, setName] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(role, name || "Alex Morgan");
    toast.success(`Welcome to MediQueu`, { description: `Signed in as ${role}` });
    navigate({ to: dashboardPath[role] });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 gradient-soft opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/"><Logo className="text-primary-foreground [&_div]:text-primary-foreground" /></Link>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70">MediQueu</div>
            <h2 className="mt-3 text-balance text-5xl font-semibold leading-tight tracking-tight">
              The waiting room, reimagined.
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              One workspace for patients, receptionists, doctors and admins. Smart queues, honest ETAs, happier care teams.
            </p>
          </div>
          <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur">
            <div className="text-sm text-primary-foreground/80">"We cut average wait time by 68%."</div>
            <div className="mt-2 text-xs opacity-70">Dr. Hala Mansour — Clinic Director</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <Tabs defaultValue="signin" className="mt-8 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Pick a role to explore the demo workspace.</p>
            </div>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <div className="mt-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">I am a</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const active = role === r.id;
                  return (
                    <button key={r.id} type="button" onClick={() => setSelected(r.id)}
                      className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40"
                      }`}>
                      <div className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <r.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{r.label}</div>
                        <div className="truncate text-xs text-muted-foreground">{r.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <TabsContent value="signin">
              <form onSubmit={handle} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@clinic.com" defaultValue="demo@mediqueu.app" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" defaultValue="demodemo" className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full rounded-full">
                  Continue<ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handle} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="e2">Email</Label>
                  <Input id="e2" type="email" placeholder="you@clinic.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="p2">Password</Label>
                  <Input id="p2" type="password" placeholder="Create a password" className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full rounded-full">Create account<ArrowRight className="ml-1 h-4 w-4" /></Button>
              </form>
            </TabsContent>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our Terms & Privacy.
            </p>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
