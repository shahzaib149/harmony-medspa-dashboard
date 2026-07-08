"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const GOLD = "#C9A84C";
const BG = "#0A0A0F";
const TEAL = "#4ECDC4";

const inputClassName =
  "login-input h-13 w-full rounded-xl border bg-[#0A0A0F]/85 px-11 text-[15px] font-medium text-[#F0ECE4] outline-none transition duration-200 placeholder:text-[#5A5A6A] disabled:cursor-not-allowed disabled:opacity-55";

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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("Invalid email or password. Check your details and try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .maybeSingle<{ is_active: boolean }>();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account is inactive. Contact an admin.");
      return;
    }

    await supabase.from("profiles").update({ last_sign_in_at: new Date().toISOString() }).eq("id", data.user.id);

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-shell relative flex min-h-screen overflow-hidden px-4 py-8 text-[#F0ECE4] sm:px-6 sm:py-10" style={{ backgroundColor: BG }}>
      <style>{`
        .login-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(circle at center, rgba(0,0,0,0.72), transparent 72%);
        }

        .login-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.24;
          background-image:
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0 1px, transparent 1px),
            radial-gradient(circle at 70% 20%, rgba(255,255,255,0.10) 0 1px, transparent 1px),
            radial-gradient(circle at 45% 70%, rgba(255,255,255,0.08) 0 1px, transparent 1px);
          background-size: 170px 170px, 230px 230px, 190px 190px;
        }

        .login-panel {
          animation: loginPanelIn 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .constellation-node {
          animation: nodePulse 5.6s ease-in-out infinite;
          transform-origin: center;
        }

        .constellation-node:nth-of-type(2) { animation-delay: 700ms; }
        .constellation-node:nth-of-type(3) { animation-delay: 1400ms; }
        .constellation-node:nth-of-type(4) { animation-delay: 2100ms; }

        .login-input {
          border-color: rgba(42,42,58,0.95) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .login-input:hover:not(:disabled) {
          border-color: rgba(201,168,76,0.34) !important;
          background-color: rgba(15,15,23,0.94) !important;
        }

        .login-input:focus {
          border-color: rgba(201,168,76,0.76) !important;
          box-shadow:
            0 0 0 3px rgba(201,168,76,0.14) !important,
            0 0 34px rgba(78,205,196,0.08) !important,
            inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }

        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #F0ECE4;
          caret-color: #F0ECE4;
          box-shadow: 0 0 0 1000px #0A0A0F inset, 0 0 0 3px rgba(201,168,76,0.14) !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        @keyframes loginPanelIn {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes nodePulse {
          0%, 100% { opacity: 0.42; transform: scale(1); }
          50% { opacity: 0.92; transform: scale(1.18); }
        }

        @media (max-width: 640px) {
          .login-shell::before { opacity: 0.45; background-size: 58px 58px; }
          .login-shell::after { opacity: 0.14; }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-panel,
          .constellation-node,
          .login-motion {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.22)_0%,rgba(201,168,76,0.08)_34%,transparent_68%)] blur-2xl sm:h-[860px] sm:w-[860px]" />
      <div className="pointer-events-none absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(78,205,196,0.18)_0%,rgba(78,205,196,0.06)_36%,transparent_70%)] blur-2xl sm:h-[420px] sm:w-[420px]" />
      <div className="pointer-events-none absolute -left-32 top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_68%)] blur-3xl" />

      <AutomationConstellation />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[480px] items-center sm:min-h-[calc(100vh-5rem)]">
        <section
          className="login-panel relative w-full overflow-hidden rounded-[28px] border border-[#2A2A3A]/90 bg-[#12121A]/88 p-[1px] shadow-[0_34px_90px_rgba(0,0,0,0.58),0_0_55px_rgba(201,168,76,0.12)] backdrop-blur-xl"
          aria-label="Harmony MedSpa secure login"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(201,168,76,0.32),rgba(255,255,255,0.05)_34%,rgba(78,205,196,0.18)_72%,rgba(42,42,58,0.24))]" />
          <div className="relative rounded-[27px] bg-[linear-gradient(180deg,rgba(18,18,26,0.98),rgba(10,10,15,0.96))] px-5 py-6 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F0ECE4]/28 to-transparent" />

            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] shadow-[0_0_30px_rgba(201,168,76,0.16)]">
                <LockKeyhole size={26} strokeWidth={1.7} />
              </div>

              <Image
                src="/harmony-logo.svg"
                alt="Harmony MedSpa"
                width={220}
                height={72}
                priority
                className="mx-auto h-auto w-[190px] sm:w-[210px]"
              />

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#C9A84C]">
                Patient Growth Dashboard
              </p>
              <p className="mx-auto mt-3 max-w-[330px] text-sm leading-6 text-[#B8B3A8]">
                Access leads, follow-up activity, ads, and automation health.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSignIn();
              }}
            >
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8E8C98]">Email</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C]/72" size={17} strokeWidth={1.8} />
                  <input
                    type="email"
                    value={email}
                    disabled={loading}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClassName}
                    autoComplete="email"
                    aria-invalid={Boolean(error)}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8E8C98]">Password</span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4ECDC4]/76" size={17} strokeWidth={1.8} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={loading}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${inputClassName} pr-12`}
                    autoComplete="current-password"
                    aria-invalid={Boolean(error)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    disabled={loading}
                    className="login-motion absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8E8C98] outline-none transition hover:bg-white/[0.04] hover:text-[#F0ECE4] focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                className="login-motion group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] text-sm font-extrabold text-[#0A0A0F] shadow-[0_14px_34px_rgba(201,168,76,0.22)] outline-none transition duration-200 hover:-translate-y-0.5 hover:bg-[#D8B95A] hover:shadow-[0_18px_42px_rgba(201,168,76,0.30)] focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-[#8D793D] disabled:opacity-65 disabled:shadow-none"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["Leads", "Automations", "Ads"].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#2A2A3A] bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-[#B8B3A8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#7A7A8A]">
                <ShieldCheck size={14} className="text-[#4ECDC4]" />
                Secure staff access for Harmony MedSpa.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AutomationConstellation() {
  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[560px] w-[760px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-70 sm:h-[660px] sm:w-[980px]"
      viewBox="0 0 980 660"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="automation-line" x1="140" x2="840" y1="220" y2="460" gradientUnits="userSpaceOnUse">
          <stop stopColor={GOLD} stopOpacity="0.04" />
          <stop offset="0.52" stopColor={TEAL} stopOpacity="0.18" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0.08" />
        </linearGradient>
        <filter id="automation-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d="M162 334 C278 214 350 218 468 316 S684 466 820 342" fill="none" stroke="url(#automation-line)" strokeWidth="1.5" />
      <path d="M222 438 C342 374 420 410 534 356 S674 236 784 250" fill="none" stroke="url(#automation-line)" strokeDasharray="5 14" strokeWidth="1" />

      {[
        { cx: 162, cy: 334, label: "Lead Capture", color: GOLD },
        { cx: 392, cy: 266, label: "Airtable", color: TEAL },
        { cx: 592, cy: 390, label: "SMS/Email", color: GOLD },
        { cx: 820, cy: 342, label: "Booking Follow-up", color: TEAL },
      ].map((node) => (
        <g key={node.label} filter="url(#automation-glow)">
          <circle className="constellation-node" cx={node.cx} cy={node.cy} r="5.5" fill={node.color} fillOpacity="0.74" />
          <circle cx={node.cx} cy={node.cy} r="16" fill="none" stroke={node.color} strokeOpacity="0.16" />
          <text x={node.cx} y={node.cy + 33} textAnchor="middle" fill="#F0ECE4" fillOpacity="0.22" fontSize="12" fontWeight="600">
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
