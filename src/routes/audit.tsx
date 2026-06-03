import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/audit")({ component: AuditPage });

type Log = {
  id: string; created_at: string; action: string; entity_type: string | null;
  entity_id: string | null; actor_id: string | null; metadata: any;
};

function AuditPage() {
  const { org } = useCurrentOrg();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [action, setAction] = useState<string>("all");
  const [actorMap, setActorMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!org) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("audit_logs")
        .select("id, created_at, action, entity_type, entity_id, actor_id, metadata")
        .eq("org_id", org.id).order("created_at", { ascending: false }).limit(200);
      const ids = Array.from(new Set((data ?? []).map(l => l.actor_id).filter(Boolean) as string[]));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
        : { data: [] as any[] };
      if (cancelled) return;
      setActorMap(new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name ?? "Unknown"])));
      setLogs((data ?? []) as any);
      setLoading(false);
    })();
    // realtime
    const channel = supabase.channel(`audit-${org.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs", filter: `org_id=eq.${org.id}` },
        (payload) => setLogs(prev => [payload.new as Log, ...prev].slice(0, 200)))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [org?.id]);

  const actions = useMemo(() => Array.from(new Set(logs.map(l => l.action))).sort(), [logs]);

  const filtered = useMemo(() => logs.filter(l => {
    if (action !== "all" && l.action !== action) return false;
    if (q) {
      const hay = `${l.action} ${l.entity_type ?? ""} ${l.entity_id ?? ""} ${JSON.stringify(l.metadata ?? {})} ${actorMap.get(l.actor_id ?? "") ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [logs, q, action, actorMap]);

  if (!org) return <DashboardShell title="Audit log"><EmptyState icon={ScrollText} title="No workspace" /></DashboardShell>;

  return (
    <DashboardShell title="Audit log" subtitle="Every meaningful action across your workspace">
      <Card className="mb-4 p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search action, actor, entity…" className="pl-8" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {loading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
      : filtered.length === 0 ? <EmptyState icon={ScrollText} title="No audit events" description="Activity will appear here as your team works." />
      : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(l => (
              <div key={l.id} className="grid grid-cols-1 gap-1 p-3 md:grid-cols-[180px_1fr_auto] md:items-center">
                <div className="text-xs text-muted-foreground tabular-nums">{new Date(l.created_at).toLocaleString()}</div>
                <div>
                  <div className="text-sm">
                    <span className="font-medium">{actorMap.get(l.actor_id ?? "") ?? "System"}</span>{" "}
                    <span className="text-muted-foreground">performed</span>{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{l.action}</code>
                    {l.entity_type && <span className="text-muted-foreground"> on {l.entity_type}</span>}
                  </div>
                  {l.metadata && Object.keys(l.metadata).length > 0 && (
                    <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                      {Object.entries(l.metadata).map(([k,v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px]">{l.entity_type ?? "—"}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}