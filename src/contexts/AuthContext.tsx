"use client";

import { createContext, useContext } from "react";
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
