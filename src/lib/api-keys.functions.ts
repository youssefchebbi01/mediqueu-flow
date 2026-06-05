import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateInput = z.object({
  org_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  scopes: z.array(z.enum(["read", "write", "webhooks"])).min(1).max(3),
  expires_in_days: z.number().int().min(0).max(3650).optional(),
});

function randomToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify caller is org admin
    const { data: m } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", data.org_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!m || !["owner", "admin"].includes((m as any).role)) {
      throw new Response("Forbidden", { status: 403 });
    }
    const prefix = "mq_" + randomToken(4);
    const secret = randomToken(24);
    const raw = `${prefix}_${secret}`;
    const hashed = await sha256Hex(raw);
    const expires_at = data.expires_in_days && data.expires_in_days > 0
      ? new Date(Date.now() + data.expires_in_days * 86400_000).toISOString()
      : null;
    const { data: row, error } = await supabase
      .from("api_keys")
      .insert({
        org_id: data.org_id,
        name: data.name,
        prefix,
        hashed_key: hashed,
        scopes: data.scopes,
        created_by: userId,
        expires_at,
      })
      .select("id, prefix, name, scopes, created_at, expires_at")
      .single();
    if (error) throw new Response(error.message, { status: 500 });
    return { key: raw, record: row };
  });

const RevokeInput = z.object({ id: z.string().uuid() });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RevokeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });