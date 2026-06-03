import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = useParams({ from: "/invite/$token" });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any).from("organization_invitations")
        .select("id, email, role, status, expires_at, org_id, organizations:org_id(name)")
        .eq("token", token).maybeSingle();
      if (error || !data) return setErr("Invitation not found");
      setInv(data);
    })();
  }, [token]);

  async function accept() {
    if (!user) { navigate({ to: "/login", search: { next: `/invite/${token}` } as any }); return; }
    setBusy(true);
    const { error } = await (supabase as any).rpc("accept_invitation", { _token: token });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to the team!");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Mail className="h-6 w-6" /></div>
        <h1 className="mt-4 text-xl font-semibold">You're invited</h1>
        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}
        {!err && !inv && <p className="mt-4 text-sm text-muted-foreground">Loading invitation…</p>}
        {inv && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Join <span className="font-medium text-foreground">{inv.organizations?.name ?? "this workspace"}</span> as a{" "}
              <span className="capitalize font-medium text-foreground">{inv.role}</span>.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">For: {inv.email}</p>
            {inv.status !== "pending" ? (
              <p className="mt-4 text-sm capitalize">This invitation is {inv.status}.</p>
            ) : (
              <Button onClick={accept} disabled={busy || loading} className="mt-6 w-full rounded-full">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                {user ? "Accept invitation" : "Sign in to accept"}
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}