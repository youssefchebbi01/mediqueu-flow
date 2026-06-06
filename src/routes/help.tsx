import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Book, MessageCircle, Rocket, Settings, CreditCard, ShieldCheck, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help center — MediQueu" },
      { name: "description", content: "Guides, FAQs and answers for setting up MediQueu in your clinic." },
    ],
  }),
  component: HelpCenter,
});

const SECTIONS = [
  { icon: Rocket,      title: "Getting started",   desc: "Set up your clinic in under 10 minutes.",  count: 8 },
  { icon: Settings,    title: "Clinic operations", desc: "Queues, scheduling, walk-ins, no-shows.",  count: 14 },
  { icon: CreditCard,  title: "Billing & plans",   desc: "Trials, plan upgrades, invoices.",          count: 6 },
  { icon: ShieldCheck, title: "Security & HIPAA",  desc: "Access controls, audit logs, compliance.",  count: 9 },
  { icon: Book,        title: "API & integrations",desc: "Webhooks, REST API, calendar sync.",        count: 11 },
  { icon: MessageCircle,title:"Support & contact", desc: "Reach our team and SLAs.",                  count: 3 },
];

const FAQS = [
  { q: "How do I invite my team?", a: "Open Organization → Members, click Invite, enter their email and role. They'll get a one-time link valid for 7 days." },
  { q: "Can patients book without an account?", a: "Yes. Public booking pages create a lightweight patient profile automatically; they can claim it later." },
  { q: "Is MediQueu HIPAA-compliant?", a: "We're HIPAA-aware with audit logs, encryption at rest and in transit, granular RBAC, and a BAA available on Professional and Enterprise plans." },
  { q: "How does the trial work?", a: "Every workspace gets 14 days of Professional features. No card required. You can upgrade or downgrade anytime." },
  { q: "Can I import existing patients?", a: "Yes — Import & Export supports CSV uploads for patients, staff, and appointments." },
  { q: "Do you support multiple locations?", a: "Professional supports up to 3 locations; Enterprise is unlimited with cross-location reporting." },
  { q: "Which payment methods are accepted?", a: "Major credit cards, ACH (US), and SEPA (EU) on Enterprise. Invoicing available on annual plans." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from Billing → Manage. You keep access until the end of the period." },
];

function HelpCenter() {
  const [q, setQ] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-display text-lg font-semibold">MediQueu</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link to="/contact-sales" className="text-muted-foreground hover:text-foreground">Contact</Link>
            <Link to="/login"><Button size="sm" className="rounded-full">Sign in</Button></Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight">How can we help?</h1>
        <p className="mt-3 text-muted-foreground">Search the documentation, browse guides, or reach our team.</p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search for ‘invite staff’, ‘cancel’, ‘API key’…" className="h-12 rounded-full pl-11" />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-info/15 text-primary ring-1 ring-primary/15">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-3 text-xs text-muted-foreground">{s.count} articles</div>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <h2 className="mb-4 text-xl font-semibold">Frequently asked</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {filtered.map((f, i) => (
            <button key={f.q} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="block w-full px-5 py-4 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openFaq === i && "rotate-180")} />
              </div>
              {openFaq === i && <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No articles match “{q}”.</div>}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-info/5 p-6 text-center">
          <div className="font-semibold">Still need help?</div>
          <p className="mt-1 text-sm text-muted-foreground">Our team replies in under 4 business hours.</p>
          <Link to="/contact-sales"><Button className="mt-4 rounded-full">Contact support</Button></Link>
        </div>
      </section>
    </div>
  );
}