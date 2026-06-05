import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, Download, FileSpreadsheet, History } from "lucide-react";
import { DashboardShell } from "@/components/mediqueu/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/mediqueu/empty-state";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useRequireRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, toCSV, downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/import-export")({
  head: () => ({ meta: [{ title: "Import & Export — MediQueu" }] }),
  component: ImportExportPage,
});

type Kind = "patients" | "staff" | "appointments";
type Job = { id: string; kind: Kind; filename: string | null; total_rows: number; succeeded_rows: number; failed_rows: number; status: string; created_at: string };

function ImportExportPage() {
  const __ok = useRequireRole(["admin"]);
  const { org } = useCurrentOrg();
  const [jobs, setJobs] = useState<Job[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Kind>("patients");

  async function refresh() {
    if (!org) return;
    const { data } = await (supabase as any).from("import_jobs")
      .select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(25);
    setJobs((data ?? []) as Job[]);
  }
  useEffect(() => { refresh(); }, [org?.id]);
  if (!__ok) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    const text = await file.text();
    const rows = parseCSV(text);
    const errors: any[] = [];
    let ok = 0; let fail = 0;

    for (const r of rows) {
      try {
        if (kind === "patients") {
          // Patients are created via auth signup in MediQueu — record-only import for now
          if (!r.email && !r.phone) { fail++; errors.push({ row: r, error: "Missing email/phone" }); continue; }
          ok++;
        } else if (kind === "staff") {
          if (!r.email || !r.role) { fail++; errors.push({ row: r, error: "Missing email/role" }); continue; }
          ok++;
        } else {
          if (!r.starts_at || !r.doctor_id) { fail++; errors.push({ row: r, error: "Missing starts_at/doctor_id" }); continue; }
          ok++;
        }
      } catch (err: any) { fail++; errors.push({ row: r, error: err.message }); }
    }

    const { error } = await (supabase as any).from("import_jobs").insert({
      org_id: org.id, kind, filename: file.name,
      total_rows: rows.length, succeeded_rows: ok, failed_rows: fail,
      status: fail === rows.length && rows.length > 0 ? "failed" : "completed",
      errors,
    });
    if (error) return toast.error(error.message);
    toast.success(`Validated ${rows.length} rows (${ok} ok, ${fail} failed)`);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
  }

  async function exportData(type: "appointments" | "queue" | "staff") {
    if (!org) return;
    let csv = "";
    if (type === "appointments") {
      const { data } = await supabase.from("appointments").select("*").limit(5000);
      csv = toCSV((data ?? []) as any[]);
    } else if (type === "queue") {
      const { data } = await supabase.from("queue_entries").select("*").limit(5000);
      csv = toCSV((data ?? []) as any[]);
    } else {
      const { data } = await supabase.from("profiles").select("user_id, full_name, phone, specialty, department").limit(5000);
      csv = toCSV((data ?? []) as any[]);
    }
    downloadCSV(`${type}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <DashboardShell title="Import & Export" subtitle="Bulk-load and back up your data">
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" />Import</TabsTrigger>
          <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" />Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card className="p-6">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Type</div>
                <div className="flex gap-2">
                  {(["patients", "staff", "appointments"] as Kind[]).map((k) => (
                    <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setKind(k)}>{k}</Button>
                  ))}
                </div>
              </div>
              <div className="ml-auto">
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv" />
                <Button asChild className="rounded-full">
                  <label htmlFor="csv" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload CSV</label>
                </Button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Expected columns — <strong>patients</strong>: email, phone, full_name. <strong>staff</strong>: email, role, full_name.
              {" "}<strong>appointments</strong>: starts_at, doctor_id, patient_id, status.
            </p>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border p-4 text-sm font-medium flex items-center gap-2"><History className="h-4 w-4" /> Recent jobs</div>
            {jobs.length === 0
              ? <EmptyState icon={FileSpreadsheet} title="No imports yet" />
              : (
                <div className="divide-y divide-border">
                  {jobs.map((j) => (
                    <div key={j.id} className="grid grid-cols-[140px_1fr_1fr_120px_120px] gap-3 p-3 text-sm items-center">
                      <div className="text-xs text-muted-foreground tabular-nums">{new Date(j.created_at).toLocaleString()}</div>
                      <div className="capitalize">{j.kind}</div>
                      <div className="truncate text-xs text-muted-foreground">{j.filename}</div>
                      <div className="text-xs">{j.succeeded_rows}/{j.total_rows} ok</div>
                      <Badge variant={j.status === "failed" ? "destructive" : "outline"} className="capitalize justify-self-start">{j.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <ExportTile label="Appointments" onClick={() => exportData("appointments")} />
            <ExportTile label="Queue entries" onClick={() => exportData("queue")} />
            <ExportTile label="Staff directory" onClick={() => exportData("staff")} />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function ExportTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-medium">{label}</div>
      <p className="mt-1 text-xs text-muted-foreground">CSV export, up to 5,000 rows.</p>
      <Button onClick={onClick} variant="outline" className="mt-4 rounded-full">
        <Download className="mr-2 h-4 w-4" />Download CSV
      </Button>
    </Card>
  );
}