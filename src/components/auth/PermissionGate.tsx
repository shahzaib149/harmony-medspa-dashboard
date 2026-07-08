"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function PermissionGate({
  action,
  children,
}: {
  action: string;
  children: React.ReactNode;
}) {
  const { can } = useAuth();
  if (!can(action)) return null;
  return <>{children}</>;
}
