"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile, Role } from "@/lib/auth/permissions";

export type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  can: (action: string) => boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const subscribe = () => () => {};
const denyAll = () => false;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  // The server renders with no profile. A Suspense boundary can hydrate after the
  // profile has loaded, so while hydrating report the server's signed-out state;
  // React re-renders with the real profile straight after.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const signOut = context.signOut;
  const serverView = useMemo<AuthContextValue>(
    () => ({ user: null, profile: null, role: null, isLoading: true, signOut, can: denyAll }),
    [signOut],
  );
  return hydrated ? context : serverView;
}
