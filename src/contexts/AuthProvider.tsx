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

    const { data } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
      .eq("id", nextUser.id)
      .maybeSingle<Profile>();

    if (!data?.is_active) {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      router.replace("/login?error=inactive");
      return;
    }

    setProfile(data);
    setIsLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    if (!authConfigured) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (pathname === "/login" || pathname === "/lead" || pathname.startsWith("/lead/")) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) void loadProfile(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [authConfigured, loadProfile, pathname, supabase]);

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
