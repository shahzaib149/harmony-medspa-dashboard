"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const TREATMENTS = [
  "General Inquiry",
  "Injectables (Botox/Filler)",
  "Weight Loss",
  "Advanced Skin & Wellness",
  "Other",
];

// Always formats as +1 (XXX) XXX-XXXX — US only, country code always shown
function formatPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  // Remove leading 1 (country code) if user typed it — we always prepend +1
  const local = (digits.startsWith("1") ? digits.slice(1) : digits).slice(0, 10);
  if (local.length === 0)  return "";
  if (local.length < 4)   return `+1 ${local}`;
  if (local.length < 7)   return `+1 (${local.slice(0, 3)}) ${local.slice(3)}`;
  return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v: string) {
  // Always +1 format → 11 digits total (1 + 10-digit number)
  const d = v.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1");
}

type Fields = {
  name: string; phone: string; email: string;
  treatment: string; message: string; honeypot: string;
};
type Errs = Partial<Record<keyof Fields, string>>;

function LeadFormInner() {
  const searchParams = useSearchParams();
  const utmSource   = searchParams.get("utm_source");
  const utmCampaign = searchParams.get("utm_campaign");
  const utmMedium   = searchParams.get("utm_medium");

  const [f, setF] = useState<Fields>({
    name: "", phone: "", email: "",
    treatment: "", message: "", honeypot: "",
  });
  const [errs, setErrs]       = useState<Errs>({});
  const [status, setStatus]   = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errMsg, setErrMsg]   = useState("");

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = key === "phone" ? formatPhone(e.target.value) : e.target.value;
      setF(prev => ({ ...prev, [key]: val }));
      if (errs[key]) setErrs(prev => ({ ...prev, [key]: undefined }));
    };
  }

  function validate(): Errs {
    const e: Errs = {};
    if (!f.name.trim())              e.name      = "Full name is required.";
    if (!f.phone.trim())             e.phone     = "Phone number is required.";
    else if (!isValidPhone(f.phone)) e.phone     = "Enter a valid US phone number, e.g. (941) 306-3696 or +1 (941) 306-3696.";
    if (!f.email.trim())             e.email     = "Email address is required.";
    else if (!isValidEmail(f.email)) e.email     = "Enter a valid email address.";
    if (!f.treatment)                e.treatment = "Please select a treatment of interest.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (f.honeypot) return; // bot — silent discard

    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }

    setStatus("loading");
    setErrs({});

    const webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;
    const bookingUrl =
      process.env.NEXT_PUBLIC_PATIENTNOW_BOOKING_URL ||
      "https://na02.patientnow.com/a/HARMONYMEDSPA/OnlineBooking.aspx";

    const payload = {
      // ── Core lead fields (map directly to Airtable "Leads" table columns) ──
      Name:               f.name.trim(),
      Phone:              f.phone,
      Email:              f.email.trim().toLowerCase(),
      "Treatment Interest": f.treatment,
      Message:            f.message.trim(),
      Source:             "Google Ads Lead Form",
      Status:             "New",

      // ── Attribution & tracking ──
      "UTM Source":       utmSource   ?? "",
      "UTM Campaign":     utmCampaign ?? "",
      "UTM Medium":       utmMedium   ?? "",
      "Page URL":         window.location.href,

      // ── Timestamps ──
      "Lead Created At":  new Date().toISOString(),

      // ── Automation defaults (Make.com will update these as it runs) ──
      "Email Sent Status": "Pending",
      "SMS Sent Status":   "Pending",
    };

    try {
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      setStatus("success");
      setTimeout(() => { window.location.href = bookingUrl; }, 1600);
    } catch {
      setStatus("error");
      setErrMsg("Something went wrong. Please try again or call us at (941) 306-3696.");
    }
  }

  /* ── shared style fragments ── */
  const inp: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "14px 16px", fontSize: 16,
    borderRadius: 12, outline: "none",
    fontFamily: "inherit", lineHeight: 1.5,
    transition: "border-color 0.15s, box-shadow 0.15s",
    backgroundColor: "#FAFAF8",
    color: "#1A1A1A",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "#E5E0D8",
  };
  const inpErr: React.CSSProperties = { ...inp, borderColor: "#DC2626" };
  const inpFocus = `
    .hm-input:focus { border-color: #C9A84C !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.15) !important; }
    .hm-input::placeholder { color: #B5ADA3 !important; }
    .hm-input option { background: #fff; color: #1A1A1A; }
  `;

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "#4A4040", marginBottom: 6, letterSpacing: "0.01em",
  };

  return (
    <>
      {/* Scoped CSS overrides — defeats globals.css dark rules for this page */}
      <style>{`
        body { background-color: #F2EDE8 !important; color: #1A1A1A !important; }
        .hm-input { background-color: #FAFAF8 !important; color: #1A1A1A !important; border-color: #E5E0D8 !important; }
        .hm-input:focus { border-color: #C9A84C !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.15) !important; outline: none !important; }
        .hm-input::placeholder { color: #B5ADA3 !important; }
        .hm-select { appearance: none; -webkit-appearance: none; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F2EDE8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px 40px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: 460,
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          boxShadow: "0 8px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}>
          {/* Gold accent bar */}
          <div style={{ height: 5, background: "linear-gradient(90deg, #B8924A 0%, #E8C96A 50%, #B8924A 100%)" }} />

          <div style={{ padding: "36px 32px 40px" }}>

            {/* Wordmark */}
            <div style={{ textAlign: "center", marginBottom: 26 }}>
              <p style={{
                fontFamily: "Georgia,'Times New Roman',serif",
                fontSize: 30, fontStyle: "italic",
                color: "#C9A84C", lineHeight: 1, margin: 0,
              }}>
                Harmony
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 7 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4))" }} />
                <p style={{ fontSize: 9, letterSpacing: "4px", color: "#C9A84C", opacity: 0.85, fontWeight: 600, margin: 0 }}>
                  MED SPA
                </p>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(201,168,76,0.4), transparent)" }} />
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: "#1A1A1A", margin: "0 0 8px", lineHeight: 1.35 }}>
                Book Your Free Consultation
              </h1>
              <p style={{ fontSize: 13.5, color: "#7A6F68", margin: 0, lineHeight: 1.55 }}>
                Our team will reach out within <strong>60 seconds</strong> to confirm your appointment time.
              </p>
            </div>

            {/* ── SUCCESS STATE ── */}
            {status === "success" ? (
              <div style={{ textAlign: "center", padding: "28px 0 12px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, #C9A84C, #E8C96A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 18px", fontSize: 30, color: "#fff",
                }}>
                  ✓
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: "#1A1A1A", margin: "0 0 8px" }}>
                  You&apos;re all set!
                </h2>
                <p style={{ fontSize: 14, color: "#7A6F68", margin: 0, lineHeight: 1.55 }}>
                  Thanks {f.name.split(" ")[0]}! Redirecting you to choose your appointment time…
                </p>
              </div>
            ) : (
              /* ── FORM ── */
              <form onSubmit={handleSubmit} noValidate>

                {/* Honeypot — invisible to real users */}
                <div style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }} aria-hidden="true">
                  <input tabIndex={-1} autoComplete="off" value={f.honeypot} onChange={set("honeypot")} />
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Full Name <span style={{ color: "#C9A84C" }}>*</span></label>
                  <input
                    type="text" placeholder="Jane Smith"
                    autoComplete="name" className="hm-input"
                    style={errs.name ? inpErr : inp}
                    value={f.name} onChange={set("name")}
                  />
                  {errs.name && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 5, marginBottom: 0 }}>{errs.name}</p>}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Phone Number <span style={{ color: "#C9A84C" }}>*</span></label>
                  <input
                    type="tel"
                    placeholder="+1 (941) 306-3696"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={18}
                    className="hm-input"
                    style={errs.phone ? inpErr : inp}
                    value={f.phone}
                    onChange={set("phone")}
                    onKeyDown={(e) => {
                      // Block anything that isn't a digit, +, or control key
                      const allowed = /[\d+]/.test(e.key) || [
                        "Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter","Home","End"
                      ].includes(e.key);
                      if (!allowed) e.preventDefault();
                    }}
                  />
                  <p style={{ fontSize: 11, color: "#B5ADA3", marginTop: 4, marginBottom: 0 }}>
                    US numbers only &nbsp;·&nbsp; Auto-formats as +1 (XXX) XXX-XXXX
                  </p>
                  {errs.phone && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 4, marginBottom: 0 }}>{errs.phone}</p>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Email Address <span style={{ color: "#C9A84C" }}>*</span></label>
                  <input
                    type="email" placeholder="jane@email.com"
                    autoComplete="email" className="hm-input"
                    style={errs.email ? inpErr : inp}
                    value={f.email} onChange={set("email")}
                  />
                  {errs.email && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 5, marginBottom: 0 }}>{errs.email}</p>}
                </div>

                {/* Treatment Interest */}
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Treatment Interest <span style={{ color: "#C9A84C" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <select
                      className="hm-input hm-select"
                      style={{
                        ...(errs.treatment ? inpErr : inp),
                        cursor: "pointer",
                        paddingRight: 40,
                      }}
                      value={f.treatment} onChange={set("treatment")}
                    >
                      <option value="">Select a treatment…</option>
                      {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {/* Custom chevron */}
                    <svg
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                      width="14" height="8" viewBox="0 0 14 8" fill="none"
                    >
                      <path d="M1 1l6 6 6-6" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {errs.treatment && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 5, marginBottom: 0 }}>{errs.treatment}</p>}
                </div>

                {/* Message */}
                <div style={{ marginBottom: 22 }}>
                  <label style={lbl}>
                    Message{" "}
                    <span style={{ color: "#B5ADA3", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    rows={3} placeholder="Any questions or concerns you'd like us to know?"
                    className="hm-input"
                    style={{ ...inp, resize: "none" }}
                    value={f.message} onChange={set("message")}
                  />
                </div>

                {/* Error banner */}
                {status === "error" && (
                  <div style={{
                    backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5",
                    borderRadius: 10, padding: "12px 14px",
                    marginBottom: 16, fontSize: 13, color: "#B91C1C", lineHeight: 1.5,
                  }}>
                    {errMsg}
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    width: "100%", padding: "16px",
                    fontSize: 16, fontWeight: 700,
                    borderRadius: 14, border: "none",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    background: status === "loading"
                      ? "#D4B870"
                      : "linear-gradient(135deg, #B8924A 0%, #E8C96A 45%, #C9A84C 100%)",
                    color: "#2A1F00",
                    letterSpacing: "0.03em",
                    boxShadow: "0 4px 20px rgba(201,168,76,0.40)",
                    opacity: status === "loading" ? 0.75 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {status === "loading" ? "Sending…" : "Get My Appointment Time →"}
                </button>

                {/* Trust line */}
                <p style={{ textAlign: "center", fontSize: 12, color: "#B5ADA3", margin: "12px 0 0" }}>
                  🔒 100% Private &nbsp;·&nbsp; No Obligation &nbsp;·&nbsp; Same-Week Availability
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ marginTop: 22, fontSize: 11.5, color: "#C0B5AB", textAlign: "center" }}>
          © {new Date().getFullYear()} Harmony MedSpa &nbsp;·&nbsp; Sarasota, FL
        </p>
      </div>
    </>
  );
}

export default function LeadPage() {
  return (
    <Suspense>
      <LeadFormInner />
    </Suspense>
  );
}
