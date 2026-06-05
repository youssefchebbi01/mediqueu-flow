import { useRequireRole } from "@/hooks/use-auth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

export const Route = createFileRoute("/permissions")({ component: PermissionsPage });

type Role = "owner"|"admin"|"member";
type PermKey =
  | "appointments.create" | "appointments.cancel" | "appointments.reorder"
  | "queue.manage" | "consultation.complete" | "billing.manage"
  | "members.invite" | "members.remove" | "settings.update" | "audit.view"
  | "doctors.manage" | "locations.manage";

const PERMS: { key: PermKey; label: string; group: string }[] = [
  { key: "appointments.create",   label: "Create appointments",        group: "Appointments" },
  { key: "appointments.cancel",   label: "Cancel appointments",        group: "Appointments" },
  { key: "appointments.reorder",  label: "Reorder appointments",       group: "Appointments" },
  { key: "queue.manage",          label: "Manage live queue",          group: "Queue" },
  { key: "consultation.complete", label: "Complete consultations",     group: "Queue" },
  { key: "doctors.manage",        label: "Manage doctors directory",   group: "Clinic" },
  { key: "locations.manage",      label: "Manage locations",           group: "Clinic" },
  { key: "members.invite",        label: "Invite members",             group: "Team" },
  { key: "members.remove",        label: "Remove members",             group: "Team" },
  { key: "settings.update",       label: "Update org settings",        group: "Team" },
  { key: "billing.manage",        label: "Manage billing",             group: "Billing" },
  { key: "audit.view",            label: "View audit logs",            group: "Security" },
];

// Base role matrix — what each role can do by default
const BASE: Record<Role, Record<PermKey, boolean>> = {
  owner:  Object.fromEntries(PERMS.map(p => [p.key, true])) as any,
  admin:  Object.fromEntries(PERMS.map(p => [p.key, p.key !== "billing.manage"])) as any,
  member: Object.fromEntries(PERMS.map(p => [p.key,
    ["appointments.create","queue.manage"].includes(p.key)])) as any,
};

const TEMPLATES = [
  { name: "Receptionist",        role: "member" as Role,  extra: ["appointments.cancel","appointments.reorder"] },
  { name: "Senior Receptionist", role: "member" as Role,  extra: ["appointments.cancel","appointments.reorder","members.invite"] },
  { name: "Clinic Manager",      role: "admin" as Role,   extra: [] },
  { name: "Doctor",              role: "member" as Role,  extra: ["consultation.complete","queue.manage"] },
  { name: "Billing Manager",     role: "admin" as Role,   extra: ["billing.manage"] },
];

type Member = { id: string; user_id: string; role: Role; full_name: string | null };
type Override = { user_id: string; permission_key: string; allowed: boolean };

function PermissionsPage() {
  const __ok = useRequireRole(["admin"]);
  if (!__ok) return null;
  const { org } = useCurrentOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { if (org) void load(); /* eslint-disable-next-line */ }, [org?.id]);

  async function load() {
    if (!org) return;
    setLoading(true);
    const [{ data: mems }, { data: ovs }] = await Promise.all([
      supabase.from("organization_members").select("id, user_id, role").eq("org_id", org.id),
      supabase.from("permissions_overrides").select("user_id, permission_key, allowed").eq("org_id", org.id),
    ]);
    const ids = (mems ?? []).map(m => m.user_id);
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name").in("user_id", ids)
      : { data: [] as any[] };
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.full_name]));
    setMembers((mems ?? []).map((m: any) => ({ ...m, full_name: map.get(m.user_id) ?? null })));
    setOverrides((ovs ?? []) as any);
    setLoading(false);
  }

  function effective(m: Member, key: PermKey) {
    const ov = overrides.find(o => o.user_id === m.user_id && o.permission_key === key);
    if (ov) return ov.allowed;
    return BASE[m.role][key];
  }

  async function toggle(m: Member, key: PermKey, val: boolean) {
    if (!org) return;
    setBusy(`${m.user_id}:${key}`);
    const baseVal = BASE[m.role][key];
    if (val === baseVal) {
      // remove override
      await supabase.from("permissions_overrides").delete()
        .eq("org_id", org.id).eq("user_id", m.user_id).eq("permission_key", key);
    } else {
      await supabase.from("permissions_overrides").upsert(
        { org_id: org.id, user_id: m.user_id, permission_key: key, allowed: val },
        { onConflict: "org_id,user_id,permission_key" } as any
      );
    }
    await logAudit(org.id, "permission.changed", "member", m.user_id, { key, allowed: val });
    setBusy(null);
    void load();
    toast.success("Permission updated");
  }

  if (!org) return <DashboardShell title="Permissions"><EmptyState icon={ShieldCheck} title="No workspace" /></DashboardShell>;

  return (
    <DashboardShell title="Permissions" subtitle="Role defaults, per-member overrides, and templates">
      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matrix">Role matrix</TabsTrigger>
          <TabsTrigger value="members">Per-member</TabsTrigger>
          <TabsTrigger value="templates">Role templates</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="p-3 text-left">Permission</th>
                  <th className="p-3">Owner</th><th className="p-3">Admin</th><th className="p-3">Member</th></tr>
              </thead>
              <tbody>
                {PERMS.map(p => (
                  <tr key={p.key} className="border-t border-border">
                    <td className="p-3"><div className="font-medium">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground">{p.group} · <code>{p.key}</code></div></td>
                    {(["owner","admin","member"] as Role[]).map(r => (
                      <td key={r} className="p-3 text-center">
                        {BASE[r][p.key] ? <Badge variant="default">Allowed</Badge> : <Badge variant="outline" className="text-muted-foreground">Denied</Badge>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          {loading ? <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
          : members.length === 0 ? <EmptyState icon={ShieldCheck} title="No members" />
          : (
            <div className="space-y-4">
              {members.map(m => (
                <Card key={m.id} className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary text-xs font-semibold">
                      {(m.full_name ?? "?").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{m.full_name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground capitalize">{m.role}</div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {PERMS.map(p => {
                      const v = effective(m, p.key);
                      const k = `${m.user_id}:${p.key}`;
                      const overridden = overrides.some(o => o.user_id === m.user_id && o.permission_key === p.key);
                      return (
                        <label key={p.key} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                          <span className="text-xs">
                            {p.label}
                            {overridden && <Badge variant="outline" className="ml-1 text-[9px]">override</Badge>}
                          </span>
                          {busy === k ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Switch checked={v} onCheckedChange={(val) => toggle(m, p.key, val)} />}
                        </label>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(t => (
              <Card key={t.name} className="p-4">
                <div className="font-medium">{t.name}</div>
                <Badge variant="secondary" className="mt-1 capitalize">{t.role}</Badge>
                <div className="mt-3 space-y-1">
                  {PERMS.filter(p => BASE[t.role][p.key] || (t.extra as string[]).includes(p.key))
                    .map(p => <div key={p.key} className="text-xs text-muted-foreground">• {p.label}</div>)}
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Templates are starting points — assign a base role to a member, then fine-tune in the “Per-member” tab.</p>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}