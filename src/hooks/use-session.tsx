import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { permissionsFor, type AppRole, type Permission } from "@/lib/access";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({ session: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo(() => ({ session, loading }), [session, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string | null;
  position: string | null;
  roles: AppRole[];
  can: (permission: Permission) => boolean;
  isAdmin: boolean;
};

export function useCurrentUser() {
  const { session, loading } = useSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["current-user", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [{ data: profile, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.rpc("get_private_profiles").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return {
        profile,
        roles: (roles ?? []).map((r) => r.role as AppRole),
      };
    },
  });

  const user: CurrentUser | null = useMemo(() => {
    if (!session || !query.data) return null;
    const roles = query.data.roles;
    const perms = permissionsFor(roles);
    return {
      id: session.user.id,
      fullName: query.data.profile?.full_name || session.user.email || "Staff member",
      email: session.user.email ?? null,
      position: query.data.profile?.position ?? null,
      roles,
      can: (p: Permission) => perms.has(p),
      isAdmin: roles.includes("super_admin") || roles.includes("admin"),
    };
  }, [session, query.data]);

  return { user, loading: loading || query.isLoading };
}
