import { cn } from "@/lib/utils";
import type { AppointmentStatus, QueueStatus } from "@/lib/mock-data";

const map: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Confirmed: "bg-primary-soft text-primary",
  Waiting: "bg-warning/15 text-warning-foreground border border-warning/30",
  "In Consultation": "bg-info/15 text-info border border-info/30",
  Completed: "bg-success/15 text-success border border-success/30",
  Cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  "No Show": "bg-muted text-muted-foreground",
  Active: "bg-primary text-primary-foreground",
  Delayed: "bg-warning/20 text-warning-foreground border border-warning/40",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus | QueueStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[status] ?? "bg-muted", className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
