import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2, Mail, Trash2, RefreshCw, Plus, Loader2, Globe2, Copy, Check,
  MapPin, Crown, ShieldCheck, UserMinus,
} from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useAuth, useRequireRole } from "@/hooks/use-auth";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

export const Route = createFileRoute("/organization")({ component: OrganizationPage });

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Amsterdam",
  "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
];

type Member = {
  id: string; user_id: string; role: "owner"|"admin"|"member"; joined_at: string;
  profile?: { full_name: string | null; phone: string | null; avatar_url: string | null };
};
type Invite = {
  id: string; email: string; role: "owner"|"admin"|"member"; status: string;
  token: string; expires_at: string; created_at: string;
};
type Clinic = { id: string; name: string; address: string | null; phone: string | null; timezone: string | null };

function OrganizationPage() {
  const __ok = useRequireRole(["admin"]);
  if (!__ok) return null;
  const { user } = useAuth();
  const { org, refresh } = useCurrentOrg();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tz, setTz] = useState("UTC");
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  // invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner"|"admin"|"member">("member");
  const [inviting, setInviting] = useState(false);

  // new location form
  const [locName, setLocName] = useState("");
  const [locAddr, setLocAddr] = useState("");
  const [locPhone, setLocPhone] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setName(org.name); setLogoUrl(org.logo_url ?? ""); setTz(org.timezone ?? "UTC");
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id]);

  async function loadAll() {
    if (!org) return;
    setLoading(true);
    const [{ data: mems }, { data: invs }, { data: cls }] = await Promise.all([
      supabase.from("organization_members")
        .select("id, user_id, role, joined_at")
        .eq("org_id", org.id),
      (supabase as any).from("organization_invitations")
        .select("id, email, role, status, token, expires_at, created_at")
        .eq("org_id", org.id).order("created_at", { ascending: false }),
      supabase.from("clinics").select("id, name, address, phone, timezone")
        .eq("organization_id", org.id).order("created_at"),
    ]);
    // profiles for members
    const ids = (mems ?? []).map(m => m.user_id);
    let profileMap = new Map<string, any>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("user_id, full_name, phone, avatar_url").in("user_id", ids);
      profileMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    }
    setMembers((mems ?? []).map((m: any) => ({ ...m, profile: profileMap.get(m.user_id) })));
    setInvites((invs ?? []) as any);
    setClinics((cls ?? []) as any);
    setLoading(false);
  }

  async function saveProfile() {
    if (!org) return;
    setSaving(true);
    const { error } = await supabase.from("organizations")
      .update({ name, logo_url: logoUrl || null, timezone: tz })
      .eq("id", org.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "organization.updated", "organization", org.id, { name, timezone: tz });
    toast.success("Workspace updated"); refresh();
  }

  async function sendInvite() {
    if (!org || !user || !inviteEmail.trim()) return;
    setInviting(true);
    const { data, error } = await (supabase as any).from("organization_invitations")
      .insert({ org_id: org.id, email: inviteEmail.trim().toLowerCase(), role: inviteRole, invited_by: user.id })
      .select("id, token, email, role").single();
    setInviting(false);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "invitation.created", "invitation", data.id, { email: data.email, role: data.role });
    setInviteEmail(""); setInviteRole("member");
    toast.success("Invitation created — copy the link to share");
    void loadAll();
  }

  async function revokeInvite(inv: Invite) {
    if (!org) return;
    const { error } = await (supabase as any).from("organization_invitations")
      .update({ status: "revoked" }).eq("id", inv.id);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "invitation.revoked", "invitation", inv.id, { email: inv.email });
    toast.success("Invitation revoked"); loadAll();
  }

  async function resendInvite(inv: Invite) {
    if (!org) return;
    const { error } = await (supabase as any).from("organization_invitations")
      .update({ expires_at: new Date(Date.now() + 14 * 86400000).toISOString(), status: "pending" })
      .eq("id", inv.id);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "invitation.resent", "invitation", inv.id, { email: inv.email });
    toast.success("Invitation refreshed"); loadAll();
  }

  function inviteLink(inv: Invite) {
    return `${window.location.origin}/invite/${inv.token}`;
  }

  async function copyLink(inv: Invite) {
    try {
      await navigator.clipboard.writeText(inviteLink(inv));
      setCopied(inv.id); setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  async function changeRole(m: Member, role: "owner"|"admin"|"member") {
    if (!org) return;
    const { error } = await supabase.from("organization_members")
      .update({ role }).eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "member.role_changed", "member", m.user_id, { role });
    toast.success("Role updated"); loadAll();
  }

  async function removeMember(m: Member) {
    if (!org) return;
    if (m.user_id === user?.id) return toast.error("You can't remove yourself");
    const { error } = await supabase.from("organization_members").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "member.removed", "member", m.user_id, {});
    toast.success("Member removed"); loadAll();
  }

  async function addLocation() {
    if (!org || !locName.trim()) return;
    setSavingLoc(true);
    const { data, error } = await supabase.from("clinics")
      .insert({ name: locName.trim(), address: locAddr || null, phone: locPhone || null,
               timezone: tz, organization_id: org.id })
      .select("id").single();
    setSavingLoc(false);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "location.created", "clinic", data.id, { name: locName });
    setLocName(""); setLocAddr(""); setLocPhone("");
    toast.success("Location added"); loadAll();
  }

  async function deleteLocation(c: Clinic) {
    if (!org) return;
    if (!confirm(`Delete location “${c.name}”?`)) return;
    const { error } = await supabase.from("clinics").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    await logAudit(org.id, "location.deleted", "clinic", c.id, { name: c.name });
    toast.success("Location removed"); loadAll();
  }

  if (!org) return (
    <DashboardShell title="Organization">
      <EmptyState icon={Building2} title="No workspace selected" description="Pick a workspace from the switcher." />
    </DashboardShell>
  );

  return (
    <DashboardShell title="Organization" subtitle="Workspace, locations, and team management">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-info/20 text-primary">
                {logoUrl ? <img src={logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <Building2 className="h-6 w-6" />}
              </div>
              <div>
                <div className="text-lg font-semibold">{name || "Unnamed workspace"}</div>
                <div className="text-xs text-muted-foreground capitalize">{org.plan} plan</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label className="text-xs">Workspace name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Logo URL</Label>
                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" /></div>
              <div><Label className="text-xs flex items-center gap-1"><Globe2 className="h-3 w-3" /> Timezone</Label>
                <Select value={tz} onValueChange={setTz}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="rounded-full">
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Save changes
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-border p-4 text-sm font-medium">Team members ({members.length})</div>
            {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            : members.length === 0 ? <EmptyState icon={ShieldCheck} title="No members yet" description="Invite teammates to get started." />
            : (
              <div className="divide-y divide-border">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary text-xs font-semibold">
                      {(m.profile?.full_name ?? "?").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{m.profile?.full_name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</div>
                    </div>
                    <Select value={m.role} onValueChange={(v) => changeRole(m, v as any)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    {m.role === "owner" && <Badge variant="secondary"><Crown className="mr-1 h-3 w-3" />Owner</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => removeMember(m)} aria-label="Remove">
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 text-sm font-medium">Invite a teammate</div>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
              <Input type="email" placeholder="name@clinic.com" value={inviteEmail}
                     onChange={e => setInviteEmail(e.target.value)} />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-full">
                {inviting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-2 h-3.5 w-3.5" />}
                Send invite
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Generates a secure invite link. Copy &amp; share via your preferred channel.</p>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="border-b border-border p-4 text-sm font-medium">Pending &amp; past invitations</div>
            {invites.length === 0 ? <EmptyState icon={Mail} title="No invitations" description="Invite your first teammate above." />
            : (
              <div className="divide-y divide-border">
                {invites.map(inv => (
                  <div key={inv.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{inv.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={inv.status === "pending" ? "default" : inv.status === "accepted" ? "secondary" : "outline"} className="capitalize">
                      {inv.status}
                    </Badge>
                    {inv.status === "pending" && <>
                      <Button variant="outline" size="sm" onClick={() => copyLink(inv)}>
                        {copied === inv.id ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                        {copied === inv.id ? "Copied" : "Copy link"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resendInvite(inv)}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Revoke
                      </Button>
                    </>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Add a clinic location</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Name (e.g. Downtown Clinic)" value={locName} onChange={e => setLocName(e.target.value)} />
              <Input placeholder="Address" value={locAddr} onChange={e => setLocAddr(e.target.value)} />
              <Input placeholder="Phone" value={locPhone} onChange={e => setLocPhone(e.target.value)} />
            </div>
            <Button onClick={addLocation} disabled={savingLoc || !locName.trim()} className="mt-3 rounded-full">
              {savingLoc && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Add location
            </Button>
          </Card>

          {clinics.length === 0 ? <EmptyState icon={MapPin} title="No locations yet" description="Add your first clinic location above." />
          : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {clinics.map(c => (
                <Card key={c.id} className="p-4 group relative">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{c.address ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? ""} · {c.timezone}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteLocation(c)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}