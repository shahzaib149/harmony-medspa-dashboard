"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, MapPin } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/google-ads-analytics", label: "Google Ads", icon: TrendingUp },
  { href: "/google-business", label: "Google Business", icon: MapPin },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col z-50"
      style={{
        backgroundColor: "#08080C",
        borderRight: "1px solid rgba(201,168,76,0.1)",
      }}
    >
      {/* Brand */}
      <div className="px-6 py-6" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <Link href="/dashboard" className="block">
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
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: active ? "rgba(201,168,76,0.1)" : "transparent",
                color: active ? "#C9A84C" : "#6B6B7A",
                borderLeft: active ? "2px solid #C9A84C" : "2px solid transparent",
              }}
            >
              <Icon
                size={17}
                style={{ color: active ? "#C9A84C" : "#6B6B7A" }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
