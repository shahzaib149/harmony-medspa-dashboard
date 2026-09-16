"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellRing, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !user) return;
    const seenKey = `harmony-call-details-prompt-seen:${user.id}`;
    const pendingKey = "harmony-call-details-prompt-pending";
    const pending = sessionStorage.getItem(pendingKey) === "1";
    if (!pending && sessionStorage.getItem(seenKey) === "1") return;
    sessionStorage.removeItem(pendingKey);
    sessionStorage.setItem(seenKey, "1");
    setShowCallPrompt(true);
  }, [isLoading, user]);

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
      className="flex min-h-dvh w-full min-w-0 max-w-full overflow-x-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content — offset by sidebar on md+ */}
      <main
        className="min-h-dvh w-full min-w-0 max-w-full flex-1 overflow-x-hidden md:ml-[240px]"
        style={{ backgroundColor: "var(--background)" }}
      >
        {showCallPrompt && (
          <aside
            role="status"
            aria-label="Call details reminder"
            className="fixed inset-x-3 top-3 z-[120] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-[var(--warning-text)] shadow-[var(--shadow-modal)] sm:inset-x-auto sm:right-5 sm:top-5 sm:mx-0"
          >
            <BellRing size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">New calls need details</p>
              <p className="mt-0.5 text-xs leading-5">Review Call Leads in Overview and add caller details for follow-up.</p>
              <Link
                href="/dashboard#call-leads"
                onClick={() => setShowCallPrompt(false)}
                className="mt-2 inline-flex min-h-10 items-center rounded-xl border border-current px-3 text-xs font-extrabold"
              >
                Review call leads
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowCallPrompt(false)}
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              aria-label="Dismiss call details reminder"
            >
              <X size={16} />
            </button>
          </aside>
        )}
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

          <div className="min-w-0 flex-1">
            <h1
              className="break-words text-base font-semibold leading-5 md:text-lg md:leading-6"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-0.5 line-clamp-2 text-xs leading-4 md:text-sm md:leading-5"
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

        <div className="w-full min-w-0 max-w-full overflow-x-hidden px-4 py-5 max-[340px]:px-3 md:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
