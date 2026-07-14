"use client";
/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps -- activity recency and the initial cache snapshot are intentionally evaluated once */
import dynamic from "next/dynamic";
import Link from "next/link";
import { Activity, Mail, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import {
  DATA_CACHE_KEYS,
  setCachedData,
  useDashboardCachedData,
} from "@/lib/dashboard-data-cache";
type Lead = {
  id: string;
  status: string;
  source: string;
  utmSource: string;
  createdAt: string;
};
type Message = {
  recipientLeadId: string | null;
  sequence: string | null;
  sentAt: string | null;
};
type Metric = {
  id: string;
  month: string;
  totalVisits: number;
  newPatients: number;
};
const ChartLine = dynamic(() => import("@/components/ui/ChartLine"), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] animate-pulse rounded-xl bg-white/5" />
  ),
});
const ChartDonut = dynamic(() => import("@/components/ui/ChartDonut"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] animate-pulse rounded-xl bg-white/5" />
  ),
});
function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}
function normalizeSource(lead: Lead) {
  const value = (lead.utmSource || lead.source || "Unknown").trim();
  return (
    value
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ") || "Unknown"
  );
}
const LEAD_TO_NEW_PATIENT_RATE = 0.2;
const VISITS_PER_NEW_PATIENT = 1.5;
function leadProjection(leadCount: number) {
  const newPatients = Math.round(leadCount * LEAD_TO_NEW_PATIENT_RATE);
  return {
    newPatients,
    totalVisits: Math.round(newPatients * VISITS_PER_NEW_PATIENT),
  };
}
export default function OverviewClient() {
  const cachedLeads = useDashboardCachedData<{ leads?: Lead[] }>(
    DATA_CACHE_KEYS.leads,
  );
  const [leads, setLeads] = useState<Lead[]>(() => cachedLeads?.leads ?? []),
    [messages, setMessages] = useState<Message[]>([]),
    [metrics, setMetrics] = useState<Metric[]>([]),
    [loading, setLoading] = useState(!cachedLeads?.leads),
    [error, setError] = useState("");
  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/airtable/leads?status=all", { cache: "no-store" }),
        fetch("/api/airtable/message-logs?includeOrphaned=true", {
          cache: "no-store",
        }),
        fetch("/api/airtable/clinic-metrics", { cache: "no-store" }),
      ]);
      const [leadBody, messageBody, metricBody] = await Promise.all(
        responses.map((response) => response.json()),
      );
      if (!responses[0].ok)
        throw new Error(leadBody.error || "Leads could not be loaded");
      if (!responses[1].ok)
        throw new Error(messageBody.error || "Messages could not be loaded");
      setLeads(leadBody.leads ?? []);
      setCachedData(DATA_CACHE_KEYS.leads, leadBody);
      setMessages(messageBody.messageLogs ?? []);
      setMetrics(responses[2].ok ? (metricBody.metrics ?? []) : []);
      if (!responses[2].ok)
        setError(metricBody.error || "Clinic Metrics needs setup");
    } catch (event) {
      setError(
        event instanceof Error
          ? event.message
          : "Overview data could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(!cachedLeads?.leads);
  }, [load]);
  useEffect(() => {
    if (cachedLeads?.leads) setLeads(cachedLeads.leads);
  }, [cachedLeads]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(false);
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  const month = currentMonth(),
    monthMetric = metrics.find((item) => item.month === month),
    monthLeads = leads.filter((lead) => lead.createdAt.slice(0, 7) === month),
    booked = monthLeads.filter((lead) => lead.status === "Booked").length;
  const projection = leadProjection(monthLeads.length);
  const chartMetrics = metrics.length
    ? metrics
    : [{ id: "projection", month, ...projection }];
  const average = useMemo(() => {
    const createdByLead = new Map(
      monthLeads.map((lead) => [lead.id, Date.parse(lead.createdAt)]),
    );
    const earliestValid = new Map<string, number>();
    messages.forEach((message) => {
      if (
        message.sequence !== "Speed-to-Lead" ||
        !message.recipientLeadId ||
        !message.sentAt
      )
        return;
      const created = createdByLead.get(message.recipientLeadId);
      const sent = Date.parse(message.sentAt);
      if (!Number.isFinite(created) || !Number.isFinite(sent) || sent < created!)
        return;
      const current = earliestValid.get(message.recipientLeadId);
      if (current === undefined || sent < current)
        earliestValid.set(message.recipientLeadId, sent);
    });
    const values = monthLeads.flatMap((lead) => {
      const sent = earliestValid.get(lead.id);
      const created = createdByLead.get(lead.id);
      return sent !== undefined && created !== undefined ? [sent - created] : [];
    });
    return values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length / 1000)
      : null;
  }, [messages, monthLeads]);
  const sourceData = useMemo(() => {
    const counts = new Map<string, number>();
    monthLeads.forEach((lead) => {
      const source = normalizeSource(lead);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });
    const colors = ["#4ECDC4", "#C9A84C", "#6BAED6", "#E6AD55", "#9292A0"];
    return [...counts].map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  }, [monthLeads]);
  const recentSpeed = messages.some(
      (message) =>
        message.sequence === "Speed-to-Lead" &&
        Date.parse(message.sentAt ?? "") > Date.now() - 30 * 86400000,
    ),
    recentNurture = messages.some(
      (message) =>
        message.sequence === "14-Day Nurture" &&
        Date.parse(message.sentAt ?? "") > Date.now() - 30 * 86400000,
    );
  if (loading)
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          title={monthMetric ? "Total Visits This Month" : "Projected Visits This Month"}
          value={monthMetric ? monthMetric.totalVisits : projection.totalVisits}
          subtitle={
            monthMetric
              ? "Recorded clinic visits"
              : "Estimate · 20% conversion × 1.5 visits"
          }
          color="teal"
        />
        <KPICard
          title={monthMetric ? "New Patients This Month" : "Projected New Patients"}
          value={monthMetric ? monthMetric.newPatients : projection.newPatients}
          subtitle={
            monthMetric
              ? "Recorded first-time patients"
              : "Estimate · 20% of this month's Leads"
          }
          color="green"
        />
        <KPICard
          title="Total Leads This Month"
          value={monthLeads.length}
          subtitle="Created this month"
          color="teal"
        />
        <KPICard
          title="Avg Speed-to-Lead"
          value={average ?? "Pending"}
          suffix={average !== null ? " sec" : undefined}
          subtitle={
            average !== null
              ? "First outbound response"
              : "Waiting for a Lead-linked sent time"
          }
          color="green"
        />
        <KPICard
          title="Leads Converted to Booked"
          value={
            monthLeads.length
              ? `${Math.round((booked / monthLeads.length) * 100)}%`
              : "—"
          }
          subtitle={
            monthLeads.length
              ? `${booked} of ${monthLeads.length} Leads booked`
              : "No Leads in this period"
          }
          color="teal"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel title="Lead Source Breakdown" action="Current month">
            {sourceData.length ? (
              <ChartDonut data={sourceData} height={220} />
            ) : (
              <Empty text="Source distribution will appear as new Leads arrive." />
            )}
          </Panel>
          <Panel
            title="Visits vs New Patients"
            action={metrics.length ? "Monthly history" : "Lead-based projection"}
          >
            <ChartLine
                data={chartMetrics.map((item) => ({
                  date: item.month,
                  visits: item.totalVisits,
                  newPatients: item.newPatients,
                }))}
                xKey="date"
                lines={[
                  { key: "visits", label: "Total Visits", color: "#C9A84C" },
                  {
                    key: "newPatients",
                    label: "New Patients",
                    color: "#4ECDC4",
                  },
                ]}
                height={240}
              />
            {!metrics.length && (
              <div className="mt-3 text-center">
                <Link
                  href="/leads"
                  className="text-xs font-semibold text-[#C9A84C] hover:text-[#E1C56E]"
                >
                  Replace projection with clinic totals →
                </Link>
              </div>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Built Automations" action="Last 30 days">
            <div className="space-y-3">
              {[
                { name: "Speed-to-Lead", recent: recentSpeed, Icon: Zap },
                { name: "14-Day Nurture", recent: recentNurture, Icon: Mail },
              ].map(({ name, recent, Icon }) => (
                <div
                  key={name}
                  className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"
                >
                  <span className="flex items-center gap-2 text-sm text-[#F0ECE4]">
                    <Icon size={15} className="text-[#C9A84C]" />
                    {name}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: recent ? "#4ECDC4" : "#9292A0" }}
                  >
                    {recent ? "Recent activity" : "No recent activity"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#C9A84C]/15 bg-[#111117] p-5">
      <div className="mb-4 flex justify-between">
        <h2 className="font-serif text-lg text-[#F0ECE4]">{title}</h2>
        <span className="text-xs text-[#9292A0]">{action}</span>
      </div>
      {children}
    </section>
  );
}
function Empty({ text, action = false }: { text: string; action?: boolean }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5">
        <Activity size={18} className="text-[#C9A84C]" />
      </div>
      <p className="max-w-sm text-sm leading-6 text-[#9292A0]">{text}</p>
      {action && (
        <Link
          href="/leads"
          className="mt-5 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 text-sm font-semibold text-[#E1C56E] transition-colors hover:bg-[#C9A84C]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
        >
          Update clinic metrics
        </Link>
      )}
    </div>
  );
}
