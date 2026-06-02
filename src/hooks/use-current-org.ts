import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type OrgRole = "owner" | "admin" | "member";
export type PlanTier = "trial" | "starter" | "growth" | "scale";

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: PlanTier;
  trial_ends_at: string | null;
  seat_limit: number;
  timezone: string;
  role: OrgRole;
}

interface State {
  loading: boolean;
  org: OrgSummary | null;
  orgs: OrgSummary[];
}

export function useCurrentOrg() {
  const { user, profile } = useAuth();
  const [state, setState] = useState<State>({ loading: true, org: null, orgs: [] });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) {
      setState({ loading: false, org: null, orgs: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("role, org_id, organizations:org_id(id,name,slug,logo_url,plan,trial_ends_at,seat_limit,timezone)")
        .eq("user_id", user.id);

      const orgs: OrgSummary[] = (memberships ?? [])
        .filter((m: any) => m.organizations)
        .map((m: any) => ({ ...m.organizations, role: m.role as OrgRole }));

      const current =
        orgs.find((o) => o.id === profile?.current_org_id) ?? orgs[0] ?? null;

      if (!cancelled) setState({ loading: false, org: current, orgs });
    })();
    return () => { cancelled = true; };
  }, [user, profile?.current_org_id, version]);

  async function switchOrg(orgId: string) {
    if (!user) return;
    await supabase.from("profiles").update({ current_org_id: orgId }).eq("user_id", user.id);
    setVersion((v) => v + 1);
  }

  return { ...state, switchOrg, refresh: () => setVersion((v) => v + 1) };
}