import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Subtle top-of-viewport progress bar that shows during route loading.
 * Pure CSS animation — no extra deps.
 */
export function RouteProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (isLoading) {
      setVisible(true);
    } else {
      // Brief hold so the bar can finish its animation gracefully.
      t = setTimeout(() => setVisible(false), 220);
    }
    return () => { if (t) clearTimeout(t); };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
    >
      <div
        className={
          "h-full origin-left rounded-r-full bg-gradient-to-r from-primary via-info to-primary " +
          (isLoading ? "animate-[mq-progress_1.2s_ease-in-out_infinite]" : "w-full opacity-0 transition-opacity")
        }
        style={isLoading ? { width: "60%" } : undefined}
      />
      <style>{`@keyframes mq-progress {
        0%   { transform: translateX(-100%); }
        50%  { transform: translateX(20%); }
        100% { transform: translateX(120%); }
      }`}</style>
    </div>
  );
}