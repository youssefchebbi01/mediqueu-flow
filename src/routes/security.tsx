import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Monitor, LogOut } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/security")({ component: SecurityPage });

function SecurityPage() {
  const { user, session } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // record current sign-in if not already recent
      await supabase.from("login_events").insert({
        user_id: user.id, event: "session_view",
        user_agent: navigator.userAgent, ip: null,
      }).select();
      const { data } = await supabase.from("login_events")
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      setEvents(data ?? []);
    })();
  }, [user?.id]);

  async function changePassword() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw(""); toast.success("Password updated");
  }

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: "others" } as any);
    toast.success("Signed out other devices");
  }

  return (
    <DashboardShell title="Security" subtitle="Sessions, devices and password">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4" /> Password</div>
          <Label className="text-xs">New password</Label>
          <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" />
          <Button onClick={changePassword} disabled={busy} className="mt-3 rounded-full">Update password</Button>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium"><Monitor className="h-4 w-4" /> Current session</div>
          <div className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Email:</span> {user?.email}</div>
            <div><span className="text-muted-foreground">Provider:</span> {user?.app_metadata?.provider ?? "email"}</div>
            <div className="truncate"><span className="text-muted-foreground">Device:</span> {navigator.userAgent}</div>
            <div><span className="text-muted-foreground">Token expires:</span> {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : "—"}</div>
          </div>
          <Button variant="outline" onClick={signOutEverywhere} className="mt-4 rounded-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign out other devices
          </Button>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-border p-4 text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Login history
        </div>
        {events.length === 0 ? <EmptyState icon={ShieldCheck} title="No activity" />
        : (
          <div className="divide-y divide-border">
            {events.map(e => (
              <div key={e.id} className="grid grid-cols-[200px_1fr_auto] items-center gap-3 p-3 text-sm">
                <div className="text-xs text-muted-foreground tabular-nums">{new Date(e.created_at).toLocaleString()}</div>
                <div className="truncate text-xs text-muted-foreground">{e.user_agent ?? "Unknown device"}</div>
                <Badge variant="outline" className="text-[10px]">{e.event}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}