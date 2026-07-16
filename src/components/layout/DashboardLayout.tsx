"use client";

import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div
      className="flex min-h-dvh overflow-x-clip"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content — offset by sidebar on md+ */}
      <main
        className="min-h-dvh w-full min-w-0 flex-1 md:ml-[240px]"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* Top header */}
        <header
          className="mobile-safe-top sticky top-0 z-30 flex min-h-16 items-center gap-3 px-4 py-3 md:min-h-0 md:px-8 md:py-4"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--background-subtle) 94%, transparent)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Hamburger — mobile only */}
          <button
            ref={menuButtonRef}
            className="-ml-1 grid size-11 flex-shrink-0 place-items-center rounded-xl md:hidden"
            onClick={() => setMobileOpen(true)}
            style={{ color: "var(--brand-primary)" }}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className="truncate text-base font-semibold md:text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-0.5 truncate text-xs md:text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </header>

        <div className="px-4 py-5 max-[340px]:px-3 md:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
