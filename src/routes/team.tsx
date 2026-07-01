import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Send, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { listTeam, assignRole, removeRole, type TeamMember } from "@/lib/team.functions";
import { sendSms } from "@/lib/sms.functions";
import { useAuth, useRequireRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team — MediQueu" }] }),
  component: TeamPage,
});

const ROLES = ["patient", "receptionist", "doctor", "admin"] as const;
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  doctor: "bg-info/15 text-info border border-info/30",
  receptionist: "bg-warning/15 text-warning-foreground border border-warning/30",
  patient: "bg-muted text-muted-foreground",
};

function TeamPage() {
  const __ok = useRequireRole(["admin"]);
  
  const { role: myRole, loading } = useAuth();
  const list = useServerFn(listTeam);
  const assign = useServerFn(assignRole);
  const remove = useServerFn(removeRole);
  const sms = useServerFn(sendSms);
  const qc = useQueryClient();

  const team = useQuery({
    queryKey: ["team"],
    queryFn: () => list(),
    enabled: !loading && myRole === "admin",
  });

  const assignM = useMutation({
    mutationFn: (vars: { user_id: string; role: (typeof ROLES)[number] }) =>
      assign({ data: vars }),
    onSuccess: () => { toast.success("Role assigned"); qc.invalidateQueries({ queryKey: ["team"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to assign role"),
  });

  const removeM = useMutation({
    mutationFn: (vars: { user_id: string; role: (typeof ROLES)[number] }) =>
      remove({ data: vars }),
    onSuccess: () => { toast.success("Role removed"); qc.invalidateQueries({ queryKey: ["team"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to remove role"),
  });

  const [search, setSearch] = useState("");
  const [smsTo, setSmsTo] = useState("");
  const [smsBody, setSmsBody] = useState("Hi from MediQueu — your appointment is confirmed.");
  const [smsLoading, setSmsLoading] = useState(false);

  const handleSendSms = async () => {
    if (!smsTo) return toast.error("Enter a phone number (E.164, e.g. +15558675310)");
    setSmsLoading(true);
    try {
      const res = await sms({ data: { to: smsTo, body: smsBody } });
      toast.success(`SMS sent (${res.status})`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send SMS");
    } finally {
      setSmsLoading(false);
    }
  };

  if (!loading && myRole !== "admin") {
    return (
      <DashboardShell title="Team" subtitle="Admin only">
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          You need admin privileges to view this page.
        </div>
      </DashboardShell>
    );
  }

  const members: TeamMember[] = team.data ?? [];
  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.full_name ?? "").toLowerCase().includes(q) ||
      (m.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell title="Team Management" subtitle="Assign roles and send SMS notifications.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Members ({members.length})</h3>
            </div>
            <Input
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-72"
            />
          </div>

          {team.isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading team…
            </div>
          ) : team.isError ? (
            <div className="p-8 text-sm text-destructive">
              {(team.error as any)?.message ?? "Failed to load team."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((m) => {
                const initials = (m.full_name ?? m.email ?? "U")
                  .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <li key={m.user_id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary-soft text-primary text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{m.full_name ?? m.email ?? "Unknown"}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {m.email}{m.phone ? ` · ${m.phone}` : ""}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.roles.length === 0 && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">no role</span>
                          )}
                          {m.roles.map((r) => (
                            <span key={r} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${ROLE_STYLES[r]}`}>
                              {r}
                              <button
                                onClick={() => removeM.mutate({ user_id: m.user_id, role: r })}
                                className="ml-0.5 opacity-70 hover:opacity-100"
                                title={`Remove ${r}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Select
                        onValueChange={(role) =>
                          assignM.mutate({ user_id: m.user_id, role: role as any })
                        }
                      >
                        <SelectTrigger className="h-9 w-[150px]">
                          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.filter((r) => !m.roles.includes(r)).map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-6 py-12 text-center text-sm text-muted-foreground">No matches.</li>
              )}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Send SMS</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Powered by Twilio. Use E.164 format (e.g. +15558675310).
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <Input
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
                placeholder="+15558675310"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <Textarea
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                rows={4}
                maxLength={1500}
              />
              <div className="mt-1 text-right text-[10px] text-muted-foreground">{smsBody.length}/1500</div>
            </div>
            <Button onClick={handleSendSms} disabled={smsLoading} className="w-full">
              {smsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send SMS
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Set <code className="rounded bg-muted px-1">TWILIO_FROM_NUMBER</code> as a project secret to set the default sender.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}