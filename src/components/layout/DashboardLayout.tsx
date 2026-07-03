"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen" style={{ backgroundColor: "#0A0A0D" }}>
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content — offset by sidebar on md+ */}
      <main className="flex-1 md:ml-[240px] min-h-screen w-full min-w-0" style={{ backgroundColor: "#0A0A0D" }}>
        {/* Top header */}
        <header
          className="sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center gap-3"
          style={{
            backgroundColor: "#0D0D12",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex-shrink-0 p-1.5 rounded-lg"
            onClick={() => setMobileOpen(true)}
            style={{ color: "#C9A84C" }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-semibold truncate" style={{ color: "#F0ECE4" }}>{title}</h1>
            {subtitle && <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: "#7A7A8A" }}>{subtitle}</p>}
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </header>

        <div className="px-4 md:px-8 py-5 md:py-6">{children}</div>
      </main>
    </div>
  );
}
