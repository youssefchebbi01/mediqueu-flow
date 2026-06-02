import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentOrg } from "@/hooks/use-current-org";

export function TrialBanner() {
  const { org } = useCurrentOrg();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem("mq.trialBanner") === "1"); } catch {}
  }, []);

  if (!org || dismissed || org.plan !== "trial" || !org.trial_ends_at) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000)
  );
  if (daysLeft > 10) return null;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem("mq.trialBanner", "1"); } catch {}
  }

  return (
    <div className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm">
      <Sparkles className="h-4 w-4 shrink-0 text-warning-foreground" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">
          {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in trial.` : "Your trial ends today."}
        </span>{" "}
        <span className="text-muted-foreground">Upgrade to keep your team running without interruption.</span>
      </div>
      <Link
        to="/billing"
        className="hidden sm:inline-flex h-7 items-center rounded-full bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
      >
        See plans
      </Link>
      <button onClick={dismiss} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}