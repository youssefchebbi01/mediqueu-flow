import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, TrendingDown, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/roi")({
  head: () => ({
    meta: [
      { title: "ROI calculator — MediQueu" },
      { name: "description", content: "Estimate the wait-time reduction and revenue lift MediQueu can bring to your clinic." },
    ],
  }),
  component: RoiPage,
});

function RoiPage() {
  const [doctors, setDoctors] = useState(5);
  const [apptPerDocPerDay, setApptPerDocPerDay] = useState(18);
  const [revPerAppt, setRevPerAppt] = useState(95);
  const [noShowPct, setNoShowPct] = useState(12);
  const [waitMin, setWaitMin] = useState([32]);

  const r = useMemo(() => {
    const days = 22; // working days
    const totalAppt = doctors * apptPerDocPerDay * days;
    const noShowSaved = totalAppt * (noShowPct / 100) * 0.45; // 45% reduction
    const revenueRecovered = noShowSaved * revPerAppt;
    const waitReducedMin = waitMin[0] * 0.62; // ~62% reduction industry benchmark
    const minutesSaved = totalAppt * waitReducedMin;
    const hoursSaved = Math.round(minutesSaved / 60);
    const plan = 149; // assume Professional
    const roi = Math.round(((revenueRecovered - plan) / plan) * 100);
    return { totalAppt, noShowSaved: Math.round(noShowSaved), revenueRecovered: Math.round(revenueRecovered), waitReducedMin: Math.round(waitReducedMin), hoursSaved, roi };
  }, [doctors, apptPerDocPerDay, revPerAppt, noShowPct, waitMin]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-semibold">MediQueu</Link>
          <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">View pricing</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"><Calculator className="h-3.5 w-3.5" /> ROI & wait-time calculator</div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">See what MediQueu could save your clinic</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Drag the sliders to match your operation. Estimates use median results from our 2025 customer cohort.</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Active doctors"><Input type="number" min={1} value={doctors} onChange={e => setDoctors(Math.max(1, Number(e.target.value || 1)))} /></Field>
              <Field label="Appts / doctor / day"><Input type="number" min={1} value={apptPerDocPerDay} onChange={e => setApptPerDocPerDay(Math.max(1, Number(e.target.value || 1)))} /></Field>
              <Field label="Revenue per appointment ($)"><Input type="number" min={1} value={revPerAppt} onChange={e => setRevPerAppt(Math.max(1, Number(e.target.value || 1)))} /></Field>
              <Field label="No-show rate (%)"><Input type="number" min={0} max={50} value={noShowPct} onChange={e => setNoShowPct(Math.max(0, Math.min(50, Number(e.target.value || 0))))} /></Field>
            </div>
            <div>
              <Label>Current average wait time: <span className="font-semibold">{waitMin[0]} min</span></Label>
              <Slider className="mt-3" min={5} max={90} step={1} value={waitMin} onValueChange={setWaitMin} />
            </div>
          </div>

          <div className="space-y-4">
            <Stat icon={DollarSign} label="Monthly revenue recovered" value={`$${r.revenueRecovered.toLocaleString()}`} sub={`${r.noShowSaved} no-shows prevented`} />
            <Stat icon={TrendingDown} label="Wait time reduced by" value={`${r.waitReducedMin} min`} sub="vs. industry baseline" />
            <Stat icon={Clock} label="Staff hours saved / month" value={`${r.hoursSaved.toLocaleString()} hrs`} sub={`Across ${r.totalAppt.toLocaleString()} appointments`} />
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Estimated ROI</div>
              <div className="mt-1 text-4xl font-bold text-primary">{r.roi.toLocaleString()}%</div>
              <p className="mt-1 text-sm text-muted-foreground">Vs. our $149/mo Professional plan.</p>
              <Link to="/contact-sales"><Button className="mt-4 rounded-full">Get a tailored quote</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs text-muted-foreground">{label}</Label><div className="mt-1.5">{children}</div></div>;
}
function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}