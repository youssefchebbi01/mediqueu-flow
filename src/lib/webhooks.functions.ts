import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TestInput = z.object({
  webhook_id: z.string().uuid(),
  event: z.string().min(1).max(80).default("test.ping"),
});

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Dispatches a webhook delivery and records the attempt. Used both for the
 * "Send test event" button and as the canonical dispatcher to call from other
 * server functions when domain events occur.
 */
export const dispatchWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: hook, error } = await supabase
      .from("webhooks")
      .select("id, org_id, target_url, secret, events, active")
      .eq("id", data.webhook_id)
      .maybeSingle();
    if (error || !hook) throw new Response("Webhook not found", { status: 404 });
    if (!(hook as any).active) throw new Response("Webhook disabled", { status: 400 });

    const body = JSON.stringify({
      event: data.event,
      delivered_at: new Date().toISOString(),
      data: { ping: true },
    });
    const signature = await hmacSha256Hex((hook as any).secret, body);

    let status = 0;
    let excerpt = "";
    let ok = false;
    try {
      const res = await fetch((hook as any).target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MediQueu-Event": data.event,
          "X-MediQueu-Signature": signature,
        },
        body,
      });
      status = res.status;
      excerpt = (await res.text()).slice(0, 500);
      ok = res.ok;
    } catch (e: any) {
      excerpt = String(e?.message ?? e).slice(0, 500);
    }
    await supabase.from("webhook_deliveries").insert({
      webhook_id: (hook as any).id,
      org_id: (hook as any).org_id,
      event: data.event,
      payload: { ping: true },
      status_code: status || null,
      response_excerpt: excerpt,
      succeeded: ok,
    });
    return { ok, status };
  });