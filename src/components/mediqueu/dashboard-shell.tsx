import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarPlus, ListOrdered, Settings, BarChart3,
  Bell, Search, Moon, Sun, LogOut, Menu, X,
  ShieldCheck, Building2, ScrollText, CreditCard, KeyRound, FileText,
} from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import type { Tables } from "@/integrations/supabase/types";
import { CommandPalette } from "./command-palette";
import { RouteProgress } from "./route-progress";
import { OrgSwitcher } from "./org-switcher";
import { TrialBanner } from "./trial-banner";

type Notif = Tables<"notifications">;

type NavItem = { to: string; label: string; icon: any };

const navByRole: Record<string, NavItem[]> = {
  patient: [
    { to: "/patient", label: "Overview", icon: LayoutDashboard },
    { to: "/book", label: "Book Appointment", icon: CalendarPlus },
    { to: "/queue", label: "Live Queue", icon: ListOrdered },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  receptionist: [
    { to: "/reception", label: "Front Desk", icon: LayoutDashboard },
    { to: "/queue", label: "Queue", icon: ListOrdered },
    { to: "/book", label: "New Booking", icon: CalendarPlus },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  doctor: [
    { to: "/doctor", label: "My Day", icon: LayoutDashboard },
    { to: "/queue", label: "Patient Queue", icon: ListOrdered },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/reports", label: "Reports", icon: FileText },
    { to: "/queue", label: "Queue Monitor", icon: ListOrdered },
    { to: "/team", label: "Team & SMS", icon: ShieldCheck },
    { to: "/organization", label: "Organization", icon: Building2 },
    { to: "/permissions", label: "Permissions", icon: ShieldCheck },
    { to: "/billing", label: "Billing", icon: CreditCard },
    { to: "/audit", label: "Audit log", icon: ScrollText },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/security", label: "Security", icon: KeyRound },
    { to: "/settings", label: "Clinic Settings", icon: Settings },
  ],
};

export function DashboardShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, role: authRole, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { rows: notifs } = useRealtimeTable<Notif>("notifications", {
    filter: user ? { column: "user_id", value: user.id } : null,
    orderBy: { column: "created_at", ascending: false },
    enabled: !!user,
  });
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // First-run: send to onboarding when profile is incomplete or admin has no clinic.
  useEffect(() => {
    if (loading || !user) return;
    const seen = (() => { try { return localStorage.getItem(`mq_onboarded_${user.id}`) === "1"; } catch { return false; } })();
    const needsName = !profile?.full_name;
    const adminNeedsClinic = authRole === "admin" && !profile?.clinic_id;
    if (!seen && (needsName || adminNeedsClinic) && path !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [loading, user, profile, authRole, path, navigate]);

  // ⌘K / Ctrl+K opens command palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const role = authRole ?? "patient";
  const name = profile?.full_name ?? user?.email ?? "Guest";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const items = navByRole[role] ?? navByRole.patient;
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const toggleTheme = () => setDark((d) => !d);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RouteProgress />
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <div className="px-3">
          <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {role} workspace
          </div>
          <nav className="space-y-1">
            {items.map((it) => {
              const active = path === it.to;
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  )}>
                  <Icon className={cn("h-4 w-4", active && "text-primary")} />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-4 left-3 right-3 rounded-xl border border-sidebar-border bg-card p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs capitalize text-muted-foreground">{role}</div>
            </div>
            <button onClick={handleSignOut}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            className="lg:hidden rounded-md p-2 hover:bg-muted"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <OrgSwitcher />
          <button
            onClick={() => setPaletteOpen(true)}
            className="group relative hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4" />
            <span>Search patients, doctors, or jump…</span>
            <kbd className="ml-auto hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium md:inline-flex">
              ⌘K
            </kbd>
          </button>
          <div className="flex-1 sm:hidden" />
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unread > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{unread}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifs.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</div>
              )}
              {notifs.slice(0, 8).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5">
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full" aria-label="Account menu">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary-soft text-primary text-xs">{initials}</AvatarFallback></Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <TrialBanner />
          <div key={path} className="mb-6 animate-fade-up">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div key={`${path}-body`} className="animate-fade-up delay-75">{children}</div>
        </main>
      </div>

      {open && <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} />}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onToggleTheme={toggleTheme} />
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 card-elevated transition-all duration-300 hover:-translate-y-0.5 hover:card-glow">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-80 opacity-50" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
          {trend && <div className="mt-1 text-xs text-success">{trend}</div>}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-info/15 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
