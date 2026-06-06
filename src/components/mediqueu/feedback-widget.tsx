import { useState } from "react";
import { MessageSquarePlus, X, Send, ThumbsUp, Bug, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";

type Kind = "love" | "idea" | "bug";
const KINDS: { id: Kind; label: string; icon: any }[] = [
  { id: "love", label: "Praise", icon: ThumbsUp },
  { id: "idea", label: "Idea",   icon: Lightbulb },
  { id: "bug",  label: "Bug",    icon: Bug },
];

export function FeedbackWidget() {
  const { user } = useAuth();
  const { org } = useCurrentOrg();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("idea");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  if (!user) return null;

  async function submit() {
    if (!msg.trim()) { toast.error("Please describe your feedback"); return; }
    setSending(true);
    try {
      await logAudit(org?.id, `feedback.${kind}`, "feedback", null, {
        message: msg.slice(0, 1000),
        email: email || user?.email,
        path: typeof window !== "undefined" ? window.location.pathname : null,
      });
      toast.success("Thanks — we read every message.");
      setMsg(""); setEmail(""); setOpen(false);
    } finally { setSending(false); }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full",
          "bg-foreground text-background shadow-lg hover:opacity-90 transition",
          open && "hidden"
        )}
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-semibold">Send feedback</div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map(k => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button key={k.id} onClick={() => setKind(k.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs transition",
                      active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    )}>
                    <Icon className="h-4 w-4" />{k.label}
                  </button>
                );
              })}
            </div>
            <Textarea rows={4} placeholder="Tell us what's on your mind…" value={msg} onChange={e => setMsg(e.target.value)} maxLength={1000} />
            <Input type="email" placeholder={`Reply to (default: ${user.email ?? "your account"})`} value={email} onChange={e => setEmail(e.target.value)} />
            <Button onClick={submit} disabled={sending} className="w-full rounded-full">
              <Send className="mr-2 h-4 w-4" />{sending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}