import { Activity } from "lucide-react";
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground card-elevated">
        <Activity className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-semibold tracking-tight">MediQueu</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Smart Clinic</div>
      </div>
    </div>
  );
}
