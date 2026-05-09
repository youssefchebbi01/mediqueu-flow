import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/mock-data";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  specialty: string | null;
  license_number: string | null;
  department: string | null;
  clinic_id: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function loadExtras(user: User | null) {
      if (!user) return { profile: null, role: null as Role | null };
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const priority: Role[] = ["admin", "doctor", "receptionist", "patient"];
      const owned = (roles ?? []).map((r: any) => r.role as Role);
      const role = priority.find((r) => owned.includes(r)) ?? null;
      return { profile: (profile as Profile) ?? null, role };
    }

    // 1) Subscribe FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
      // Defer DB calls to avoid deadlocking inside the auth callback
      setTimeout(async () => {
        const extras = await loadExtras(session?.user ?? null);
        if (!mounted) return;
        setState({
          session,
          user: session?.user ?? null,
          ...extras,
          loading: false,
        });
      }, 0);
    });

    // 2) THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const extras = await loadExtras(session?.user ?? null);
      if (!mounted) return;
      setState({
        session,
        user: session?.user ?? null,
        ...extras,
        loading: false,
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signOut };
}

export const dashboardPath: Record<Role, string> = {
  patient: "/patient",
  receptionist: "/reception",
  doctor: "/doctor",
  admin: "/admin",
};