"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AuthContext } from "@/contexts/AuthContext";
import { can as canRole, isRole, type Profile, type Role } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clearDashboardDataCache } from "@/lib/dashboard-data-cache";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldLoadAuth = pathname !== "/login" && pathname !== "/lead" && !pathname.startsWith("/lead/");
  const authConfigured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null);
    const data = response
      ? await response.json().catch(() => null) as { user?: User; profile?: Profile } | null
      : null;

    if (!response?.ok || !data?.profile?.is_active) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      if (response?.status === 403) router.replace("/login?error=inactive");
      else if (response?.status === 401) router.replace("/login");
      return;
    }

    setUser(data.user ?? nextUser);
    setProfile(data.profile);
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    if (!authConfigured) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (!shouldLoadAuth) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Fast path: getSession() reads the local cookie without a network round
    // trip, so the UI (sidebar identity, role-gated nav) paints immediately.
    // Real authorization is enforced server-side on every protected page by
    // requirePageAuth() (getUser + profile + is_active) and by each API route,
    // so the client copy is for presentation only and can stay optimistic.
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void loadProfile(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [authConfigured, loadProfile, shouldLoadAuth, supabase]);

  const signOut = useCallback(async () => {
    if (!authConfigured) return;
    await fetch("/api/auth/audit-session", { method: "DELETE", keepalive: true }).catch(() => undefined);
    await supabase.auth.signOut();
    clearDashboardDataCache();
    setUser(null);
    setProfile(null);
    router.replace("/login");
    router.refresh();
  }, [authConfigured, router, supabase]);

  const role: Role | null = isRole(profile?.role) ? profile.role : null;

  const value = useMemo(() => ({
    user,
    profile,
    role,
    isLoading,
    signOut,
    can: (action: string) => canRole(role, action),
  }), [isLoading, profile, role, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
