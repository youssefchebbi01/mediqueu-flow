import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, CalendarCheck, Clock, Bell, Users, ShieldCheck, BarChart3,
  Stethoscope, CheckCircle2, Star, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/mediqueu/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediQueu — Smart Clinic Queue & Appointment Platform" },
      { name: "description", content: "Reduce waiting times, simplify scheduling, and improve patient satisfaction with smart digital queue management." },
      { property: "og:title", content: "MediQueu — Reduce Waiting. Improve Care." },
      { property: "og:description", content: "Smart queue + appointments for clinics, dentists, labs and small hospitals." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: CalendarCheck, title: "Smart Scheduling", body: "Book by specialty, doctor and live availability — no double bookings." },
  { icon: Clock, title: "Live Queue Tracking", body: "Patients see their position and an honest ETA, updated in real time." },
  { icon: Bell, title: "Auto Reminders", body: "SMS & email-style notifications for confirmations, delays and turn-up." },
  { icon: Users, title: "Roles Built-in", body: "Patient, Reception, Doctor and Admin — each with the right tools." },
  { icon: ShieldCheck, title: "Secure by Design", body: "Role-based access, audit trails and patient data isolation." },
  { icon: BarChart3, title: "Clinic Analytics", body: "Wait times, peak hours, doctor performance and cancellations." },
];

const testimonials = [
  { name: "Dr. Hala Mansour", role: "Clinic Director, Cairo", quote: "Average wait time dropped from 38 to 12 minutes in the first month. Patients actually thank us now." },
  { name: "Marc Dubois", role: "Dental Practice Owner", quote: "Reception runs the whole day from one screen. The walk-in handling is a game changer." },
  { name: "Sofia Chen", role: "Pediatrician", quote: "I see my schedule, notes and the queue in one place. Less admin, more care." },
];

const tiers = [
  { name: "Starter", price: "$0", tag: "Solo practitioner", features: ["1 doctor", "Up to 50 appts/mo", "Live queue", "Email reminders"], cta: "Start free" },
  { name: "Clinic", price: "$49", tag: "Most popular", features: ["Up to 10 doctors", "Unlimited appts", "SMS reminders", "Analytics dashboard", "Walk-in management"], cta: "Start trial", featured: true },
  { name: "Hospital", price: "Custom", tag: "Multi-department", features: ["Unlimited doctors", "Multi-location", "Advanced analytics", "API & SSO", "Priority support"], cta: "Contact sales" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/login"><Button size="sm" className="rounded-full">Book a Demo</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-soft opacity-70" />
        <div className="absolute inset-0 -z-10 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Trusted by 240+ clinics across 18 countries
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Reduce Waiting.<br />
              <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">Improve Care.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Reduce waiting times, simplify scheduling, and improve patient satisfaction with smart digital queue management.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login"><Button size="lg" className="rounded-full px-7">Book a Demo<ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <a href="#features"><Button size="lg" variant="outline" className="rounded-full px-7">See features</Button></a>
            </div>
          </div>

          {/* Hero card preview */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="rounded-3xl border border-border bg-card p-3 card-elevated">
              <div className="rounded-2xl bg-background p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <PreviewStat icon={Clock} label="Avg. wait time" value="12 min" hint="−68% vs. last month" />
                  <PreviewStat icon={CalendarCheck} label="Today's bookings" value="87" hint="6 walk-ins added" />
                  <PreviewStat icon={Activity} label="In consultation" value="4" hint="3 doctors active" />
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    { t: "A-021", n: "Maria Lopez", d: "Dr. Hassan", s: "Active", c: "bg-primary text-primary-foreground" },
                    { t: "A-022", n: "Ahmed Saleh", d: "Dr. Hassan", s: "Waiting · 8m", c: "bg-warning/15 text-warning-foreground" },
                    { t: "A-023", n: "Lina Park", d: "Dr. Dubois", s: "Waiting · 15m", c: "bg-warning/15 text-warning-foreground" },
                  ].map((r) => (
                    <div key={r.t} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">{r.t}</span>
                        <div className="text-sm font-medium">{r.n}</div>
                      </div>
                      <div className="hidden text-sm text-muted-foreground sm:block">{r.d}</div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${r.c}`}>{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Platform</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">Everything your clinic needs, nothing it doesn't</h2>
            <p className="mt-3 text-muted-foreground">Built with receptionists, doctors and patients — not just IT.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:card-elevated">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">From booking to consultation in three steps</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Patient books", d: "Choose specialty, doctor and slot from any device." },
              { n: "02", t: "Reception confirms", d: "Walk-ins, reschedules and the live queue from one screen." },
              { n: "03", t: "Doctor consults", d: "Notes, files and the next patient — always one click away." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border p-6">
                <div className="font-mono text-sm text-primary">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-y border-border bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Loved by care teams</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">Real clinics. Real results.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground">"{t.quote}"</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {t.name.split(" ").map((n) => n[0]).slice(0,2).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</div>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">Simple plans that scale with you</h2>
            <p className="mt-3 text-muted-foreground">14-day trial. No credit card. Cancel anytime.</p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {tiers.map((p) => (
              <div key={p.name} className={`relative rounded-3xl border p-7 ${p.featured ? "border-primary bg-card card-elevated" : "border-border bg-card"}`}>
                {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">{p.tag}</div>}
                <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  {p.price !== "Custom" && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                {!p.featured && <div className="mt-1 text-xs text-muted-foreground">{p.tag}</div>}
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />{f}</li>
                  ))}
                </ul>
                <Link to="/login" className="mt-7 block"><Button className="w-full rounded-full" variant={p.featured ? "default" : "outline"}>{p.cta}</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground sm:p-16">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative">
              <Stethoscope className="h-9 w-9 opacity-80" />
              <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Give your clinic its time back.
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/80">
                See MediQueu live with your team. We'll set up a demo clinic with your specialties in under 10 minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login"><Button size="lg" variant="secondary" className="rounded-full px-7">Book a Demo<ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
                <Link to="/login"><Button size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10">Sign in</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} MediQueu. Built for care teams.</div>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-success">{hint}</div>
    </div>
  );
}
