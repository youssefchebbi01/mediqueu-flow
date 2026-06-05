import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useAuth, useRequireRole } from "@/hooks/use-auth";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

type Notif = Tables<"notifications">;

const CATEGORIES = ["appointment","queue","billing","system"] as const;

function NotificationsPage() {
  const __ok = useRequireRole(["patient", "receptionist", "doctor", "admin"]);
  if (!__ok) return null;
  const { user } = useAuth();
  const { rows: notifs } = useRealtimeTable<Notif>("notifications", {
    filter: user ? { column: "user_id", value: user.id } : null,
    orderBy: { column: "created_at", ascending: false }, enabled: !!user,
  });

  const [q, setQ] = useState("");

  const unread = useMemo(() => notifs.filter(n => !n.read), [notifs]);
  const grouped = useMemo(() => {
    const m = new Map<string, Notif[]>();
    for (const c of CATEGORIES) m.set(c, []);
    for (const n of notifs) {
      const c = (n.category ?? "system") as string;
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(n);
    }
    return m;
  }, [notifs]);

  function filterList(list: Notif[]) {
    if (!q) return list;
    return list.filter(n => `${n.title} ${n.body ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  }

  async function markRead(n: Notif) {
    await supabase.from("notifications").update({ read: true }).eq("id", n.id);
  }
  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }

  return (
    <DashboardShell title="Notifications" subtitle="Inbox for your workspace activity">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notifications…" className="pl-8" />
        </div>
        <Badge variant="secondary">{unread.length} unread</Badge>
        <Button variant="outline" size="sm" onClick={markAll} disabled={!unread.length}>
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />Mark all read
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifs.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
          {CATEGORIES.map(c => (
            <TabsTrigger key={c} value={c} className="capitalize">{c} ({grouped.get(c)?.length ?? 0})</TabsTrigger>
          ))}
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="all"><List items={filterList(notifs)} onClick={markRead} /></TabsContent>
        <TabsContent value="unread"><List items={filterList(unread)} onClick={markRead} /></TabsContent>
        {CATEGORIES.map(c => (
          <TabsContent key={c} value={c}><List items={filterList(grouped.get(c) ?? [])} onClick={markRead} /></TabsContent>
        ))}
        <TabsContent value="preferences"><Preferences /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function List({ items, onClick }: { items: Notif[]; onClick: (n: Notif) => void }) {
  if (items.length === 0) return <EmptyState icon={Bell} title="Nothing here yet" description="New activity will appear in real time." />;
  return (
    <Card className="overflow-hidden p-0">
      <div className="divide-y divide-border">
        {items.map(n => (
          <button key={n.id} onClick={() => onClick(n)}
            className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}>
            <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-muted-foreground/30"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{n.title}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
              {n.category && <Badge variant="outline" className="mt-2 text-[10px] capitalize">{n.category}</Badge>}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Preferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id);
      setPrefs(data ?? []);
    })();
  }, [user]);

  async function update(p: any, patch: any) {
    await supabase.from("notification_preferences").update(patch).eq("id", p.id);
    setPrefs((prev: any[]) => prev.map((x: any) => x.id === p.id ? { ...x, ...patch } : x));
  }

  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="p-3 text-left">Category</th><th className="p-3">Email</th><th className="p-3">SMS</th><th className="p-3">In-app</th></tr>
        </thead>
        <tbody>
          {prefs.map((p: any) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3 font-medium capitalize">{p.category}</td>
              <td className="p-3 text-center"><Switch checked={p.email_enabled} onCheckedChange={(v) => update(p, { email_enabled: v })} /></td>
              <td className="p-3 text-center"><Switch checked={p.sms_enabled} onCheckedChange={(v) => update(p, { sms_enabled: v })} /></td>
              <td className="p-3 text-center"><Switch checked={p.in_app_enabled} onCheckedChange={(v) => update(p, { in_app_enabled: v })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}