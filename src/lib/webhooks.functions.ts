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
 * Reject webhook target URLs that would let an admin pivot the server into
 * the internal network (SSRF): non-http(s) schemes, loopback, link-local,
 * RFC1918 private ranges, and cloud metadata endpoints.
 */
function assertSafeWebhookUrl(raw: string): void {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Response("Invalid webhook URL", { status: 400 });
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new Response("Webhook URL must use http(s)", { status: 400 });
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    throw new Response("Webhook URL host is not allowed", { status: 400 });
  }
  // IPv4 literal checks: block loopback, private ranges, link-local, and
  // cloud metadata (169.254.169.254).
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224 // multicast / reserved
    ) {
      throw new Response("Webhook URL host is not allowed", { status: 400 });
      void c;
    }
  }
  // Bracketed IPv6 literal — block any literal to be safe (public IPv6
  // destinations should be reached via hostname).
  if (host.startsWith("[") && host.endsWith("]")) {
    throw new Response("Webhook URL host is not allowed", { status: 400 });
  }
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

    assertSafeWebhookUrl((hook as any).target_url as string);

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