"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BG = "var(--background)";

const inputClassName =
  "login-input h-11 w-full rounded-lg border px-10 text-sm font-medium outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "inactive") {
      setError("This account is inactive. Contact an admin.");
    }
  }, []);

  async function handleSignIn() {
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.trim().toLowerCase(),
        password,
      },
    );

    if (signInError || !data.user) {
      setLoading(false);
      setError("Invalid email or password. Check your details and try again.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
    void fetch("/api/auth/audit-session", { method: "POST", keepalive: true }).catch(() => undefined);
  }

  return (
    <main
      className="login-shell relative flex h-screen min-h-screen items-center justify-center overflow-hidden px-4 py-4 text-[#F0ECE4] sm:px-6"
      style={{ backgroundColor: BG }}
    >
      <style>{`
        .login-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.42;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(circle at center, rgba(0,0,0,0.58), transparent 70%);
        }

        .login-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image: radial-gradient(circle at center, rgba(255,255,255,0.09) 0 1px, transparent 1px);
          background-size: 180px 180px;
        }

        .login-panel {
          animation: loginPanelIn 420ms ease-out both;
        }

        .login-input {
          color: var(--text-primary) !important;
          background: var(--surface-2) !important;
          border-color: var(--border-strong) !important;
        }

        .login-input:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--brand-primary) 45%, var(--border-subtle)) !important;
          background-color: var(--surface-hover) !important;
        }

        .login-input:focus {
          border-color: var(--focus) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 16%, transparent) !important;
        }

        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--text-primary);
          caret-color: var(--text-primary);
          box-shadow: 0 0 0 1000px var(--surface-2) inset, 0 0 0 3px color-mix(in srgb, var(--focus) 16%, transparent) !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        @keyframes loginPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 640px) {
          .login-shell::before { opacity: 0.32; background-size: 58px 58px; }
          .login-shell::after { opacity: 0.1; }
        }

        .login-panel {
          background: var(--surface-1) !important;
          border-color: var(--border-subtle) !important;
          box-shadow: var(--shadow-modal) !important;
        }

        [data-theme="light"] .login-shell::before,
        [data-theme="light"] .login-shell::after { opacity: 0.12; }

        @media (prefers-reduced-motion: reduce) {
          .login-panel,
          .login-motion {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-[420px]">
        <section
          className="login-panel relative w-full overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#12121A]/96"
          aria-label="Harmony MedSpa secure login"
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/42 to-transparent" />

          <div className="relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] shadow-[0_0_22px_rgba(201,168,76,0.13)]">
                <LockKeyhole size={20} strokeWidth={1.8} />
              </div>

              <h1 className="text-2xl font-semibold tracking-normal text-[#F0ECE4]">
                Harmony MedSpa
              </h1>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A84C]">
                Patient Growth Dashboard
              </p>
              <p className="mx-auto mt-3 max-w-[320px] text-sm leading-5 text-[#8B8AA3]">
                Secure access to leads, ads, and automation activity.
              </p>
            </div>

            <form
              className="space-y-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignIn();
              }}
            >
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8E8C98]">
                  Email
                </span>
                <span className="relative block">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C]/72"
                    size={17}
                    strokeWidth={1.8}
                  />
                  <input
                    type="email"
                    value={email}
                    disabled={loading}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                    autoComplete="email"
                    aria-invalid={Boolean(error)}
                    placeholder="staff@harmonymedspa.com"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8E8C98]">
                  Password
                </span>
                <span className="relative block">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4ECDC4]/76"
                    size={17}
                    strokeWidth={1.8}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClassName} pr-12`}
                    autoComplete="current-password"
                    aria-invalid={Boolean(error)}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    disabled={loading}
                    className="login-motion absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8E8C98] outline-none transition hover:bg-white/[0.04] hover:text-[#F0ECE4] focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-[#EF4444]/28 bg-[#EF4444]/10 px-3 py-2.5 text-sm font-semibold leading-5 text-[#FCA5A5]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 shrink-0" size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="login-motion group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A84C] text-sm font-extrabold text-[#0A0A0F] shadow-[0_12px_28px_rgba(201,168,76,0.2)] outline-none transition duration-200 hover:bg-[#D8B95A] hover:shadow-[0_16px_34px_rgba(201,168,76,0.26)] focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] disabled:cursor-not-allowed disabled:bg-[#8D793D] disabled:opacity-65 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-[#8B8AA3]">
                <ShieldCheck size={14} className="text-[#4ECDC4]" />
                Secure staff access
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
