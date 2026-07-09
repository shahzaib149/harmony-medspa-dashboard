"use client";

import { useEffect, useState } from "react";
import {
  Building2, CheckCircle2, Globe, Mail, Phone, Save, UserCog, Users, Clock, BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const GOLD   = "#C9A84C";
const CARD   = "#111117";
const CARD2  = "#0D0D12";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT   = "#F0ECE4";
const MUTED  = "#7A7A8A";
const DIM    = "#5A5A6A";
const TEAL   = "#2DD4BF";

const PROFILE_KEY = "harmony_settings_profile_v1";

type ClinicProfile = {
  clinicName:     string;
  phone:          string;
  website:        string;
  bookingUrl:     string;
  timezone:       string;
  frontDeskEmail: string;
};

const DEFAULT_PROFILE: ClinicProfile = {
  clinicName:     "Harmony MedSpa",
  phone:          "(941) 306-3696",
  website:        "https://www.harmonymedspafl.com/",
  bookingUrl:     "https://na02.patientnow.com/a/HARMONYMEDSPA/OnlineBooking.aspx",
  timezone:       "America/New_York",
  frontDeskEmail: "frontdesk@harmonymedspa.com",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
}

/* ── Editable field ── */
function Field({ label, value, onChange, icon: Icon, type = "text", readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  icon: React.ElementType; type?: string; readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-[0.09em]"
        style={{ color: DIM }}>
        <Icon size={10} />
        {label}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
        style={{
          backgroundColor: CARD2,
          border: `1px solid ${BORDER}`,
          color: readOnly ? MUTED : TEXT,
          cursor: readOnly ? "default" : "text",
        }}
      />
    </label>
  );
}

export default function SettingsClient() {
  const { profile: authProfile, role } = useAuth();
  const isAdmin   = role === "admin";
  const isEditor  = role === "admin" || role === "editor";

  const [clinic, setClinic] = useState<ClinicProfile>(DEFAULT_PROFILE);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    setClinic(read(PROFILE_KEY, DEFAULT_PROFILE));
  }, []);

  function set(key: keyof ClinicProfile) {
    return (v: string) => setClinic(prev => ({ ...prev, [key]: v }));
  }

  function save() {
    if (!isEditor) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(clinic));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── My Account (read-only from Supabase auth) ── */}
      <section className="rounded-2xl border p-5" style={{ backgroundColor: CARD, borderColor: BORDER }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
            <UserCog size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: TEXT }}>My Account</h2>
            <p className="text-xs" style={{ color: MUTED }}>Your login details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Name"  value={authProfile?.full_name ?? "—"} icon={UserCog} readOnly />
          <Field label="Email" value={authProfile?.email     ?? "—"} icon={Mail}    readOnly />
          <div>
            <span className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-[0.09em]"
              style={{ color: DIM }}>
              <Users size={10} /> Role
            </span>
            <div className="rounded-xl px-3 py-2.5 text-sm"
              style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}` }}>
              <span className="font-bold capitalize"
                style={{ color: role === "admin" ? GOLD : role === "editor" ? TEAL : MUTED }}>
                {role ?? "viewer"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clinic Profile ── */}
      <section className="rounded-2xl border" style={{ backgroundColor: CARD, borderColor: BORDER }}>
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
              <Building2 size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: TEXT }}>Clinic Profile</h2>
              <p className="text-xs" style={{ color: MUTED }}>Basic info used across the dashboard</p>
            </div>
          </div>
          {!isEditor && (
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full"
              style={{ color: MUTED, backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
              View only
            </span>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Clinic Name"      value={clinic.clinicName}     onChange={isEditor ? set("clinicName")     : undefined} icon={Building2} readOnly={!isEditor} />
          <Field label="Phone"            value={clinic.phone}          onChange={isEditor ? set("phone")          : undefined} icon={Phone}     readOnly={!isEditor} type="tel" />
          <Field label="Website"          value={clinic.website}        onChange={isEditor ? set("website")        : undefined} icon={Globe}     readOnly={!isEditor} type="url" />
          <Field label="Booking URL"      value={clinic.bookingUrl}     onChange={isEditor ? set("bookingUrl")     : undefined} icon={BookOpen}  readOnly={!isEditor} type="url" />
          <Field label="Timezone"         value={clinic.timezone}       onChange={isEditor ? set("timezone")       : undefined} icon={Clock}     readOnly={!isEditor} />
          <Field label="Front Desk Email" value={clinic.frontDeskEmail} onChange={isEditor ? set("frontDeskEmail") : undefined} icon={Mail}      readOnly={!isEditor} type="email" />
        </div>

        {isEditor && (
          <div className="px-5 pb-5">
            <button onClick={save}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
              style={{ backgroundColor: saved ? TEAL : GOLD, color: "#0A0A0D" }}>
              {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
              {saved ? "Saved!" : "Save changes"}
            </button>
          </div>
        )}
      </section>

      {/* ── User Management (admin only) ── */}
      {isAdmin && (
        <section className="rounded-2xl border p-5" style={{ backgroundColor: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
              <Users size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: TEXT }}>User Management</h2>
              <p className="text-xs" style={{ color: MUTED }}>Control who can access this dashboard</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { role: "Admin",  desc: "Full access — settings, users, all data",  color: GOLD },
              { role: "Editor", desc: "Can update leads and manage content",        color: TEAL },
              { role: "Viewer", desc: "Read-only access to all dashboard pages",    color: MUTED },
            ].map(r => (
              <div key={r.role} className="rounded-xl p-3"
                style={{ backgroundColor: CARD2, border: `1px solid ${r.color}18` }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-xs font-bold" style={{ color: r.color }}>{r.role}</span>
                </div>
                <p className="text-[11px] leading-4" style={{ color: MUTED }}>{r.desc}</p>
              </div>
            ))}
          </div>

          <Link href="/settings/users"
            className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold"
            style={{ backgroundColor: GOLD, color: "#0A0A0D" }}>
            <Users size={15} />
            Manage Users
          </Link>
        </section>
      )}

    </div>
  );
}
