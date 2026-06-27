import { useRequireRole } from "@/hooks/use-auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, StatCard } from "@/components/mediqueu/dashboard-shell";
import { analytics } from "@/lib/mock-data";
import { Users, Clock, CalendarCheck, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MediQueu" }] }),
  component: Admin,
});

type Doctor = Tables<"doctors_directory">;
type Specialty = Tables<"specialties">;
type Appt = Tables<"appointments">;

function Admin() {
  const __ok = useRequireRole(["admin"]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [docOpen, setDocOpen] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docSpec, setDocSpec] = useState("");
  const [specName, setSpecName] = useState("");
  const { rows: appts } = useRealtimeTable<Appt>("appointments", { orderBy: { column: "scheduled_at", ascending: false } });

  const refresh = async () => {
    const [{ data: d }, { data: s }] = await Promise.all([
      supabase.from("doctors_directory").select("*").order("name"),
      supabase.from("specialties").select("*").order("name"),
    ]);
    setDoctors(d ?? []); setSpecialties(s ?? []);
  };
  useEffect(() => { refresh(); }, []);

  if (!__ok) return null;          // ← moved to AFTER all hooks

  const addDoctor = async () => {
    if (!docName || !docSpec) return toast.error("Name and specialty required");
    const { error } = await supabase.from("doctors_directory").insert({
      name: docName, specialty: docSpec, available: true,
      avatar: docName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(),
    });
    if (error) return toast.error(error.message);
    toast.success("Doctor added"); setDocOpen(false); setDocName(""); setDocSpec(""); refresh();
  };
  const addSpec = async () => {
    if (!specName) return;
    const { error } = await supabase.from("specialties").insert({ name: specName });
    if (error) return toast.error(error.message);
    toast.success("Specialty added"); setSpecOpen(false); setSpecName(""); refresh();
  };
  const toggleDoctor = async (d: Doctor) => {
    await supabase.from("doctors_directory").update({ available: !d.available }).eq("id", d.id);
    refresh();
  };

  const today = new Date().toDateString();
  const todayAppts = appts.filter((a) => new Date(a.scheduled_at).toDateString() === today);
  const cancelled = appts.filter((a) => a.status === "Cancelled" || a.status === "No Show").length;
  const cancelRate = appts.length ? ((cancelled / appts.length) * 100).toFixed(1) : "0.0";

  return (
    <DashboardShell title="Clinic Overview" subtitle="Real-time picture of your clinic's performance.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Clock} label="Avg wait" value={`${analytics.avgWait} min`} trend="−18% MoM" />
        <StatCard icon={CalendarCheck} label="Appointments today" value={String(todayAppts.length)} trend={`${appts.length} total`} />
        <StatCard icon={TrendingDown} label="Cancellation rate" value={`${cancelRate}%`} trend={`${cancelled} cancelled / no-show`} />
        <StatCard icon={Users} label="Active doctors" value={String(doctors.filter((d) => d.available).length)} trend={`${doctors.length} total`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Appointments this week</h3>
            <Link to="/analytics"><Button variant="ghost" size="sm">View analytics</Button></Link>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weekly} margin={{ left: -10, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Area type="monotone" dataKey="appts" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Peak hours</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourly} margin={{ left: -20, right: 0, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="h" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Bar dataKey="v" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Doctors</h3>
            <Dialog open={docOpen} onOpenChange={setDocOpen}>
              <DialogTrigger asChild><Button size="sm" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Add doctor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add doctor</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input className="mt-1.5" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Dr. Jane Smith" /></div>
                  <div><Label>Specialty</Label><Input className="mt-1.5" value={docSpec} onChange={(e) => setDocSpec(e.target.value)} placeholder="Cardiology" list="spec-list" /><datalist id="spec-list">{specialties.map((s) => <option key={s.id} value={s.name} />)}</datalist></div>
                </div>
                <DialogFooter><Button variant="ghost" onClick={() => setDocOpen(false)}>Cancel</Button><Button onClick={addDoctor}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ul className="divide-y divide-border">
            {doctors.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-6 py-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary text-xs">{(d.avatar ?? d.name).slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{d.specialty} · ★ {d.rating ?? 4.8}</div>
                </div>
                <button onClick={() => toggleDoctor(d)} className={`text-xs ${d.available ? "text-success" : "text-muted-foreground"}`}>{d.available ? "Active" : "Off"}</button>
              </li>
            ))}
            {doctors.length === 0 && <li className="px-6 py-10 text-center text-sm text-muted-foreground">No doctors yet.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-semibold">Specialties & departments</h3>
            <Dialog open={specOpen} onOpenChange={setSpecOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline" className="rounded-full"><Plus className="mr-1 h-4 w-4" />Add</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add specialty</DialogTitle></DialogHeader>
                <div><Label>Name</Label><Input className="mt-1.5" value={specName} onChange={(e) => setSpecName(e.target.value)} placeholder="Neurology" /></div>
                <DialogFooter><Button variant="ghost" onClick={() => setSpecOpen(false)}>Cancel</Button><Button onClick={addSpec}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <ul className="grid grid-cols-2 gap-3 p-4">
            {specialties.map((s) => (
              <li key={s.id} className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{todayAppts.filter((a) => a.specialty === s.name).length} appts today</div>
              </li>
            ))}
            {specialties.length === 0 && <li className="col-span-2 px-6 py-10 text-center text-sm text-muted-foreground">No specialties yet.</li>}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
