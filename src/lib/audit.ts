import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget audit log entry. Calls the `log_audit` SECURITY DEFINER
 * function so RLS policies don't block us. Never throws — audit failures
 * must not break user-facing flows.
 */
export async function logAudit(
  orgId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  if (!orgId) return;
  try {
    await (supabase as any).rpc("log_audit", {
      _org_id: orgId,
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId,
      _metadata: metadata,
    });
  } catch (e) {
    // swallow — audit is best-effort
    console.warn("[audit] failed", action, e);
  }
}