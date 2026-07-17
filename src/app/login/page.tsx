"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "login-input h-12 w-full rounded-xl border px-11 text-sm font-medium outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

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
    <main className="login-shell relative flex h-dvh min-h-[100svh] items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-4 md:justify-start md:px-[clamp(2rem,7vw,8rem)] lg:overflow-hidden">
      <Image
        src="/images/login/harmony-waiting-room-login.webp"
        alt="Harmony MedSpa waiting room in Sarasota"
        fill
        priority
        sizes="100vw"
        className="login-background object-cover"
      />
      <div className="login-image-treatment absolute inset-0" aria-hidden="true" />

      <style>{`
        .login-shell {
          isolation: isolate;
          background: #181613;
        }

        .login-background {
          z-index: -2;
          object-position: 68% center;
        }

        .login-image-treatment {
          z-index: -1;
          background:
            linear-gradient(180deg, rgba(21, 19, 16, 0.34), rgba(21, 19, 16, 0.64)),
            rgba(18, 17, 15, 0.18);
        }

        .login-panel {
          animation: loginPanelIn 420ms ease-out both;
          color: var(--text-primary);
          background: color-mix(in srgb, var(--surface-1) 96%, transparent);
          border-color: color-mix(in srgb, var(--border-strong) 86%, transparent);
          box-shadow: 0 24px 64px rgba(18, 16, 12, 0.24);
          backdrop-filter: saturate(108%) blur(3px);
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

        /* Brand wordmark — the Harmony logo, recolored to brand gold via mask
           (the source PNG is white-on-transparent, invisible on light themes).
           Settles in a beat after the panel for a quiet, refined entrance. */
        .login-logo {
          width: min(216px, 66%);
          aspect-ratio: 337 / 97;
          background-color: var(--brand-primary);
          -webkit-mask: url(/images/logo.png) center / contain no-repeat;
          mask: url(/images/logo.png) center / contain no-repeat;
          animation: loginMarkIn 560ms cubic-bezier(0.22, 1, 0.36, 1) both 90ms;
        }

        @keyframes loginMarkIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        [data-theme="light"] .login-image-treatment {
          background:
            linear-gradient(180deg, rgba(243, 237, 227, 0.25), rgba(31, 27, 22, 0.48)),
            rgba(255, 248, 235, 0.08);
        }

        [data-theme="dark"] .login-image-treatment {
          background:
            linear-gradient(180deg, rgba(8, 9, 11, 0.46), rgba(8, 9, 11, 0.76)),
            rgba(8, 9, 11, 0.14);
        }

        [data-theme="dark"] .login-panel {
          background: color-mix(in srgb, var(--surface-1) 94%, transparent);
          border-color: color-mix(in srgb, var(--border-strong) 80%, transparent);
          box-shadow: 0 24px 72px rgba(0, 0, 0, 0.46);
        }

        @media (min-width: 768px) {
          .login-background {
            object-position: center center;
          }

          [data-theme="light"] .login-image-treatment {
            background: linear-gradient(
              90deg,
              rgba(245, 241, 233, 0.82) 0%,
              rgba(236, 229, 217, 0.68) 30%,
              rgba(31, 28, 24, 0.1) 62%,
              rgba(20, 18, 16, 0.24) 100%
            );
          }

          [data-theme="dark"] .login-image-treatment {
            background: linear-gradient(
              90deg,
              rgba(8, 9, 11, 0.88) 0%,
              rgba(8, 9, 11, 0.72) 31%,
              rgba(8, 9, 11, 0.14) 63%,
              rgba(8, 9, 11, 0.34) 100%
            );
          }
        }

        @media (max-height: 700px) {
          .login-card-content {
            padding-top: 1.15rem !important;
            padding-bottom: 1.15rem !important;
          }

          .login-heading {
            margin-bottom: 1rem !important;
          }

          .login-logo {
            margin-bottom: 0.4rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-panel,
          .login-logo,
          .login-motion {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative z-10 my-auto w-full max-w-[420px]">
        <section
          className="login-panel relative w-full overflow-hidden rounded-[22px] border"
          aria-label="Harmony MedSpa secure login"
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-55"
            aria-hidden="true"
          />

          <div className="login-card-content relative px-5 py-6 sm:px-7 sm:py-7">
            <div className="login-heading mb-6 text-center">
              <h1 className="login-logo mx-auto" role="img" aria-label="Harmony Med Spa" />

              <p
                className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "var(--brand-primary)" }}
              >
                Patient Growth Dashboard
              </p>
              <p
                className="mx-auto mt-2.5 max-w-[320px] text-sm leading-5"
                style={{ color: "var(--text-muted)" }}
              >
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
                <span
                  className="mb-2 block text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Email
                </span>
                <span className="relative block">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--brand-primary)" }}
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
                <span
                  className="mb-2 block text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Password
                </span>
                <span className="relative block">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--success-text)" }}
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
                    className="login-motion absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg outline-none transition hover:bg-[var(--surface-hover)] focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ color: "var(--text-muted)" }}
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
                  className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold leading-5"
                  style={{
                    color: "var(--danger-text)",
                    borderColor: "var(--danger-border)",
                    backgroundColor: "var(--danger-bg)",
                  }}
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 shrink-0" size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="login-motion flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold shadow-[0_12px_28px_rgba(94,70,22,0.2)] outline-none transition duration-200 hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                style={{
                  color: "var(--primary-foreground)",
                  backgroundColor: "var(--brand-primary)",
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div
              className="mt-5 border-t pt-4"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p
                className="flex items-center justify-center gap-2 text-center text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                <ShieldCheck
                  size={14}
                  style={{ color: "var(--success-text)" }}
                />
                Secure staff access
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
