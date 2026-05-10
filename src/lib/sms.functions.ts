import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

const SendSmsInput = z.object({
  to: z.string().min(6, "Phone number is required (E.164, e.g. +15558675310)"),
  body: z.string().min(1).max(1500),
  from: z.string().optional(),
});

export const sendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendSmsInput.parse(data))
  .handler(async ({ data, context }) => {
    // Staff-only
    const { data: roles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesError) throw new Response(rolesError.message, { status: 500 });
    const allowed = (roles ?? []).some((r) =>
      ["admin", "receptionist", "doctor"].includes(r.role as string),
    );
    if (!allowed) throw new Response("Forbidden", { status: 403 });

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
    const TWILIO_FROM = data.from ?? process.env.TWILIO_FROM_NUMBER;

    if (!LOVABLE_API_KEY) throw new Response("LOVABLE_API_KEY not configured", { status: 500 });
    if (!TWILIO_API_KEY) throw new Response("Twilio is not connected", { status: 500 });
    if (!TWILIO_FROM)
      throw new Response(
        "No Twilio sender number configured. Pass `from` or set TWILIO_FROM_NUMBER.",
        { status: 400 },
      );

    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: data.to,
        From: TWILIO_FROM,
        Body: data.body,
      }),
    });

    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Response(
        `Twilio error [${res.status}]: ${json?.message ?? JSON.stringify(json)}`,
        { status: 502 },
      );
    }
    return { sid: json.sid as string, status: json.status as string };
  });