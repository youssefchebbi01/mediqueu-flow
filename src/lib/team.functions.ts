import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const ROLES = ["patient", "receptionist", "doctor", "admin"] as const;
type AppRole = (typeof ROLES)[number];

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Response("Service role not configured", { status: 500 });
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Response(error.message, { status: 500 });
  const isAdmin = (data ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Response("Forbidden — admin only", { status: 403 });
}

async function getCallerOrgId(ctx: { supabase: any; userId: string }): Promise<string> {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("current_org_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (error) throw new Response(error.message, { status: 500 });
  const orgId = (data as any)?.current_org_id;
  if (!orgId) throw new Response("No active organization for caller", { status: 400 });
  return orgId as string;
}

export interface TeamMember {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  roles: AppRole[];
  created_at: string;
}

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    await assertAdmin(context);
    const orgId = await getCallerOrgId(context);
    const admin = adminClient();

    // Scope to members of the caller's current organization only — never
    // enumerate users across other tenants via the service-role listUsers API.
    const { data: members, error: membersError } = await admin
      .from("organization_members")
      .select("user_id, created_at")
      .eq("org_id", orgId);
    if (membersError) throw new Response(membersError.message, { status: 500 });
    const userIds = (members ?? []).map((m: any) => m.user_id);
    if (userIds.length === 0) return [];

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      admin.from("profiles").select("user_id, full_name, phone").in("user_id", userIds),
      admin.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);

    // Fetch emails one-by-one via admin API, but only for users already
    // confirmed to belong to this org — no cross-tenant enumeration.
    const emailMap = new Map<string, string | null>();
    await Promise.all(
      userIds.map(async (uid: string) => {
        const { data: u } = await admin.auth.admin.getUserById(uid);
        emailMap.set(uid, u?.user?.email ?? null);
      }),
    );

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const roleMap = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get((r as any).user_id) ?? [];
      arr.push((r as any).role);
      roleMap.set((r as any).user_id, arr);
    }

    return (members ?? []).map((m: any) => {
      const uid = m.user_id as string;
      const p: any = profileMap.get(uid);
      return {
        user_id: uid,
        email: emailMap.get(uid) ?? null,
        full_name: p?.full_name ?? null,
        phone: p?.phone ?? null,
        roles: roleMap.get(uid) ?? [],
        created_at: m.created_at,
      };
    });
  });

const MutateInput = z.object({
  user_id: z.string().uuid(),
  role: z.enum(ROLES),
});

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MutateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const admin = adminClient();
    const { error } = await admin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MutateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId && data.role === "admin") {
      throw new Response("You cannot remove your own admin role.", { status: 400 });
    }
    const admin = adminClient();
    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });