"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import { CONTACT_WEBHOOK_URL, ONLINE_BOOKING_URL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";
import { formatUsPhoneE164 } from "@/lib/submitLead";
import { trackLeadConversion } from "@/lib/analytics/gtag";
import styles from "./WeightLossForm.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_KEY = "wml_utm_params";

const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_ad_group",
  "utm_adgroup",
  "utm_content",
  "utm_term",
  "matchtype",
  "device",
  "network",
  "gclid",
  "gbraid",
  "wbraid",
] as const;

type TrackedParam = (typeof TRACKED_PARAMS)[number];
type CapturedParams = Partial<Record<TrackedParam, string>>;
type Errors = { name?: string; phone?: string; email?: string };
type Status = "idle" | "submitting" | "success" | "error";
type BestTime = "" | "Morning" | "Afternoon" | "Evening" | "Any time";

function readAndPersistParams(): CapturedParams {
  if (typeof window === "undefined") return {};

  const query = new URLSearchParams(window.location.search);
  let stored: CapturedParams = {};

  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    if (value) stored = JSON.parse(value) as CapturedParams;
  } catch {
    // Attribution is helpful, but should never block the form.
  }

  const merged: CapturedParams = {};
  for (const key of TRACKED_PARAMS) {
    merged[key] = query.get(key) ?? stored[key] ?? "";
  }

  try {
    if (TRACKED_PARAMS.some((key) => merged[key])) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
    }
  } catch {
    // Continue if storage is unavailable.
  }

  return merged;
}

function isValidUsPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("1") && digits.length >= 11 ? digits.slice(1) : digits;
  return national.length >= 10;
}

export default function WeightLossForm({ id }: { id: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bestTime, setBestTime] = useState<BestTime>("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const capturedParams = useRef<CapturedParams>({});
  const hasFiredConversion = useRef(false);

  useEffect(() => {
    capturedParams.current = readAndPersistParams();
  }, []);

  function validate(): Errors {
    const nextErrors: Errors = {};
    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!phone.trim()) nextErrors.phone = "Please enter your phone number.";
    else if (!isValidUsPhone(phone)) nextErrors.phone = "Please enter a valid US phone number.";
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Please enter a valid email address.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honeypot) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    const params = capturedParams.current;
    const payload = {
      Name: name.trim(),
      Email: email.trim(),
      Phone: formatUsPhoneE164(phone),
      Source: "Medical Weight Loss Landing Page",
      Status: "New",
      "Treatment Interest": "Medical Weight Loss",
      "Best Time to Reach": bestTime,
      "Email Sent Status": "Pending",
      "SMS Sent Status": "Pending",
      "UTM Source": params.utm_source ?? "",
      "UTM Medium": params.utm_medium ?? "",
      "UTM Campaign": params.utm_campaign ?? "",
      "UTM Ad Group": params.utm_ad_group || params.utm_adgroup || "",
      "UTM Content": params.utm_content ?? "",
      "UTM Term": params.utm_term ?? "",
      "Match Type": params.matchtype ?? "",
      Device: params.device ?? "",
      Network: params.network ?? "",
      GCLID: params.gclid ?? "",
      GBRAID: params.gbraid ?? "",
      WBRAID: params.wbraid ?? "",
      "Page URL": typeof window !== "undefined" ? window.location.href : "",
      "Landing URL": "/landing/medical-weight-loss",
      "Lead Created At": new Date().toISOString(),
    };

    try {
      const response = await fetch(CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Lead submission failed");

      if (!hasFiredConversion.current) {
        hasFiredConversion.current = true;
        trackLeadConversion();
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.card} id={id} role="status" aria-live="polite">
        <div className={styles.successIcon} aria-hidden="true"><Check size={22} /></div>
        <p className={styles.kicker}>Request received</p>
        <h2 className={styles.successHeading}>We&apos;ll be in touch shortly.</h2>
        <p className={styles.successBody}>A member of the Harmony team will contact you about the next step. Prefer to choose a time now?</p>
        <a className={styles.submitButton} href={ONLINE_BOOKING_URL} target="_blank" rel="noopener noreferrer">
          Book an appointment <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className={styles.card} id={id}>
      <p className={styles.kicker}>Private consultation request</p>
      <h2 className={styles.heading}>Let&apos;s talk about your options.</h2>
      <p className={styles.subheading}>Share the best way to reach you. Our Sarasota team will follow up personally.</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Medical weight loss consultation request">
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={`${id}-website`}>Leave this blank</label>
          <input id={`${id}-website`} name="website" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} autoComplete="off" tabIndex={-1} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-name`}>Full name <span aria-hidden="true">*</span></label>
          <input id={`${id}-name`} className={`${styles.input} ${errors.name ? styles.inputError : ""}`} type="text" name="name" autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} aria-required="true" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
          {errors.name ? <p id={`${id}-name-error`} className={styles.fieldError} role="alert">{errors.name}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-phone`}>Phone <span aria-hidden="true">*</span></label>
          <input id={`${id}-phone`} className={`${styles.input} ${errors.phone ? styles.inputError : ""}`} type="tel" name="phone" autoComplete="tel" placeholder="(941) 555-0123" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} aria-required="true" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${id}-phone-error` : undefined} />
          {errors.phone ? <p id={`${id}-phone-error`} className={styles.fieldError} role="alert">{errors.phone}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-email`}>Email <span className={styles.optional}>Optional</span></label>
          <input id={`${id}-email`} className={`${styles.input} ${errors.email ? styles.inputError : ""}`} type="email" name="email" autoComplete="email" placeholder="you@example.com" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${id}-email-error` : undefined} />
          {errors.email ? <p id={`${id}-email-error`} className={styles.fieldError} role="alert">{errors.email}</p> : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-time`}>Best time to reach you <span className={styles.optional}>Optional</span></label>
          <select id={`${id}-time`} className={styles.select} name="best_time" value={bestTime} onChange={(event) => setBestTime(event.target.value as BestTime)}>
            <option value="">Select a time</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Any time">Any time</option>
          </select>
        </div>

        <button className={styles.submitButton} type="submit" disabled={status === "submitting"} aria-busy={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Request my consultation"}
          {status !== "submitting" ? <ArrowUpRight size={18} aria-hidden="true" /> : null}
        </button>

        <p className={styles.privacy}><LockKeyhole size={13} aria-hidden="true" /> Your information is sent securely and used only to follow up about your request.</p>
        <p className={styles.consent}>By submitting, you agree Harmony Med Spa may contact you by phone or text. Message and data rates may apply. Consent is not a condition of purchase.</p>
        {status === "error" ? <p className={styles.formError} role="alert">We couldn&apos;t send your request. Please call <a href={`tel:+1${PHONE_TEL}`}>{PHONE_DISPLAY}</a> and we&apos;ll help directly.</p> : null}
      </form>
    </div>
  );
}
