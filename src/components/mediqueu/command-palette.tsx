import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, CalendarPlus, ListOrdered, Settings, BarChart3,
  Stethoscope, ShieldCheck, User, LogOut, Sun, Moon, Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Hit = { id: string; label: string; sub?: string; to: string };

export function CommandPalette({
  open, onOpenChange, onToggleTheme,
}: { open: boolean; onOpenChange: (v: boolean) => void; onToggleTheme: () => void }) {
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const [{ data: people }, { data: appts }, { data: docs }] = await Promise.all([
        supabase.from("profiles").select("user_id,full_name,phone").ilike("full_name", `%${term}%`).limit(5),
        supabase.from("appointments").select("id,doctor_name,specialty,scheduled_at").ilike("doctor_name", `%${term}%`).limit(5),
        supabase.from("doctors_directory").select("id,name,specialty").ilike("name", `%${term}%`).limit(5),
      ]);
      if (cancelled) return;
      const out: Hit[] = [];
      (people ?? []).forEach((p: any) => p.full_name && out.push({
        id: `p-${p.user_id}`, label: p.full_name, sub: p.phone ?? "Patient", to: "/reception",
      }));
      (docs ?? []).forEach((d: any) => out.push({
        id: `d-${d.id}`, label: `Dr. ${d.name}`, sub: d.specialty, to: "/book",
      }));
      (appts ?? []).forEach((a: any) => out.push({
        id: `a-${a.id}`, label: `${a.doctor_name} · ${a.specialty}`,
        sub: new Date(a.scheduled_at).toLocaleString(), to: "/queue",
      }));
      setHits(out);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const go = (to: string) => { onOpenChange(false); navigate({ to: to as any }); };

  const nav: { label: string; to: string; icon: any; roles?: string[] }[] = [
    { label: "Overview", to: "/patient", icon: LayoutDashboard, roles: ["patient"] },
    { label: "Book appointment", to: "/book", icon: CalendarPlus, roles: ["patient", "receptionist"] },
    { label: "Front desk", to: "/reception", icon: LayoutDashboard, roles: ["receptionist"] },
    { label: "My day", to: "/doctor", icon: Stethoscope, roles: ["doctor"] },
    { label: "Admin overview", to: "/admin", icon: ShieldCheck, roles: ["admin"] },
    { label: "Analytics", to: "/analytics", icon: BarChart3, roles: ["admin"] },
    { label: "Live queue", to: "/queue", icon: ListOrdered },
    { label: "Team & SMS", to: "/team", icon: ShieldCheck, roles: ["admin"] },
    { label: "Settings", to: "/settings", icon: Settings },
  ].filter((n) => !n.roles || (role && n.roles.includes(role)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search patients, doctors, or jump to a page…" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>{q.length < 2 ? "Type to search…" : "No results."}</CommandEmpty>
        {hits.length > 0 && (
          <CommandGroup heading="Results">
            {hits.map((h) => (
              <CommandItem key={h.id} value={h.label} onSelect={() => go(h.to)}>
                <Search className="text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{h.label}</span>
                  {h.sub && <span className="text-xs text-muted-foreground">{h.sub}</span>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {nav.map((n) => (
            <CommandItem key={n.to} value={`go ${n.label}`} onSelect={() => go(n.to)}>
              <n.icon /><span>{n.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="toggle theme" onSelect={() => { onToggleTheme(); onOpenChange(false); }}>
            <Sun /><span>Toggle theme</span>
          </CommandItem>
          <CommandItem value="profile" onSelect={() => go("/settings")}>
            <User /><span>Profile & preferences</span>
          </CommandItem>
          <CommandItem value="sign out" onSelect={async () => { onOpenChange(false); await signOut(); navigate({ to: "/login" }); }}>
            <LogOut /><span>Sign out</span>
          </CommandItem>
          <CommandItem value="dark" onSelect={() => { document.documentElement.classList.add("dark"); onOpenChange(false); }}>
            <Moon /><span>Switch to dark</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}