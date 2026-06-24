"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, MapPin } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/google-ads", label: "Google Ads", icon: TrendingUp },
  { href: "/google-business", label: "Google Business", icon: MapPin },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col z-50"
      style={{ backgroundColor: "#0D2B45" }}
    >
      {/* Logo / Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#1A6B6B" }}
          >
            H
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              Harmony
            </p>
            <p className="text-white/50 text-xs leading-tight">
              Growth Command
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${
                  active
                    ? "bg-white/10 text-white border-l-[3px] border-[#1A6B6B] pl-[9px]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon
                size={18}
                className={active ? "text-[#1A6B6B]" : "text-white/60"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs leading-snug">
          Powered by
          <br />
          <span className="text-white/50 font-medium">
            CodeSquad AI Solutions
          </span>
        </p>
      </div>
    </aside>
  );
}
