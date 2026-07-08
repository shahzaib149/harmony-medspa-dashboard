"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";

type IntegrationStatus = {
  id: string;
  name: string;
  status: "connected" | "partial" | "missing" | "error";
  detail: string;
  required: string[];
  configured: string[];
  missing: string[];
  checkedAt: string;
  actionHref?: string;
};

type StatusResponse = {
  checkedAt: string;
  connected: number;
  total: number;
  errors: number;
  environment: string;
  appUrl: string;
  integrations: IntegrationStatus[];
};

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Marketing" | "Front Desk" | "Read Only";
  status: "Active" | "Invited";
};

type ClinicProfile = {
  clinicName: string;
  phone: string;
  website: string;
  bookingUrl: string;
  timezone: string;
  frontDeskEmail: string;
};

type AutomationKey = "speedToLead" | "pendingAds" | "aiSuggestions" | "reviewDrafts" | "leadWebhook";

const GOLD = "#C9A84C";
const CARD = "#111117";
const CARD2 = "#0D0D12";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT = "#F0ECE4";
const MUTED = "#7A7A8A";
const DIM = "#5A5A6A";
const TEAL = "#2DD4BF";

const STAFF_KEY = "harmony_settings_staff_v1";
const PROFILE_KEY = "harmony_settings_profile_v1";
const AUTOMATION_KEY = "harmony_settings_automations_v1";

const defaultStaff: StaffMember[] = [
  { id: "owner", name: "Clinic Owner", email: "owner@harmonymedspa.com", role: "Owner", status: "Active" },
  { id: "front-desk", name: "Front Desk", email: "frontdesk@harmonymedspa.com", role: "Front Desk", status: "Active" },
  { id: "marketing", name: "Marketing Admin", email: "marketing@harmonymedspa.com", role: "Marketing", status: "Active" },
];

const defaultProfile: ClinicProfile = {
  clinicName: "Harmony MedSpa",
  phone: "(941) 306-3696",
  website: "https://www.harmonymedspafl.com/",
  bookingUrl: "https://na02.patientnow.com/a/HARMONYMEDSPA/OnlineBooking.aspx",
  timezone: "America/New_York",
  frontDeskEmail: "frontdesk@harmonymedspa.com",
};

const defaultAutomations: Record<AutomationKey, boolean> = {
  speedToLead: true,
  pendingAds: true,
  aiSuggestions: true,
  reviewDrafts: false,
  leadWebhook: true,
};

const automationLabels: Array<{ key: AutomationKey; label: string; detail: string }> = [
  { key: "speedToLead", label: "Speed-to-lead follow up", detail: "Lead form to staff and patient response flow" },
  { key: "pendingAds", label: "Pending ad approval", detail: "Show Make.com generated ads for approval" },
  { key: "aiSuggestions", label: "AI ad suggestions", detail: "Generate ad copy from Google Ads and website data" },
  { key: "reviewDrafts", label: "Review reply drafts", detail: "Draft responses for Google Business Profile reviews" },
  { key: "leadWebhook", label: "Lead capture webhook", detail: "Send public lead form submissions to automation" },
];

const integrationIcons: Record<string, React.ElementType> = {
  airtable: Database,
  "google-ads": SlidersHorizontal,
  "google-business": Building2,
  anthropic: Bot,
  supabase: ShieldCheck,
  "lead-form": Mail,
};

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function statusColor(status: IntegrationStatus["status"]) {
  if (status === "connected") return TEAL;
  if (status === "partial") return GOLD;
  if (status === "error") return "#F87171";
  return DIM;
}

function StatusPill({ status }: { status: IntegrationStatus["status"] }) {
  const color = statusColor(status);
  const Icon = status === "connected" ? CheckCircle2 : status === "error" ? XCircle : AlertTriangle;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ color, backgroundColor: `${color}15` }}>
      <Icon size={12} />
      {status}
    </span>
  );
}

function Panel({ title, icon: Icon, children, action }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
            <Icon size={18} />
          </div>
          <h2 className="text-sm font-bold" style={{ color: TEXT }}>{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ backgroundColor: checked ? GOLD : "#2A2A32" }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ left: checked ? 23 : 4 }}
      />
    </button>
  );
}

function Field({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: DIM }}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, color: TEXT }}
      />
    </label>
  );
}

export default function SettingsClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>(defaultStaff);
  const [profile, setProfile] = useState<ClinicProfile>(defaultProfile);
  const [automations, setAutomations] = useState<Record<AutomationKey, boolean>>(defaultAutomations);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffMember["role"]>("Front Desk");
  const [saved, setSaved] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/status", { cache: "no-store" });
      const data = await res.json() as StatusResponse & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Status check failed (${res.status})`);
      setStatus(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setStaff(readStored(STAFF_KEY, defaultStaff));
    setProfile(readStored(PROFILE_KEY, defaultProfile));
    setAutomations(readStored(AUTOMATION_KEY, defaultAutomations));
    queueMicrotask(() => { void loadStatus(); });
  }, [loadStatus]);

  const health = useMemo(() => {
    if (!status) return 0;
    return Math.round((status.connected / status.total) * 100);
  }, [status]);

  function saveAll() {
    writeStored(STAFF_KEY, staff);
    writeStored(PROFILE_KEY, profile);
    writeStored(AUTOMATION_KEY, automations);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function addInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || staff.some((member) => member.email.toLowerCase() === email)) return;
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setStaff((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, email, role: inviteRole, status: "Invited" },
    ]);
    setInviteEmail("");
  }

  function removeMember(id: string) {
    setStaff((prev) => prev.filter((member) => member.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="rounded-2xl p-5 xl:col-span-2" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>System Health</p>
              <h1 className="mt-1 text-2xl font-bold" style={{ color: TEXT }}>
                {status ? `${status.connected}/${status.total} connected` : "Checking connections"}
              </h1>
              <p className="mt-1 text-sm" style={{ color: MUTED }}>
                {status ? `Environment: ${status.environment}` : "Running server-side checks"}
              </p>
            </div>
            <button
              onClick={loadStatus}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold"
              style={{ border: `1px solid ${BORDER}`, color: loading ? DIM : GOLD }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "#25252D" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${health}%`, backgroundColor: health >= 70 ? TEAL : GOLD }} />
          </div>
          {error && <p className="mt-3 text-sm" style={{ color: "#F87171" }}>{error}</p>}
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: DIM }}>App URL</p>
          <p className="mt-2 truncate text-sm font-semibold" style={{ color: TEXT }}>{status?.appUrl ?? "http://localhost:3000"}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>{status?.checkedAt ? new Date(status.checkedAt).toLocaleString() : "Waiting for check"}</p>
        </div>

        <div className="rounded-2xl p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: DIM }}>Security</p>
          <p className="mt-2 text-sm font-semibold" style={{ color: TEXT }}>{status?.errors ? `${status.errors} issue${status.errors === 1 ? "" : "s"}` : "No API errors"}</p>
          <p className="mt-1 text-xs" style={{ color: MUTED }}>Debug routes should stay private in production.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <Panel title="Integrations" icon={KeyRound}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(status?.integrations ?? []).map((item) => {
                const Icon = integrationIcons[item.id] ?? KeyRound;
                const color = statusColor(item.status);
                return (
                  <div key={item.id} className="rounded-2xl p-4" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}14`, color }}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{item.name}</p>
                          <p className="mt-0.5 truncate text-xs" style={{ color: MUTED }}>{item.detail}</p>
                        </div>
                      </div>
                      <StatusPill status={item.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.configured.slice(0, 3).map((key) => (
                        <span key={key} className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ color: TEAL, backgroundColor: `${TEAL}12` }}>{key}</span>
                      ))}
                      {item.missing.slice(0, 3).map((key) => (
                        <span key={key} className="rounded-full px-2 py-1 text-[10px] font-semibold" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.1)" }}>{key}</span>
                      ))}
                    </div>
                    {item.actionHref && (
                      <a href={item.actionHref} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: GOLD }}>
                        Connect <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                );
              })}
              {!status && (
                <div className="col-span-full flex items-center gap-2 py-10 text-sm" style={{ color: MUTED }}>
                  <Loader2 size={16} className="animate-spin" /> Loading integration status
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Clinic Profile" icon={Building2}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Clinic Name" value={profile.clinicName} onChange={(value) => setProfile((prev) => ({ ...prev, clinicName: value }))} />
              <Field label="Phone" value={profile.phone} onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))} />
              <Field label="Website" value={profile.website} onChange={(value) => setProfile((prev) => ({ ...prev, website: value }))} />
              <Field label="Booking URL" value={profile.bookingUrl} onChange={(value) => setProfile((prev) => ({ ...prev, bookingUrl: value }))} />
              <Field label="Timezone" value={profile.timezone} onChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))} />
              <Field label="Front Desk Email" value={profile.frontDeskEmail} onChange={(value) => setProfile((prev) => ({ ...prev, frontDeskEmail: value }))} />
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Panel title="Account Access" icon={Users}>
            <div className="space-y-3">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}` }}>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${GOLD}12`, color: GOLD }}>
                    <UserCog size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{member.name}</p>
                    <p className="truncate text-xs" style={{ color: MUTED }}>{member.email}</p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(event) => {
                      const role = event.target.value as StaffMember["role"];
                      setStaff((prev) => prev.map((item) => item.id === member.id ? { ...item, role } : item));
                    }}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ backgroundColor: "#18181F", border: `1px solid ${BORDER}`, color: TEXT }}
                  >
                    {["Owner", "Manager", "Marketing", "Front Desk", "Read Only"].map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                  {member.id !== "owner" && (
                    <button onClick={() => removeMember(member.id)} className="p-1.5" style={{ color: "#F87171" }} aria-label={`Remove ${member.name}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@example.com"
                className="rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, color: TEXT }}
              />
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as StaffMember["role"])}
                className="rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}`, color: TEXT }}
              >
                {["Manager", "Marketing", "Front Desk", "Read Only"].map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
              <button onClick={addInvite} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
                style={{ backgroundColor: GOLD, color: "#0A0A0D" }}>
                <Plus size={15} /> Invite
              </button>
            </div>
          </Panel>

          <Panel title="Automations" icon={SlidersHorizontal}>
            <div className="space-y-3">
              {automationLabels.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl p-3" style={{ backgroundColor: CARD2, border: `1px solid ${BORDER}` }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: TEXT }}>{item.label}</p>
                    <p className="mt-0.5 text-xs" style={{ color: MUTED }}>{item.detail}</p>
                  </div>
                  <Toggle
                    checked={automations[item.key]}
                    onChange={(next) => setAutomations((prev) => ({ ...prev, [item.key]: next }))}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <button
            onClick={saveAll}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
            style={{ backgroundColor: saved ? TEAL : GOLD, color: "#0A0A0D" }}
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? "Saved" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
