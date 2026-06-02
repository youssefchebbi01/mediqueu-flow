import { cn } from "@/lib/utils";
import type { PlanTier } from "@/hooks/use-current-org";

const STYLES: Record<PlanTier, string> = {
  trial: "bg-warning/15 text-warning-foreground border-warning/30",
  starter: "bg-info/15 text-info border-info/30",
  growth: "bg-primary/15 text-primary border-primary/30",
  scale: "bg-foreground text-background border-foreground",
};

export function PlanBadge({ plan, className }: { plan: PlanTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider capitalize",
        STYLES[plan],
        className
      )}
    >
      {plan}
    </span>
  );
}