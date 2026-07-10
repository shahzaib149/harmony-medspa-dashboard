"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, LayoutDashboard, LogOut, MessageSquare, Settings, TrendingUp, UserCircle, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRole } from "@/lib/auth/permissions";

const navItems = [
  { href: "/dashboard",             label: "Overview",   icon: LayoutDashboard },
  { href: "/google-ads-analytics",  label: "Google Ads", icon: TrendingUp },
  { href: "/leads",                 label: "Leads",      icon: Users },
  { href: "/nurture",               label: "Nurture",    icon: GitBranch },
  { href: "/message-logs",          label: "Message Logs", icon: MessageSquare },
  { href: "/settings",              label: "Settings",   icon: Settings },
  // Google Business — hidden until GBP API access is granted. See docs/google-business-profile.md
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const { profile, role, signOut } = useAuth();
  const displayName = profile?.full_name || profile?.email || "Signed in";

  return (
    <aside
      className={[
        "fixed left-0 top-0 h-full w-[240px] flex flex-col z-50",
        "transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
      style={{
        backgroundColor: "#08080C",
        borderRight: "1px solid rgba(201,168,76,0.1)",
      }}
    >
      {/* Brand */}
      <div className="px-6 py-6 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <Link href="/dashboard" className="block" onClick={onClose}>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 22, fontStyle: "italic", color: "#C9A84C", lineHeight: 1, letterSpacing: "0.5px" }}>
            Harmony
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <div style={{ flex: 1, height: "0.5px", backgroundColor: "rgba(201,168,76,0.3)" }} />
            <p style={{ fontSize: 9, letterSpacing: "4px", color: "#C9A84C", opacity: 0.7, fontWeight: 500 }}>
              MED SPA
            </p>
            <div style={{ flex: 1, height: "0.5px", backgroundColor: "rgba(201,168,76,0.3)" }} />
          </div>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="md:hidden ml-2 p-1 rounded-lg"
          onClick={onClose}
          style={{ color: "#7A7A8A" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: active ? "rgba(201,168,76,0.1)" : "transparent",
                color: active ? "#C9A84C" : "#6B6B7A",
                borderLeft: active ? "2px solid #C9A84C" : "2px solid transparent",
              }}
            >
              <Icon size={17} style={{ color: active ? "#C9A84C" : "#6B6B7A" }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="rounded-xl border p-3" style={{ backgroundColor: "rgba(255,255,255,0.025)", borderColor: "rgba(201,168,76,0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.10)" }}>
              <UserCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold" style={{ color: "#F0ECE4" }}>{displayName}</p>
              {role && (
                <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4ECDC4", backgroundColor: "rgba(78,205,196,0.10)" }}>
                  {formatRole(role)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onClose(); void signOut(); }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
            style={{ borderColor: "rgba(201,168,76,0.14)", color: "#C9A84C", backgroundColor: "rgba(201,168,76,0.06)" }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
