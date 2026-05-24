import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, CalendarCheck, Clock, Bell, Users, ShieldCheck, BarChart3,
  Stethoscope, CheckCircle2, Star, Activity, Sparkles, Zap, Globe,
  ChevronDown, MessageSquare, LineChart,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediQueu — Smart Clinic Queue & Appointment Platform" },
      { name: "description", content: "Reduce waiting times, simplify scheduling, and improve patient satisfaction with smart digital queue management for modern clinics." },
      { property: "og:title", content: "MediQueu — Reduce Waiting. Improve Care." },
      { property: "og:description", content: "Premium queue + appointments platform for clinics, dentists, labs and small hospitals." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Landing,
});

// Locked tokens
const ink = "#0c2340";       // deep navy
const ocean = "#1a4a6e";     // ocean
const teal = "#2d8a9e";      // primary accent
const aqua = "#5cbdb9";      // bright accent

const features = [
  { icon: CalendarCheck, title: "Smart Scheduling", body: "Specialty-aware booking with live doctor availability. No double-bookings, ever.", span: "md:col-span-3" },
  { icon: Clock, title: "Live Queue Tracking", body: "Patients see their position and an honest ETA on any device, updated in real time.", span: "md:col-span-3", dark: true },
  { icon: Bell, title: "Auto Reminders", body: "SMS & email pings at the right moment — confirmations, delays, your turn.", span: "md:col-span-2" },
  { icon: Users, title: "Role-Based Access", body: "Patient, Reception, Doctor, Admin — tailored tools and permissions for each.", span: "md:col-span-2" },
  { icon: LineChart, title: "Clinic Analytics", body: "Peak hours, doctor load, cancellations, NPS — clarity for every decision.", span: "md:col-span-2" },
];

const workflow = [
  { n: "01", t: "Patient books", d: "Choose specialty, doctor and slot from any device — in under 60 seconds.", icon: CalendarCheck },
  { n: "02", t: "Reception confirms", d: "Walk-ins, reschedules and the live queue from one calm screen.", icon: Users },
  { n: "03", t: "Doctor consults", d: "Notes, files and the next patient — always one click away.", icon: Stethoscope },
];

const testimonials = [
  { name: "Dr. Hala Mansour", role: "Clinic Director · Cairo", quote: "Average wait dropped from 38 to 12 minutes in the first month. Patients actually thank us now." },
  { name: "Marc Dubois", role: "Dental Practice Owner · Lyon", quote: "Reception runs the whole day from one screen. The walk-in handling is a game changer." },
  { name: "Dr. Sofia Chen", role: "Pediatrician · Singapore", quote: "I see my schedule, notes and the queue in one place. Less admin, more care." },
];

const tiers = [
  { name: "Starter", price: "$0", tag: "Solo practitioner", features: ["1 doctor", "Up to 50 appts/mo", "Live queue", "Email reminders"], cta: "Start free" },
  { name: "Clinic", price: "$49", tag: "Most popular", features: ["Up to 10 doctors", "Unlimited appts", "SMS reminders", "Analytics dashboard", "Walk-in management"], cta: "Start 14-day trial", featured: true },
  { name: "Hospital", price: "Custom", tag: "Multi-department", features: ["Unlimited doctors", "Multi-location", "Advanced analytics", "API & SSO", "Priority support"], cta: "Talk to sales" },
];

const faqs = [
  { q: "Is MediQueu HIPAA-compliant?", a: "Yes. We're HIPAA-aware and SOC 2 ready, with end-to-end encryption, audit trails and role-based access controls on every record." },
  { q: "How long does setup take?", a: "Most clinics are live in under 10 minutes. We pre-configure your specialties, import doctors, and walk you through the first day." },
  { q: "Do patients need to install an app?", a: "No. Patients book and track their queue position from a browser link sent by SMS or email — no app store required." },
  { q: "Can I migrate from another system?", a: "Yes. We support CSV imports for patients and appointments, and we'll personally help with the cut-over for Clinic and Hospital plans." },
  { q: "What if I have multiple locations?", a: "The Hospital plan is built for multi-location and multi-department clinics, with unified analytics and per-site staff scoping." },
];

function Landing() {
  return (
    <div
      className="min-h-screen w-full text-white antialiased selection:bg-[#5cbdb9] selection:text-[#0c2340]"
      style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif", backgroundColor: ink }}
    >
      <Nav />
      <Hero />
      <TrustedBy />
      <Features />
      <Workflow />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <SiteFooter />
    </div>
  );
}

/* ---------- Nav ---------- */
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl" style={{ backgroundColor: "rgba(12,35,64,0.72)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg shadow-[0_0_24px_rgba(92,189,185,0.35)]" style={{ backgroundColor: teal }}>
            <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-white" style={headingFont}>MediQueu</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-9 text-sm font-medium text-white/70 md:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
          <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          <a href="#testimonials" className="transition-colors hover:text-white">Customers</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline-flex px-3 py-2">Sign in</Link>
          <Link to="/login" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0c2340] shadow-[0_8px_30px_rgba(92,189,185,0.25)] transition-all hover:scale-[1.02] hover:bg-[#5cbdb9] active:scale-95">
            Book a Demo <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Atmospheric glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-20%] h-[640px] w-[1000px] -translate-x-1/2 rounded-full opacity-60 blur-[140px]" style={{ background: `radial-gradient(circle, ${teal}55, transparent 70%)` }} />
        <div className="absolute left-[10%] top-[30%] h-[400px] w-[400px] rounded-full opacity-30 blur-[120px]" style={{ background: `radial-gradient(circle, ${aqua}, transparent 70%)` }} />
        <div className="absolute right-[5%] top-[10%] h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]" style={{ background: `radial-gradient(circle, ${ocean}, transparent 70%)` }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ backgroundColor: aqua }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: aqua }} />
            </span>
            Trusted by 240+ clinics across 18 countries
          </div>

          <h1 className="mt-7 text-balance text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl" style={headingFont}>
            Reduce Waiting.
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(120deg, ${aqua}, ${teal})` }}>
              Improve Care.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-white/65 sm:text-lg">
            The intelligent queue and scheduling platform for modern healthcare teams. Cut wait times, delight patients, and give your staff their day back.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(45,138,158,0.45)] transition-all hover:scale-[1.02] active:scale-95" style={{ backgroundColor: teal }}>
              Book a Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/10">
              See how it works
            </a>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="mx-auto mt-16 max-w-6xl animate-fade-up delay-300 sm:mt-20">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-[1.75rem] opacity-60 blur-2xl" style={{ background: `linear-gradient(135deg, ${teal}, ${aqua}, transparent)` }} />
      <div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.1rem] border border-white/5" style={{ backgroundColor: "#0a1c33" }}>
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-5 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/40 ring-1 ring-red-400/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/40 ring-1 ring-yellow-400/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/40 ring-1 ring-green-400/40" />
            </div>
            <div className="hidden text-[11px] font-medium text-white/40 sm:block">Live Patient Dashboard — MediQueu</div>
            <div className="text-[10px] font-medium text-white/40">v4.2</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6">
            <StatTile label="Avg. wait time" value="12 min" hint="−68% vs last month" color={aqua} />
            <StatTile label="Today's bookings" value="87" hint="6 walk-ins added" color={teal} />
            <StatTile label="In consultation" value="4" hint="3 doctors online" />
          </div>

          {/* Queue rows */}
          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="overflow-hidden rounded-xl border border-white/5">
              <div className="hidden grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/40 sm:grid">
                <div className="col-span-2">Queue</div>
                <div className="col-span-4">Patient</div>
                <div className="col-span-3">Doctor</div>
                <div className="col-span-3 text-right">Status</div>
              </div>
              {[
                { t: "A-021", n: "Maria Lopez", d: "Dr. Hassan", s: "In session", tone: "active" as const },
                { t: "A-022", n: "Ahmed Saleh", d: "Dr. Hassan", s: "Waiting · 8m", tone: "wait" as const },
                { t: "A-023", n: "Lina Park", d: "Dr. Dubois", s: "Waiting · 15m", tone: "wait" as const },
                { t: "A-024", n: "Jonas Weber", d: "Dr. Chen", s: "Booked · 14:30", tone: "scheduled" as const },
              ].map((r) => (
                <div key={r.t} className="grid grid-cols-12 items-center gap-4 border-b border-white/5 px-4 py-3 text-sm last:border-0 transition-colors hover:bg-white/[0.03]">
                  <div className="col-span-2 font-mono text-[11px] text-white/40">{r.t}</div>
                  <div className="col-span-7 font-medium text-white sm:col-span-4">{r.n}</div>
                  <div className="col-span-3 hidden text-white/55 sm:block">{r.d}</div>
                  <div className="col-span-3 flex justify-end">
                    <StatusPill tone={r.tone}>{r.s}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification card */}
      <div className="absolute -bottom-6 -right-2 hidden w-64 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl sm:block animate-float">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${aqua}22` }}>
            <Bell className="h-4 w-4" style={{ color: aqua }} />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Your turn in ~6 minutes</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-white/55">Please head to room 3. Dr. Hassan will see you shortly.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, color }: { label: string; value: string; hint: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: color ?? "rgba(255,255,255,0.4)" }}>{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl" style={headingFont}>{value}</div>
      <div className="mt-1 text-[11px] text-white/50">{hint}</div>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "active" | "wait" | "scheduled"; children: React.ReactNode }) {
  const styles =
    tone === "active"
      ? { color: aqua, bg: `${aqua}22`, ring: `${aqua}44` }
      : tone === "wait"
      ? { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", ring: "rgba(251,191,36,0.3)" }
      : { color: "rgba(255,255,255,0.7)", bg: "rgba(255,255,255,0.06)", ring: "rgba(255,255,255,0.12)" };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset" style={{ color: styles.color, backgroundColor: styles.bg, boxShadow: `inset 0 0 0 1px ${styles.ring}` }}>
      {children}
    </span>
  );
}

/* ---------- Trusted by ---------- */
function TrustedBy() {
  const logos = ["NorthCare", "CliniqPlus", "Cedars Lab", "HealthHub", "PulseMD", "VitaClinic"];
  return (
    <section className="border-y border-white/5 bg-white/[0.015] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          Powering modern clinics worldwide
        </p>
        <div className="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((name) => (
            <div key={name} className="flex items-center justify-center gap-2 opacity-50 transition-opacity hover:opacity-100">
              <div className="grid h-6 w-6 place-items-center rounded-md bg-white/10">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white/70" style={headingFont}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Features (bento) ---------- */
function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform"
          title="Everything your clinic needs, nothing it doesn't"
          sub="Built with receptionists, doctors and patients — not just IT teams."
        />
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`group animate-fade-up rounded-3xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${f.span} ${
                f.dark ? "relative overflow-hidden" : "bg-white/[0.025] hover:bg-white/[0.04]"
              }`}
            >
              {f.dark && (
                <>
                  <div className="absolute inset-0 -z-10" style={{ background: `linear-gradient(135deg, ${ocean}, ${ink} 70%)` }} />
                  <div className="absolute -bottom-16 -right-16 -z-10 h-48 w-48 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: `${teal}55` }} />
                </>
              )}
              <div
                className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: f.dark ? "rgba(92,189,185,0.18)" : `${teal}18`, color: f.dark ? aqua : teal, boxShadow: `inset 0 0 0 1px ${f.dark ? "rgba(92,189,185,0.25)" : `${teal}30`}` }}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-white" style={headingFont}>{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Workflow ---------- */
function Workflow() {
  return (
    <section id="workflow" className="relative border-y border-white/5 bg-white/[0.015] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From booking to consultation, in three calm steps"
          sub="The same workflow your team already follows — finally, with software that gets out of the way."
        />

        <div className="relative mt-16 grid gap-5 md:grid-cols-3">
          {/* Connector line */}
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px md:block" style={{ background: `linear-gradient(to right, transparent, ${teal}55, transparent)` }} />
          {workflow.map((s, i) => (
            <div key={s.n} style={{ animationDelay: `${i * 100}ms` }} className="relative animate-fade-up rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition-colors hover:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <s.icon className="h-5 w-5" style={{ color: aqua }} />
                </div>
                <span className="font-mono text-xs font-medium" style={{ color: aqua }}>{s.n}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-white" style={headingFont}>{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Loved by care teams"
          title="Real clinics. Real results."
          sub="From solo practices to multi-location hospitals — teams ship better care with MediQueu."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <figure key={t.name} style={{ animationDelay: `${i * 80}ms` }} className="animate-fade-up rounded-2xl border border-white/5 bg-white/[0.025] p-7 transition-colors hover:bg-white/[0.04]">
              <div className="flex gap-0.5" style={{ color: aqua }}>
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-5 text-[15px] leading-relaxed text-white/85">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full text-xs font-semibold" style={{ backgroundColor: `${teal}22`, color: aqua }}>
                  {t.name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/50">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function Pricing() {
  return (
    <section id="pricing" className="relative border-y border-white/5 bg-white/[0.015] py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]" style={{ background: `radial-gradient(circle, ${teal}, transparent 70%)` }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that scale with you"
          sub="14-day free trial. No credit card. Cancel anytime."
        />
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-7 transition-all ${
                p.featured
                  ? "border-2 shadow-[0_30px_80px_-20px_rgba(45,138,158,0.45)] lg:scale-[1.02]"
                  : "border border-white/8 bg-white/[0.025] hover:bg-white/[0.04]"
              }`}
              style={p.featured ? { borderColor: teal, backgroundColor: "rgba(26,74,110,0.4)" } : undefined}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0c2340]" style={{ backgroundColor: aqua }}>
                  {p.tag}
                </div>
              )}
              <div className="text-sm font-semibold text-white/70">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`text-5xl font-semibold tracking-tight ${p.featured ? "text-white" : "text-white"}`} style={headingFont}>{p.price}</span>
                {p.price !== "Custom" && <span className="text-sm text-white/50">/mo</span>}
              </div>
              {!p.featured && <div className="mt-1 text-xs text-white/45">{p.tag}</div>}
              <ul className="mt-7 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: aqua }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-8 block">
                <button
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                    p.featured
                      ? "text-white shadow-lg hover:opacity-90"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  style={p.featured ? { backgroundColor: teal, boxShadow: `0 10px 30px ${teal}55` } : undefined}
                >
                  {p.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-white/40">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> HIPAA-aware</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>SOC 2 ready</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>ISO 27001</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> 99.99% uptime</span>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          sub="Can't find what you need? Our team replies within a few hours."
        />
        <div className="mt-14 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-white" style={headingFont}>{f.q}</div>
                  <div
                    className="grid overflow-hidden text-sm leading-relaxed text-white/65 transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", marginTop: isOpen ? "0.5rem" : 0 }}
                  >
                    <div className="min-h-0">{f.a}</div>
                  </div>
                </div>
                <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180 text-white" : ""}`} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 p-10 sm:p-16" style={{ background: `linear-gradient(135deg, ${ocean}, ${ink} 60%, #061827)` }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${teal}88, transparent 70%)` }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-[100px]" style={{ background: `radial-gradient(circle, ${aqua}55, transparent 70%)` }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" style={{ color: aqua }} />
            10-minute setup, no credit card
          </div>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl" style={headingFont}>
            Give your clinic <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(120deg, ${aqua}, white)` }}>its time back.</span>
          </h2>
          <p className="mt-4 max-w-lg text-white/65">
            We'll spin up a demo clinic with your specialties and walk your team through the live queue in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0c2340] shadow-xl transition-all hover:scale-[1.02] hover:bg-[#5cbdb9] active:scale-95">
              Book a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/10">
              <MessageSquare className="h-4 w-4" /> Talk to sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg" style={{ backgroundColor: teal }}>
            <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white" style={headingFont}>MediQueu</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/45">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Security</a>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-white"><Globe className="h-3.5 w-3.5" /> English</a>
        </div>
        <div className="text-xs text-white/40">© {new Date().getFullYear()} MediQueu. Built for care teams.</div>
      </div>
    </footer>
  );
}

/* ---------- Helpers ---------- */
const headingFont: React.CSSProperties = {
  fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  letterSpacing: "-0.02em",
};

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: aqua }}>{eyebrow}</div>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl" style={headingFont}>{title}</h2>
      {sub && <p className="mt-4 text-balance text-white/60">{sub}</p>}
    </div>
  );
}