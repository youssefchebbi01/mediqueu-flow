import { useState } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlanBadge } from "./plan-badge";
import { cn } from "@/lib/utils";

export function OrgSwitcher({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { org, orgs, loading, switchOrg, refresh } = useCurrentOrg();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setBusy(true);
    try {
      const slug =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
        "-" + Math.random().toString(36).slice(2, 8);
      const { data: org, error } = await supabase
        .from("organizations")
        .insert({ name: name.trim(), slug, created_by: user.id })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("organization_members").insert({
        org_id: org.id, user_id: user.id, role: "owner", invited_by: user.id,
      });
      await supabase.from("subscriptions").insert({ org_id: org.id, plan: "trial", status: "trialing", seats: 5 });
      await supabase.from("profiles").update({ current_org_id: org.id }).eq("user_id", user.id);
      toast.success(`Created “${name}”`);
      setName(""); setCreateOpen(false); refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create organization");
    } finally { setBusy(false); }
  }

  if (loading || !org) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading workspace…
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "group flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-sm transition-colors hover:bg-muted",
              compact && "px-2"
            )}
            aria-label="Switch organization"
          >
            <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-primary/20 to-info/20 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            {!compact && (
              <>
                <span className="max-w-[140px] truncate font-medium">{org.name}</span>
                <PlanBadge plan={org.plan} className="hidden sm:inline-flex" />
              </>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Your organizations
          </DropdownMenuLabel>
          {orgs.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={() => switchOrg(o.id)}
              className="flex items-center gap-2 py-2"
            >
              <div className="grid h-7 w-7 place-items-center rounded-md bg-muted text-foreground">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{o.name}</div>
                <div className="truncate text-[10px] text-muted-foreground capitalize">
                  {o.role} · {o.plan}
                </div>
              </div>
              {o.id === org.id && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Organization name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Health" />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll start on a 14-day Growth trial. No card required.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !name.trim()} className="rounded-full">
              {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Create workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}