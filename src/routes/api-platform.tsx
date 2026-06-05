import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { KeyRound, Plus, Copy, Trash2, BookOpen } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useRequireRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createApiKey, revokeApiKey } from "@/lib/api-keys.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/api-platform")({
  head: () => ({ meta: [{ title: "API — MediQueu" }] }),
  component: ApiPage,
});

type Key = {
  id: string; name: string; prefix: string; scopes: string[];
  created_at: string; last_used_at: string | null; revoked_at: string | null; expires_at: string | null;
};

function ApiPage() {
  const __ok = useRequireRole(["admin"]);
  const { org } = useCurrentOrg();
  const [keys, setKeys] = useState<Key[]>([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const [created, setCreated] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const create = useServerFn(createApiKey);
  const revoke = useServerFn(revokeApiKey);

  async function refresh() {
    if (!org) return;
    const { data } = await (supabase as any).from("api_keys")
      .select("id, name, prefix, scopes, created_at, last_used_at, revoked_at, expires_at")
      .eq("org_id", org.id).order("created_at", { ascending: false });
    setKeys((data ?? []) as Key[]);
  }
  useEffect(() => { refresh(); }, [org?.id]);

  if (!__ok) return null;

  async function generate() {
    if (!org) return;
    try {
      const res = await create({ data: { org_id: org.id, name, scopes: scopes as any } });
      setCreated(res.key);
      setName(""); setScopes(["read"]);
      refresh();
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  return (
    <DashboardShell title="API platform" subtitle="Keys, scopes, and integration docs">
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys"><KeyRound className="mr-2 h-4 w-4" />API keys</TabsTrigger>
          <TabsTrigger value="docs"><BookOpen className="mr-2 h-4 w-4" />Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="text-sm font-medium">Active keys</div>
              <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full"><Plus className="mr-1 h-4 w-4" />New key</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{created ? "Save this key now" : "Create API key"}</DialogTitle></DialogHeader>
                  {!created ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Label</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Backoffice integration" />
                      </div>
                      <div>
                        <Label>Scopes</Label>
                        <div className="mt-2 space-y-2">
                          {["read", "write", "webhooks"].map((s) => (
                            <label key={s} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={scopes.includes(s)} onCheckedChange={(v) =>
                                setScopes((cur) => v ? [...new Set([...cur, s])] : cur.filter((x) => x !== s))
                              } />
                              <span className="capitalize">{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={generate} disabled={!name || !scopes.length} className="rounded-full">Generate</Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Copy this key — it will not be shown again. Store it in your secrets manager.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input readOnly value={created} className="font-mono text-xs" />
                        <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(created); toast.success("Copied"); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setOpen(false)} className="rounded-full">Done</Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            {keys.length === 0
              ? <EmptyState icon={KeyRound} title="No API keys" description="Generate a key to start calling the MediQueu API." />
              : (
                <div className="divide-y divide-border">
                  {keys.map((k) => (
                    <div key={k.id} className="grid grid-cols-[1.5fr_1fr_1fr_120px_80px] items-center gap-3 p-4 text-sm">
                      <div>
                        <div className="font-medium">{k.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{k.prefix}_••••••••</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                      </div>
                      <Badge variant={k.revoked_at ? "destructive" : "outline"} className="justify-self-start">
                        {k.revoked_at ? "Revoked" : "Active"}
                      </Badge>
                      <Button size="sm" variant="ghost" disabled={!!k.revoked_at}
                        onClick={async () => { await revoke({ data: { id: k.id } }); refresh(); toast.success("Revoked"); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">MediQueu API</h2>
            <p className="mt-1 text-sm text-muted-foreground">Base URL: <code className="font-mono">https://api.mediqueu.com/v1</code></p>
            <div className="mt-6 space-y-6 text-sm">
              <DocBlock method="GET" path="/appointments" desc="List appointments scoped to your organization." />
              <DocBlock method="POST" path="/appointments" desc="Create an appointment. Required scope: write." />
              <DocBlock method="GET" path="/queue" desc="Live queue snapshot with ETAs." />
              <DocBlock method="POST" path="/webhooks/test" desc="Send a synthetic event to a configured webhook." />
            </div>
            <div className="mt-8 rounded-md bg-muted p-4 font-mono text-xs">
              curl https://api.mediqueu.com/v1/appointments \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer mq_xxxx_••••••••"
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function DocBlock({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <div className="border-l-2 border-primary/40 pl-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px]">{method}</Badge>
        <code className="font-mono text-sm">{path}</code>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}