"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  ScrollText,
  TrendingUp,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRole } from "@/lib/auth/permissions";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import {
  DATA_CACHE_KEYS,
  preloadDashboardData,
} from "@/lib/dashboard-data-cache";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/google-ads-analytics", label: "Google Ads", icon: TrendingUp },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
  // Google Business — hidden until GBP API access is granted. See docs/google-business-profile.md
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, role, signOut } = useAuth();
  const displayName = profile?.full_name || profile?.email || "Signed in";

  function handleNavigation(href: string) {
    onClose();
    const isCurrentPage = pathname === href || pathname.startsWith(href + "/");
    if (isCurrentPage) {
      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
      router.refresh();
    }
  }

  function warmPage(href: string) {
    if (href === "/leads")
      void preloadDashboardData(
        DATA_CACHE_KEYS.leads,
        "/api/airtable/leads?status=all",
      );
    if (href === "/nurture")
      void preloadDashboardData(
        DATA_CACHE_KEYS.nurture,
        "/api/airtable/nurture",
      );
    if (href === "/message-logs")
      void preloadDashboardData(
        DATA_CACHE_KEYS.messageLogs,
        "/api/airtable/message-logs?channel=All&status=All&dateRange=all&search=",
      );
    if (href === "/settings" && role === "admin")
      void preloadDashboardData(DATA_CACHE_KEYS.staff, "/api/auth/users");
    if (href === "/google-ads-analytics") {
      void Promise.all([
        preloadDashboardData(
          DATA_CACHE_KEYS.campaigns,
          "/api/airtable?table=campaigns&days=30",
        ),
        preloadDashboardData(
          DATA_CACHE_KEYS.adGroups,
          "/api/airtable?table=ad-groups&days=30",
        ),
        preloadDashboardData(
          DATA_CACHE_KEYS.creatives,
          "/api/airtable?table=creatives&days=30",
        ),
        preloadDashboardData(
          DATA_CACHE_KEYS.keywords,
          "/api/airtable?table=keywords&days=30",
        ),
      ]);
    }
  }

  return (
    <aside
      role={mobileOpen ? "dialog" : undefined}
      aria-modal={mobileOpen ? true : undefined}
      aria-label="Dashboard navigation"
      className={[
        "fixed left-0 top-0 z-50 flex h-dvh w-[min(84vw,320px)] flex-col md:w-[240px]",
        "transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ].join(" ")}
      style={{
        backgroundColor: "var(--background-subtle)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Brand */}
      <div
        className="mobile-safe-top flex items-center justify-between px-5 py-5 md:px-6 md:py-6"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link
          href="/dashboard"
          className="block"
          prefetch
          onClick={() => handleNavigation("/dashboard")}
        >
          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 22,
              fontStyle: "italic",
              color: "var(--brand-primary)",
              lineHeight: 1,
              letterSpacing: "0.5px",
            }}
          >
            Harmony
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            <div
              style={{
                flex: 1,
                height: "0.5px",
                backgroundColor:
                  "color-mix(in srgb, var(--brand-primary) 35%, transparent)",
              }}
            />
            <p
              style={{
                fontSize: 9,
                letterSpacing: "4px",
                color: "var(--brand-primary)",
                opacity: 0.8,
                fontWeight: 500,
              }}
            >
              MED SPA
            </p>
            <div
              style={{
                flex: 1,
                height: "0.5px",
                backgroundColor:
                  "color-mix(in srgb, var(--brand-primary) 35%, transparent)",
              }}
            />
          </div>
        </Link>
        {/* Close button — mobile only */}
        <button
          className="ml-2 grid size-11 place-items-center rounded-xl md:hidden"
          onClick={onClose}
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.filter((item) => !item.adminOnly || role === "admin").map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onMouseEnter={() => warmPage(href)}
              onFocus={() => warmPage(href)}
              onClick={() => handleNavigation(href)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: active
                  ? "var(--brand-primary-soft)"
                  : "transparent",
                color: active
                  ? "var(--brand-primary-strong)"
                  : "var(--text-muted)",
                borderLeft: active
                  ? "2px solid var(--brand-primary)"
                  : "2px solid transparent",
              }}
            >
              <Icon
                size={17}
                style={{
                  color: active ? "var(--brand-primary)" : "var(--text-muted)",
                }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className="mobile-safe-bottom p-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div
          className="rounded-xl border p-3"
          style={{
            backgroundColor: "var(--surface-1)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{
                color: "var(--brand-primary)",
                backgroundColor: "var(--brand-primary-soft)",
              }}
            >
              <UserCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-xs font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {displayName}
              </p>
              {role && (
                <span
                  className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: "var(--healthy)",
                    backgroundColor: "var(--healthy-soft)",
                  }}
                >
                  {formatRole(role)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              void signOut();
            }}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--brand-primary)",
              backgroundColor: "var(--brand-primary-soft)",
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
