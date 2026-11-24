"use client";


import { LoadingRegion, Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Activity,
  Check,
  Copy,
  Download,
  Mail,
  Loader2,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  FileUp,
  X
} from "lucide-react";
import type { Lead } from "@/app/api/airtable/leads/route";
import { useAuth } from "@/contexts/AuthContext";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import {
  DATA_CACHE_KEYS,
  setCachedData,
  useDashboardCachedData
} from "@/lib/dashboard-data-cache";
import { LeadCampaignBadges } from "@/components/campaigns/CampaignBadges";
import dynamic from "next/dynamic";
import { DestructiveConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Toast } from "@/components/ui/Toast";
import UpdateClinicMetricsModal from "@/components/leads/UpdateClinicMetricsModal";
import CallLeadsPanel from "@/components/overview/CallLeadsPanel";
import { downloadLeadExport } from "@/lib/leads/download-export";
import { callMetrics, callWindowForRange, filterCallLeads, type CallStatusFilter } from "@/lib/leads/call-filter";
import { groupCallSources } from "@/lib/leads/call-records";
import { useCallLeads } from "@/lib/leads/use-call-leads";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import { dateRangeParams, resolveDateRange } from "@/lib/date-range";
import { adCampaignLabel, adGroupLabel, callSourceLabel } from "@/lib/google/campaign-registry";
import {
  DEFAULT_LEAD_VIEW,
  leadBelongsToView,
  normalizeLeadView,
  type LeadView
} from "@/lib/leads/view";
import type {
  LeadSummaryMetrics,
  LeadViewCounts
} from "@/lib/leads/summary";
import { GiftCardsTable } from "@/components/leads/GiftCardParts";
import {
  AI_TAGS,
  BLACK_FRIDAY_OFFER_CODE,
  isAiTag,
  LEAD_TYPES,
  NOT_A_LEAD_FILTER,
  type LeadType
} from "@/lib/leads/classification";

const AddLeadsToCampaignModal = dynamic(() => import("@/components/campaigns/AddLeadsToCampaignModal"));

import {
  GOLD,
  BG,
  PANEL,
  CARD,
  CARD_HOVER,
  TEXT,
  MUTED,
  DIM,
  BORDER,
  BORDER_SOFT,
  TEAL,
  STATUS_CONFIG,
  STATUS_OPTIONS,
  STATUS_FILTER_OPTIONS,
  LEAD_DATE_PRESETS,
  VIEW_OPTIONS,
  CALLS_VIEW,
  CALLS_TAB,
  normalize,
  normalizePhone,
  timeAgo,
  initials,
  sourceLabel,
  lastContacted,
  lastActivity,
  StatusPill,
  DeliveryPill,
  NotifyHaydenButton,
  LeadClassificationChips,
  SelectControl,
  StatCard,
  SummarySkeleton,
  summaryCardsFor,
  AdCampaignBreakdownPanel,
  LeadTicker,
  AD_CAMPAIGN_OPTIONS,
  adCampaignFilterLabel,
  LeadDetailsModal
} from "@/components/leads/LeadUi";
import type { SentFilter, LatestLead, LeadSummaryApiResponse } from "@/components/leads/LeadUi";

type LeadForm = { name: string; phone: string; email: string; treatment: string; message: string };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += character;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function AddLeadModal({
  open,
  saving,
  error,
  onClose,
  onSubmit
}: {
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (form: LeadForm) => Promise<void>;
}) {
  const [form, setForm] = useState<LeadForm>({
    name: "",
    phone: "",
    treatment: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>(
    {},
  );

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open, saving]);

  useEffect(() => {
    if (open) {
      setForm({ name: "", phone: "", email: "", treatment: "", message: "" });
      setErrors({});
    }
  }, [open]);

  if (!open) return null;
  const fieldStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: BORDER_SOFT,
    color: TEXT
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof LeadForm, string>> = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSubmit(form);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-lead-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close add lead modal"
        onClick={() => !saving && onClose()}
      />
      <div
        className="relative flex h-dvh max-h-dvh w-full max-w-[590px] flex-col overflow-hidden border sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl"
        style={{
          background:
            "linear-gradient(145deg, var(--brand-primary-soft), transparent 34%), var(--surface-raised)",
          borderColor: "var(--border-strong)",
          boxShadow: "var(--shadow-modal)"
        }}
      >
        <div
          className="mobile-safe-top flex shrink-0 items-start justify-between border-b px-4 py-4 sm:px-6 sm:py-5"
          style={{ borderColor: BORDER }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[.13em]"
              style={{ color: GOLD }}
            >
              New opportunity
            </p>
            <h2
              id="add-lead-title"
              className="mt-1 text-xl font-extrabold"
              style={{ color: TEXT }}
            >
              Add Lead
            </h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              Create a new lead directly in Airtable.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid size-11 shrink-0 place-items-center rounded-xl border disabled:opacity-40"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <form
          onSubmit={submit}
          noValidate
          className="mobile-safe-bottom flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                {
                  key: "name",
                  label: "Full Name *",
                  type: "text",
                  placeholder: "e.g. Olivia Bennett",
                  autoFocus: true
                },
                {
                  key: "phone",
                  label: "Phone Number *",
                  type: "tel",
                  placeholder: "e.g. (555) 123-4567"
                },
                {
                  key: "email",
                  label: "Email Address",
                  type: "email",
                  placeholder: "olivia@example.com"
                },
                {
                  key: "treatment",
                  label: "Treatment Interest",
                  type: "text",
                  placeholder: "e.g. Female Weight Loss Consult"
                },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className={item.key === "email" || item.key === "treatment" ? "sm:col-span-2" : ""}
              >
                <span
                  className="mb-1.5 block text-xs font-bold"
                  style={{ color: TEXT }}
                >
                  {item.label}
                </span>
                <input
                  autoFocus={"autoFocus" in item}
                  type={item.type}
                  value={form[item.key]}
                  onChange={(e) => {
                    setForm({ ...form, [item.key]: e.target.value });
                    setErrors({ ...errors, [item.key]: undefined });
                  }}
                  placeholder={item.placeholder}
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus-visible:border-[var(--focus)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                  style={{
                    ...fieldStyle,
                    borderColor: errors[item.key]
                      ? "var(--danger-border)"
                      : BORDER_SOFT
                  }}
                />
                {errors[item.key] && (
                  <span className="mt-1 block text-xs text-[var(--danger-text)]">
                    {errors[item.key]}
                  </span>
                )}
              </label>
            ))}
          </div>

          <label>
            <span
              className="mb-1.5 block text-xs font-bold"
              style={{ color: TEXT }}
            >
              Message / Notes
            </span>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="Add context or follow-up notes..."
              className="w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus-visible:border-[var(--focus)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              style={fieldStyle}
            />
          </label>
          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border p-3 text-sm text-[var(--danger-text)]"
              style={{
                backgroundColor: "var(--danger-bg)",
                borderColor: "var(--danger-border)"
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <div
            className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t px-4 pb-1 pt-4 min-[380px]:flex-row min-[380px]:justify-end sm:static sm:mx-0 sm:px-0 sm:pt-5"
            style={{ borderColor: BORDER, backgroundColor: "var(--surface-raised)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40"
              style={{ color: TEXT, borderColor: BORDER_SOFT, backgroundColor: CARD }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-11 min-w-[126px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                color: "var(--primary-foreground)",
                backgroundColor: "var(--brand-primary)"
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { can, role } = useAuth();
  const canUpdateLeads = can("update:leads");
  const canDeleteLeads = can("delete:leads");
  const activeView = normalizeLeadView(searchParams.get("view"));
  const activeViewOption = VIEW_OPTIONS.find((option) => option.value === activeView) ?? VIEW_OPTIONS[0];
  const pageSize = [20, 30, 50].includes(Number(searchParams.get("pageSize"))) ? Number(searchParams.get("pageSize")) : 20;
  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageIndex = currentPage - 1;
  const currentCursor = searchParams.get("cursor")?.trim() || null;
  const searchQuery = searchParams.get("search")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "all";
  const sourceFilter = searchParams.get("source")?.trim() || "all";
  const callsTab = searchParams.get("view") === CALLS_VIEW || sourceFilter === "Call Leads";
  const viewParam = callsTab ? CALLS_VIEW : activeView;
  const callSourceFilter = searchParams.get("callSource")?.trim() || "all";
  const callStatusParam = searchParams.get("callStatus");
  const callStatusFilter: CallStatusFilter = callStatusParam === "answered" || callStatusParam === "missed" ? callStatusParam : "all";
  const needsDetailsFilter = searchParams.get("needs") === "1";
  const dateParam = searchParams.get("date");
  const dateSelection = useMemo(
    () => ({ preset: dateParam, month: searchParams.get("month"), from: searchParams.get("from"), to: searchParams.get("to") }),
    [dateParam, searchParams],
  );
  const dateResult = useMemo(() => resolveDateRange(dateSelection, { presets: LEAD_DATE_PRESETS }), [dateSelection]);
  // An invalid shared link (e.g. end date in the future) falls back to all dates.
  const dateRange = dateResult?.ok ? dateResult.range : null;
  const dateFrom = dateRange?.from ?? null;
  const dateTo = dateRange?.to ?? null;
  const smsParam = searchParams.get("smsStatus");
  const smsFilter: SentFilter = smsParam === "sent" || smsParam === "not_sent" ? smsParam : "all";
  const emailParam = searchParams.get("emailStatus");
  const emailFilter: SentFilter = emailParam === "sent" || emailParam === "not_sent" ? emailParam : "all";
  const campaignFilter = searchParams.get("campaign")?.trim() || "all";
  const adCampaignFilter = searchParams.get("adCampaign")?.trim() || "all";
  const campaignStatusFilter = searchParams.get("campaignStatus")?.trim() || "all";
  const campaignStepFilter = searchParams.get("campaignStep")?.trim() || "all";
  const leadTypeFilter = searchParams.get("leadType")?.trim() || "all";
  const offerCodeFilter = searchParams.get("offerCode")?.trim() || "all";
  const tagsParam = searchParams.get("tags") ?? "";
  const tagFilter = useMemo(() => tagsParam.split(",").map((tag) => tag.trim()).filter(isAiTag), [tagsParam]);
  const tagFilterKey = tagFilter.join(",");
  const filterQuery = useMemo(() => {
    const params = new URLSearchParams({ view: activeView });
    if (searchQuery) params.set("search", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sourceFilter !== "all") params.set("source", sourceFilter);
    if (smsFilter !== "all") params.set("smsStatus", smsFilter);
    if (emailFilter !== "all") params.set("emailStatus", emailFilter);
    if (campaignFilter !== "all") params.set("campaign", campaignFilter);
    if (adCampaignFilter !== "all") params.set("adCampaign", adCampaignFilter);
    if (campaignStatusFilter !== "all") params.set("campaignStatus", campaignStatusFilter);
    if (campaignStepFilter !== "all") params.set("campaignStep", campaignStepFilter);
    if (leadTypeFilter !== "all") params.set("leadType", leadTypeFilter);
    if (offerCodeFilter !== "all") params.set("offerCode", offerCodeFilter);
    if (tagFilterKey) params.set("tags", tagFilterKey);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [activeView, adCampaignFilter, campaignFilter, campaignStatusFilter, campaignStepFilter, dateFrom, dateTo, emailFilter, leadTypeFilter, offerCodeFilter, searchQuery, smsFilter, sourceFilter, statusFilter, tagFilterKey]);
  const noExtraFilters = !searchQuery && statusFilter === "all" && sourceFilter === "all" && !dateRange && smsFilter === "all" && emailFilter === "all" && campaignFilter === "all" && adCampaignFilter === "all" && campaignStatusFilter === "all" && campaignStepFilter === "all" && leadTypeFilter === "all" && offerCodeFilter === "all" && !tagFilterKey;
  const cachedLeads = useDashboardCachedData<{ leads?: Lead[]; view?: LeadView; nextCursor?: string | null; visibleFrom?: number; visibleTo?: number }>(
    DATA_CACHE_KEYS.leads,
  );
  const useCachedFirstPage = pageSize === 20 && currentPage === 1 && activeView === DEFAULT_LEAD_VIEW && cachedLeads?.view === DEFAULT_LEAD_VIEW && noExtraFilters;
  const [leads, setLeads] = useState<Lead[]>(() => useCachedFirstPage ? cachedLeads?.leads ?? [] : []);
  const [loading, setLoading] = useState(() => !useCachedFirstPage);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadSummary, setLeadSummary] = useState<LeadSummaryMetrics | null>(null);
  const [viewCounts, setViewCounts] = useState<LeadViewCounts | null>(null);
  const [latestLeadOverall, setLatestLeadOverall] = useState<LatestLead | null>(null);
  const [allSources, setAllSources] = useState<string[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchQuery);
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>(() => {
    const history = Array<string | null>(currentPage).fill(null);
    history[pageIndex] = currentCursor;
    return history;
  });
  const [nextCursor, setNextCursor] = useState<string | null>(cachedLeads?.nextCursor ?? null);
  const [visibleRange, setVisibleRange] = useState({ from: cachedLeads?.visibleFrom ?? (leads.length ? 1 : 0), to: cachedLeads?.visibleTo ?? leads.length });
  const requestRef = useRef<AbortController | null>(null);
  const summaryRequestRef = useRef<AbortController | null>(null);
  const hasLoadedRowsRef = useRef(useCachedFirstPage);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleteImpact, setDeleteImpact] = useState<{
    nurtureEnrollments: number;
    messageLogs: number;
    activeCampaign: string;
  } | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [campaignLead, setCampaignLead] = useState<Lead | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [updatingReplied, setUpdatingReplied] = useState<Set<string>>(
    new Set(),
  );
  const [notifyingHayden, setNotifyingHayden] = useState<Set<string>>(new Set());
  const [notifiedHayden, setNotifiedHayden] = useState<Set<string>>(new Set());
  const [reclassifying, setReclassifying] = useState(false);
  const [importingLeads, setImportingLeads] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const callData = useCallLeads();

  const updateQuery = useCallback((updates: Record<string, string | null>, options: { push?: boolean; resetPagination?: boolean } = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewParam);
    for (const [key, value] of Object.entries(updates)) {
      if (!value || (value === "all" && key !== "view")) params.delete(key);
      else params.set(key, value);
    }
    if (options.resetPagination !== false) {
      params.delete("cursor");
      params.delete("page");
    }
    const href = `/leads?${params.toString()}`;
    if (options.push) router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  }, [viewParam, router, searchParams]);

  function setDateRange(selection: Parameters<typeof dateRangeParams>[1]) {
    setCursorHistory([null]);
    updateQuery(dateRangeParams("date", selection));
  }

  function setFilterParam(key: string, value: string) {
    setCursorHistory([null]);
    if (key === "date") {
      updateQuery(dateRangeParams("date", { preset: value }));
      return;
    }
    if (key === "source" && value === "Call Leads") {
      openCallsTab();
      return;
    }
    updateQuery({ [key]: value });
  }

  function openCallsTab(push = false) {
    setCursorHistory([null]);
    setSearch("");
    setFiltersOpen(false);
    // Patient-only filters don't apply to calls; the date range does, so it stays.
    updateQuery({ view: CALLS_VIEW, source: null, search: null, status: null,
      campaign: null, adCampaign: null, campaignStatus: null, campaignStep: null, smsStatus: null,
      emailStatus: null, leadType: null, offerCode: null, tags: null, lead: null }, { push });
  }

  function clearFilters(clearSearch = false) {
    setCursorHistory([null]);
    updateQuery({
      campaign: null,
      adCampaign: null,
      campaignStatus: null,
      campaignStep: null,
      status: null,
      source: null,
      date: null,
      month: null,
      from: null,
      to: null,
      smsStatus: null,
      emailStatus: null,
      leadType: null,
      offerCode: null,
      tags: null,
      callSource: null,
      callStatus: null,
      needs: null,
      ...(clearSearch ? { search: null } : {})
    });
    if (clearSearch) setSearch("");
  }

  useEffect(() => {
    // Old call links (?source=Call+Leads) open the Call Leads tab; ?call= is kept.
    if (sourceFilter === "Call Leads") updateQuery({ view: CALLS_VIEW, source: null }, { resetPagination: false });
    else if (searchParams.get("view") !== viewParam) updateQuery({}, { resetPagination: false });
  }, [viewParam, searchParams, sourceFilter, updateQuery]);

  useEffect(() => setSearch(searchQuery), [searchQuery]);

  useEffect(() => {
    if (search.trim() === searchQuery) return;
    const timer = window.setTimeout(() => {
      setCursorHistory([null]);
      updateQuery({ search: search.trim() || null });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, searchQuery, updateQuery]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!actionsOpen) return;
    const close = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [actionsOpen]);

  const deepLinkLeadId = searchParams.get("lead");
  useEffect(() => {
    if (!deepLinkLeadId || !/^rec[a-zA-Z0-9]{14}$/.test(deepLinkLeadId)) return;
    const onPage = leads.find((lead) => lead.id === deepLinkLeadId);
    if (onPage) {
      setSelectedLead(onPage);
      return;
    }
    if (loading) return;
    // Notification emails link straight to a lead; fetch it directly if it is not on this page.
    const controller = new AbortController();
    void fetch(`/api/airtable/leads?view=all&pageSize=20&recordId=${deepLinkLeadId}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<{ leads?: Lead[] }>)
      .then((data) => {
        const match = data.leads?.find((lead) => lead.id === deepLinkLeadId);
        if (match) setSelectedLead(match);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [deepLinkLeadId, leads, loading]);

  const load = useCallback(async (showLoading = true, cursor: string | null = null, pageNumber = 1) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams(filterQuery);
      params.set("pageSize", String(pageSize));
      params.set("page", String(pageNumber));
      params.set("sort", "newest");
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/airtable/leads?${params}`, {
        cache: "no-store",
        signal: controller.signal
      });
      const data = (await res.json()) as { leads?: Lead[]; nextCursor?: string | null; visibleFrom?: number; visibleTo?: number; error?: string };
      if (!res.ok || data.error)
        throw new Error(data.error ?? "Could not load leads");
      setLeads(data.leads ?? []);
      setNextCursor(data.nextCursor ?? null);
      setVisibleRange({ from: data.visibleFrom ?? 0, to: data.visibleTo ?? 0 });
      if (pageNumber === 1 && pageSize === 20 && activeView === DEFAULT_LEAD_VIEW && noExtraFilters) setCachedData(DATA_CACHE_KEYS.leads, data);
      return true;
    } catch (event) {
      if (event instanceof DOMException && event.name === "AbortError") return false;
      setError(String(event));
      return false;
    } finally {
      if (requestRef.current === controller) {
        hasLoadedRowsRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeView, filterQuery, noExtraFilters, pageSize, setLeads]);

  const loadSummary = useCallback(async (showLoading = true) => {
    summaryRequestRef.current?.abort();
    const controller = new AbortController();
    summaryRequestRef.current = controller;
    if (showLoading) {
      setSummaryLoading(true);
      setLeadSummary(null);
      setViewCounts(null);
    } else {
      setSummaryRefreshing(true);
    }
    setSummaryError(null);
    try {
      const response = await fetch(`/api/airtable/leads/summary?${filterQuery}`, {
        cache: "no-store",
        signal: controller.signal
      });
      const data = (await response.json()) as LeadSummaryApiResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Lead summary could not be loaded.");
      }
      if (data.configured === false || !data.summary || !data.viewCounts) {
        throw new Error("Airtable Lead data is not available.");
      }
      setLeadSummary(data.summary);
      setViewCounts(data.viewCounts);
      setLatestLeadOverall(data.latestLead ?? null);
      if (data.sources?.length) setAllSources(data.sources);
      return true;
    } catch (event) {
      if (event instanceof DOMException && event.name === "AbortError") return false;
      setLeadSummary(null);
      setViewCounts(null);
      setLatestLeadOverall(null);
      setSummaryError(
        event instanceof Error ? event.message : "Lead summary could not be loaded.",
      );
      return false;
    } finally {
      if (summaryRequestRef.current === controller) {
        setSummaryLoading(false);
        setSummaryRefreshing(false);
      }
    }
  }, [filterQuery]);

  useEffect(() => {
    setCursorHistory((current) => {
      const next = current.slice();
      next[pageIndex] = currentCursor;
      return next;
    });
    void load(!hasLoadedRowsRef.current, currentCursor, currentPage);
    return () => requestRef.current?.abort();
  }, [activeView, filterQuery, currentCursor, currentPage, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadSummary(true);
    return () => summaryRequestRef.current?.abort();
  }, [loadSummary]);

  useEffect(() => {
    const refresh = () => {
      void Promise.all([
        load(false, currentCursor, currentPage),
        loadSummary(false),
      ]);
    };
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [currentCursor, currentPage, load, loadSummary]);

  const duplicateKeys = useMemo(() => {
    const emailCounts = new Map<string, number>();
    const phoneCounts = new Map<string, number>();
    leads.forEach((lead) => {
      const email = normalize(lead.email);
      const phone = normalizePhone(lead.phone);
      if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
      if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
    });
    return { emailCounts, phoneCounts };
  }, [leads]);

  const isDuplicateLead = useCallback(
    (lead: Lead) => {
      const email = normalize(lead.email);
      const phone = normalizePhone(lead.phone);
      return Boolean(
        lead.duplicate ||
        lead.status.toLowerCase() === "duplicate" ||
        (email && (duplicateKeys.emailCounts.get(email) ?? 0) > 1) ||
        (phone && (duplicateKeys.phoneCounts.get(phone) ?? 0) > 1),
      );
    },
    [duplicateKeys],
  );

  const sources = useMemo(() => {
    const values = Array.from(
      new Set([
        "Call Leads",
        ...allSources,
        ...leads.map((lead) => sourceLabel(lead.source)).filter(Boolean),
        ...(sourceFilter !== "all" ? [sourceFilter] : []),
      ]),
    ).sort();
    return [
      { label: "All sources", value: "all" },
      ...values.map((source) => ({ label: source, value: source })),
    ];
  }, [allSources, leads, sourceFilter]);

  const filtered = leads;
  const filterChips = [
    campaignFilter !== "all" ? { key: "campaign", label: `Campaign: ${campaignFilter === "speed-to-lead" ? "Speed-to-Lead" : campaignFilter === "14-day-nurture" ? "14-Day Nurture" : "None"}` } : null,
    campaignStatusFilter !== "all" ? { key: "campaignStatus", label: `Campaign status: ${campaignStatusFilter}` } : null,
    campaignStepFilter !== "all" ? { key: "campaignStep", label: `Step: ${campaignStepFilter}` } : null,
    statusFilter !== "all" ? { key: "status", label: `Lead status: ${statusFilter}` } : null,
    sourceFilter !== "all" ? { key: "source", label: `Source: ${sourceFilter}` } : null,
    adCampaignFilter !== "all" ? { key: "adCampaign", label: `Ad campaign: ${adCampaignFilter === "google-ads" ? "All Google Ads" : adCampaignFilterLabel(adCampaignFilter)}` } : null,
    dateRange ? { key: "date", label: dateRange.label } : null,
    smsFilter !== "all" ? { key: "smsStatus", label: smsFilter === "sent" ? "SMS sent" : "SMS not sent" } : null,
    emailFilter !== "all" ? { key: "emailStatus", label: emailFilter === "sent" ? "Email sent" : "Email not sent" } : null,
    leadTypeFilter !== "all" ? { key: "leadType", label: leadTypeFilter === NOT_A_LEAD_FILTER ? "Not a lead" : `Lead type: ${leadTypeFilter}` } : null,
    offerCodeFilter !== "all" ? { key: "offerCode", label: offerCodeFilter === BLACK_FRIDAY_OFFER_CODE ? "Black Friday (BF2026)" : `Offer code: ${offerCodeFilter}` } : null,
    tagFilter.length ? { key: "tags", label: `Tags: ${tagFilter.join(", ")}` } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  const activeFilterCount = filterChips.length;
  const hasQueryFilters = activeFilterCount > 0 || Boolean(searchQuery);

  function applyLeadUpdate(updated: Lead) {
    const remainsInView = leadBelongsToView(updated, activeView);
    setLeads((current) => remainsInView
      ? current.map((lead) => (lead.id === updated.id ? updated : lead))
      : current.filter((lead) => lead.id !== updated.id));
    setSelectedLead((lead) => {
      if (lead?.id !== updated.id) return lead;
      return remainsInView ? updated : null;
    });
  }

  async function getAuthHeaders(): Promise<HeadersInit> {
    return { "Content-Type": "application/json" };
  }

  async function changeRowStatus(lead: Lead, status: string) {
    if (!canUpdateLeads) return;
    setOpenMenuId(null);
    applyLeadUpdate({ ...lead, status });
    try {
      const res = await fetch("/api/airtable/leads", {
        method: "PATCH",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: lead.id, status })
      });
      const data = await res.json().catch(() => ({})) as { error?: string; lead?: Lead };
      if (!res.ok || data.error) throw new Error(data.error ?? "Could not update status");
      applyLeadUpdate(data.lead ?? { ...lead, status });
      await reloadRowsAndSummary();
    } catch (event) {
      applyLeadUpdate(lead);
      await load(false, currentCursor, currentPage);
      showToast("error", event instanceof Error ? event.message : "Could not update status");
    }
  }

  function showToast(tone: "success" | "error", message: string) {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 4000);
  }

  async function reloadRowsAndSummary(
    cursor: string | null = currentCursor,
    pageNumber = currentPage,
  ) {
    const [rowsLoaded] = await Promise.all([
      load(false, cursor, pageNumber),
      loadSummary(false),
    ]);
    return rowsLoaded;
  }

  async function refreshLeads() {
    if (refreshing) return;
    const refreshed = await reloadRowsAndSummary();
    showToast(
      refreshed ? "success" : "error",
      refreshed ? "Leads refreshed." : "Could not refresh Leads.",
    );
  }

  async function addLead(form: LeadForm) {
    setSavingLead(true);
    setAddError(null);
    try {
      const res = await fetch("/api/airtable/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error)
        throw new Error(data.error ?? "Could not create lead");
      setAddModalOpen(false);
      showToast("success", "Lead added successfully.");
      setCursorHistory([null]);
      if (currentPage > 1 || currentCursor) {
        void loadSummary(false);
        updateQuery({});
      } else {
        await reloadRowsAndSummary(null, 1);
      }
    } catch (event) {
      setAddError(
        event instanceof Error ? event.message : "Could not create lead",
      );
    } finally {
      setSavingLead(false);
    }
  }

  async function exportCsv(format: "csv" | "xlsx" = "csv") {
    try {
      await downloadLeadExport(format);
      showToast("success", "Every saved lead and all calls downloaded, including missed calls, spam and duplicates.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Lead export could not be prepared");
    }
  }

  async function importCsv(file: File) {
    setImportingLeads(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2)
        throw new Error("CSV must include a header row and at least one lead.");
      const headers = rows[0].map((header) =>
        header
          .replace(/^\uFEFF/, "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      );
      const column = (...names: string[]) =>
        headers.findIndex((header) => names.includes(header));
      const nameIndex = column("name", "fullname", "leadname");
      const phoneIndex = column("phone", "phonenumber", "mobile");
      const emailIndex = column("email", "emailaddress");
      const messageIndex = column("message", "notes", "messagenotes");
      if (nameIndex < 0 || phoneIndex < 0)
        throw new Error("CSV headers must include Name and Phone columns.");
      const imported = rows.slice(1).map((row) => ({
        name: row[nameIndex]?.trim() ?? "",
        phone: row[phoneIndex]?.trim() ?? "",
        email: emailIndex >= 0 ? (row[emailIndex]?.trim() ?? "") : "",
        message: messageIndex >= 0 ? (row[messageIndex]?.trim() ?? "") : ""
      }));
      const response = await fetch("/api/airtable/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ leads: imported })
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        created?: number;
      };
      if (!response.ok || data.error)
        throw new Error(data.error ?? "Could not import leads");
      showToast(
        "success",
        `${data.created ?? imported.length} leads imported successfully.`,
      );
      setCursorHistory([null]);
      if (currentPage > 1 || currentCursor) {
        void loadSummary(false);
        updateQuery({});
      } else {
        await reloadRowsAndSummary(null, 1);
      }
    } catch (event) {
      showToast(
        "error",
        event instanceof Error ? event.message : "Could not import CSV.",
      );
    } finally {
      setImportingLeads(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function changeReplied(lead: Lead, replied: boolean) {
    if (!canUpdateLeads || updatingReplied.has(lead.id)) return;
    const optimisticLead = { ...lead, replied };
    applyLeadUpdate(optimisticLead);
    setUpdatingReplied((current) => new Set(current).add(lead.id));
    try {
      const res = await fetch("/api/airtable/leads", {
        method: "PATCH",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: lead.id, replied })
      });
      const data = await res.json().catch(() => ({})) as { error?: string; lead?: Lead };
      if (!res.ok || data.error)
        throw new Error(data.error ?? "Could not update replied status");
      applyLeadUpdate(data.lead ?? optimisticLead);
      await reloadRowsAndSummary();
    } catch (event) {
      applyLeadUpdate(lead);
      await load(false, currentCursor, currentPage);
      showToast(
        "error",
        event instanceof Error
          ? event.message
          : "Could not update replied status",
      );
    } finally {
      setUpdatingReplied((current) => {
        const next = new Set(current);
        next.delete(lead.id);
        return next;
      });
    }
  }

  async function reclassifyLead(lead: Lead, leadType: LeadType) {
    if (!canUpdateLeads || reclassifying) return;
    setReclassifying(true);
    try {
      const response = await fetch(`/api/airtable/leads/${lead.id}/classification`, {
        method: "POST",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ leadType })
      });
      const data = await response.json().catch(() => ({})) as { error?: string; lead?: Lead; stoppedEnrollments?: number; stopError?: string | null };
      if (!response.ok || data.error || !data.lead) throw new Error(data.error || "Couldn’t change the classification. Try again.");
      const updated = data.lead;
      setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedLead(updated);
      if (leadType === "Real Lead") {
        if (role === "admin") {
          setCampaignLead(updated);
          showToast("success", "Marked as a real lead. Choose a start time to enroll them in 14-Day Nurture.");
        } else {
          showToast("success", "Marked as a real lead. Ask an admin to enroll them in 14-Day Nurture.");
        }
      } else if (data.stopError) {
        showToast("error", `Marked as not a lead, but nurture could not be stopped: ${data.stopError}`);
      } else {
        const stopped = data.stoppedEnrollments ?? 0;
        showToast("success", `Marked as not a lead (${leadType}).${stopped ? " Nurture messages stopped." : ""}`);
      }
      void reloadRowsAndSummary();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Couldn’t change the classification. Try again.");
    } finally {
      setReclassifying(false);
    }
  }

  async function notifyHayden(lead: Lead) {
    if (!canUpdateLeads || notifyingHayden.has(lead.id)) return;
    setOpenMenuId(null);
    setNotifyingHayden((current) => new Set(current).add(lead.id));
    const notificationId = crypto.randomUUID();
    try {
      const response = await fetch(`/api/airtable/leads/${lead.id}/notify-hayden`, {
        method: "POST",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ notificationId })
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Couldn’t notify Hayden. Try again.");
      setNotifiedHayden((current) => new Set(current).add(lead.id));
      showToast("success", `Hayden notified about ${lead.name || "this lead"}.`);
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Couldn’t notify Hayden. Try again.");
    } finally {
      setNotifyingHayden((current) => {
        const next = new Set(current);
        next.delete(lead.id);
        return next;
      });
    }
  }

  async function deleteLead(lead: Lead) {
    if (!canDeleteLeads) return;
    setOpenMenuId(null);
    setDeleteError(null);
    setDeleteTarget(lead);
    setDeleteImpact(null);
    const res = await fetch(`/api/airtable/leads/${lead.id}/delete-impact`, {
      headers: await getAuthHeaders(),
      cache: "no-store"
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteTarget(null);
      setDeleteError(
        data.error ?? `Could not calculate deletion impact for ${lead.name}.`,
      );
      return;
    }
    setDeleteImpact(data);
  }

  async function confirmDeleteLead() {
    if (!deleteTarget) return;
    const lead = deleteTarget;
    setDeletingLead(true);
    const res = await fetch(`/api/airtable/leads/${lead.id}`, {
      method: "DELETE",
      credentials: "same-origin",
      headers: await getAuthHeaders()
    });
    const data = await res.json().catch(() => ({}));
    setDeletingLead(false);
    if (!res.ok) {
      setDeleteError(
        data.partial
          ? `Deletion was only partially completed: ${data.error}. Refresh before trying again.`
          : (data.error ?? `Could not permanently delete ${lead.name}.`),
      );
      setDeleteTarget(null);
      await load(false, currentCursor, currentPage);
      return;
    }
    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedLead((current) => (current?.id === lead.id ? null : current));
    setDeleteTarget(null);
    showToast(
      "success",
      `${lead.name} and linked campaign history were deleted permanently.`,
    );
    if (leads.length === 1 && pageIndex > 0) {
      const previousIndex = pageIndex - 1;
      const previousCursor = cursorHistory[previousIndex] ?? null;
      void loadSummary(false);
      updateQuery({ cursor: previousCursor, page: String(previousIndex + 1) }, { push: true, resetPagination: false });
    } else {
      await reloadRowsAndSummary();
    }
  }

  function goNext() {
    if (!nextCursor || refreshing) return;
    const nextIndex = pageIndex + 1;
    setLoading(true);
    setCursorHistory((current) => [...current.slice(0, nextIndex), nextCursor]);
    updateQuery({ cursor: nextCursor, page: String(nextIndex + 1) }, { push: true, resetPagination: false });
  }

  function goPrevious() {
    if (pageIndex === 0 || refreshing) return;
    const previousIndex = pageIndex - 1;
    setLoading(true);
    updateQuery({ cursor: cursorHistory[previousIndex] ?? null, page: previousIndex ? String(previousIndex + 1) : null }, { push: true, resetPagination: false });
  }

  function changePageSize(value: string) {
    const nextSize = Number(value);
    if (![20, 30, 50].includes(nextSize)) return;
    setLoading(true);
    setCursorHistory([null]);
    updateQuery({ pageSize: String(nextSize), lead: null });
  }

  const callFromDate = dateRange?.from;
  const callToDate = callWindowForRange(dateRange).toDate;
  const allCallRecords = callData.calls;
  const callFilters = useMemo(() => ({
    fromDate: callFromDate,
    toDate: callToDate,
    source: callSourceFilter,
    status: callStatusFilter,
    needsDetails: needsDetailsFilter
  }), [callFromDate, callToDate, callSourceFilter, callStatusFilter, needsDetailsFilter]);
  // Badge: every call in the date range, like the other tabs' counts.
  const callTabCount = allCallRecords ? filterCallLeads(allCallRecords, { fromDate: callFromDate, toDate: callToDate }, callData.addedIds).length : null;
  // Cards: source and date filters only, so Answered / Missed / Needs details stay usable as toggles.
  const callCardMetrics = callMetrics(
    filterCallLeads(allCallRecords ?? [], { fromDate: callFromDate, toDate: callToDate, source: callSourceFilter }, callData.addedIds),
    callData.addedIds,
  );
  const callSourceOptions = [
    { label: "All sources", value: "all" },
    // Every campaign is listed (CS2, CS5, CS3, CS4, Website), plus Other Google Ads or any
    // hand-entered source once a call has it, so no call is ever unreachable.
    ...groupCallSources(allCallRecords ?? [], { includeCampaigns: true }).map((item) => ({ label: callSourceLabel(item.label), value: item.id })),
    ...(callSourceFilter !== "all" && !groupCallSources(allCallRecords ?? [], { includeCampaigns: true }).some((item) => item.id === callSourceFilter)
      ? [{ label: callSourceFilter, value: callSourceFilter }] : []),
  ];
  const callCards: Array<{ label: string; value: number | string; meta: string; color: string; active?: boolean; onClick?: () => void }> = [
    { label: "Total calls", value: callCardMetrics.total, meta: "source & date", color: "var(--brand-primary)" },
    { label: "Answered", value: callCardMetrics.answered, meta: "picked up", color: "var(--success)", active: callStatusFilter === "answered",
      onClick: () => setFilterParam("callStatus", callStatusFilter === "answered" ? "all" : "answered") },
    { label: "Missed", value: callCardMetrics.missed, meta: "not answered", color: "var(--danger)", active: callStatusFilter === "missed",
      onClick: () => setFilterParam("callStatus", callStatusFilter === "missed" ? "all" : "missed") },
    { label: "Needs details", value: callCardMetrics.needsDetails, meta: "no lead yet", color: "var(--warning)", active: needsDetailsFilter,
      onClick: () => setFilterParam("needs", needsDetailsFilter ? "all" : "1") },
    { label: "Avg duration", value: `${callCardMetrics.averageDuration}s`, meta: "answered calls", color: "var(--info)" },
  ];
  const callChips = [
    callSourceFilter !== "all" ? { key: "callSource", label: `Source: ${callSourceOptions.find((option) => option.value === callSourceFilter)?.label ?? callSourceFilter}` } : null,
    callStatusFilter !== "all" ? { key: "callStatus", label: callStatusFilter === "missed" ? "Missed" : "Answered" } : null,
    needsDetailsFilter ? { key: "needs", label: "Needs details" } : null,
    dateRange ? { key: "date", label: dateRange.label } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  const visibleChips = callsTab ? callChips : filterChips;

  function refreshAll() {
    void refreshLeads();
    if (callsTab) void callData.reload();
  }

  return (
    <div className="space-y-5">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importCsv(file);
        }}
      />
      <LeadTicker
        lead={latestLeadOverall}
        loading={summaryLoading}
        error={Boolean(summaryError)}
      />

      {toast && (
        <Toast
          variant={toast.tone === "success" ? "success" : "danger"}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {deleteError && (
        <Alert
          variant="danger"
          title="Could not delete Lead"
          action={
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="grid size-10 place-items-center rounded-lg"
              style={{ color: "var(--danger-text)" }}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          }
        >
          {deleteError}
        </Alert>
      )}

      <div
        className="relative rounded-2xl border p-3 sm:p-4"
        style={{
          backgroundColor: PANEL,
          borderColor: BORDER
        }}
      >
        <div className="pb-1">
          <div
            role="tablist"
            aria-label="Lead views"
            className="grid w-full grid-cols-3 gap-1 rounded-xl border p-1 sm:grid-cols-5"
            style={{ borderColor: BORDER, backgroundColor: CARD }}
          >
            {VIEW_OPTIONS.map((option) => {
              const active = !callsTab && option.value === activeView;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (active) return;
                    setCursorHistory([null]);
                    updateQuery({ view: option.value, callSource: null, callStatus: null, needs: null, call: null }, { push: true });
                  }}
                  className="relative min-h-10 rounded-lg px-1.5 text-xs font-bold outline-none transition focus-visible:ring-2 sm:px-3 sm:text-sm"
                  style={{
                    color: active ? "var(--brand-primary-strong)" : MUTED,
                    backgroundColor: active ? "var(--brand-primary-soft)" : "transparent"
                  }}
                >
                  <span className="inline-flex max-w-full items-center gap-1 sm:gap-2">
                    <span
                      className="hidden size-1.5 rounded-full sm:inline-block"
                      style={{ backgroundColor: active ? GOLD : "var(--border-strong)" }}
                    />
                    <span className="truncate">{option.label}</span>
                    {viewCounts && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
                        style={{ backgroundColor: "var(--surface-2)", color: MUTED }}
                      >
                        {viewCounts[option.value]}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={callsTab}
              onClick={() => { if (!callsTab) openCallsTab(true); }}
              className="relative min-h-10 rounded-lg px-1.5 text-xs font-bold outline-none transition focus-visible:ring-2 sm:px-3 sm:text-sm"
              style={{
                color: callsTab ? "var(--brand-primary-strong)" : MUTED,
                backgroundColor: callsTab ? "var(--brand-primary-soft)" : "transparent"
              }}
            >
              <span className="inline-flex max-w-full items-center gap-1 sm:gap-2">
                <span
                  className="hidden size-1.5 rounded-full sm:inline-block"
                  style={{ backgroundColor: callsTab ? GOLD : "var(--border-strong)" }}
                />
                <span className="truncate">{CALLS_TAB.label}</span>
                {callTabCount !== null && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
                    style={{ backgroundColor: "var(--surface-2)", color: MUTED }}
                  >
                    {callTabCount}
                  </span>
                )}
              </span>
            </button>
          </div>
          {(callsTab ? CALLS_TAB.hint : activeViewOption.hint) && (
            <p className="mt-2 text-[11px] leading-4" style={{ color: MUTED }}>
              {callsTab ? CALLS_TAB.hint : activeViewOption.hint}
            </p>
          )}
        </div>

        <div className="mt-3" aria-busy={callsTab ? allCallRecords === null && !callData.loadError : summaryLoading || summaryRefreshing}>
          {!callsTab && summaryError && (
            <div
              className="mb-3 flex items-start gap-2 rounded-xl border p-3 text-xs"
              role="alert"
              style={{
                backgroundColor: "var(--warning-bg)",
                borderColor: "var(--warning-border)",
                color: "var(--warning-text)"
              }}
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Lead summary could not be loaded.</p>
                <p className="mt-0.5 opacity-80">{summaryError}</p>
              </div>
            </div>
          )}
          {callsTab ? (
            allCallRecords === null && !callData.loadError ? (
              <SummarySkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 2xl:grid-cols-5">
                {callCards.map(({ active, onClick, ...card }) => (
                  <StatCard key={card.label} {...card} value={allCallRecords ? card.value : "—"} active={active} onClick={onClick} />
                ))}
              </div>
            )
          ) : summaryLoading ? (
            <SummarySkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 2xl:grid-cols-6">
              {summaryCardsFor(activeView, leadSummary).map((card) => {
                const { status, ...stat } = card;
                return (
                  <StatCard
                    key={card.label}
                    {...stat}
                    active={Boolean(status) && statusFilter === status}
                    onClick={status ? () => setFilterParam("status", statusFilter === status ? "all" : status) : undefined}
                  />
                );
              })}
            </div>
          )}
          {!summaryLoading && leadSummary?.byAdCampaign?.length ? (
            <AdCampaignBreakdownPanel
              groups={leadSummary.byAdCampaign}
              active={adCampaignFilter}
              onSelect={(code) => setFilterParam("adCampaign", adCampaignFilter === code ? "all" : code)}
            />
          ) : null}
        </div>

        {/* On the Call Leads tab the filters and the action buttons share one wrapping
            row, so the "…" menu sits beside the last filter on mobile. */}
        <div className={callsTab ? "mt-3 flex min-w-0 flex-wrap items-center gap-2" : "mt-3 flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center"}>
          {callsTab ? (
          <div className="contents" role="group" aria-label="Call filters">
            <SelectControl label="Filter calls by source" value={callSourceFilter} onChange={(value) => setFilterParam("callSource", value)} options={callSourceOptions} />
            <DateRangeFilter value={dateSelection} onChange={setDateRange} presets={LEAD_DATE_PRESETS} allowAll />
            <SelectControl
              label="Filter calls by status"
              className="min-w-[104px] flex-1 sm:flex-none"
              value={callStatusFilter}
              onChange={(value) => setFilterParam("callStatus", value)}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Answered", value: "answered" },
                { label: "Missed", value: "missed" },
              ]}
            />
            <button
              type="button"
              aria-pressed={needsDetailsFilter}
              onClick={() => setFilterParam("needs", needsDetailsFilter ? "all" : "1")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold"
              style={{
                borderColor: needsDetailsFilter ? "var(--warning-text)" : "var(--warning-border)",
                backgroundColor: "var(--warning-bg)",
                color: "var(--warning-text)"
              }}
              title={needsDetailsFilter ? "Show every call" : "Show only calls nobody has logged yet"}
            >
              {needsDetailsFilter ? <Check size={14} className="hidden sm:block" /> : <PhoneCall size={14} className="hidden sm:block" />}
              Needs details
              <span className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums" style={{ backgroundColor: "var(--surface-1)" }}>
                {allCallRecords && !callData.checking ? callCardMetrics.needsDetails : "…"}
              </span>
            </button>
          </div>
          ) : (
          <div className="relative min-w-0 flex-1 xl:basis-[420px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: MUTED }}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, or email"
              aria-label="Search leads"
              className="h-11 w-full min-w-0 rounded-xl border pl-10 pr-10 text-sm outline-none focus-visible:ring-2"
              style={{
                backgroundColor: CARD,
                borderColor: BORDER,
                color: TEXT
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg"
                style={{ color: MUTED }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          )}

          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-nowrap">
            {!callsTab && (
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold sm:flex-none"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full text-[10px]" style={{ backgroundColor: "var(--brand-primary-soft)", color: "var(--brand-primary-strong)" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            )}
            {!callsTab && canUpdateLeads && (
              <button
                type="button"
                onClick={() => {
                  setAddError(null);
                  setAddModalOpen(true);
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-extrabold sm:flex-none"
                style={{ color: "var(--primary-foreground)", backgroundColor: GOLD, borderColor: GOLD }}
              >
                <Plus size={15} />
                Add Lead
              </button>
            )}
            <button
              type="button"
              onClick={refreshAll}
              disabled={loading || refreshing}
              className="hidden min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold md:inline-flex"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <div className="relative shrink-0" ref={actionsRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={actionsOpen}
                onClick={() => setActionsOpen((open) => !open)}
                className="grid size-11 place-items-center rounded-xl border"
                style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
                aria-label="More Lead actions"
              >
                <MoreHorizontal size={18} />
              </button>
              {actionsOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 rounded-xl border p-1 shadow-2xl"
                  style={{ backgroundColor: CARD, borderColor: BORDER }}
                >
                  <button type="button" role="menuitem" onClick={() => { setActionsOpen(false); refreshAll(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold md:hidden" style={{ color: TEXT }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActionsOpen(false); exportCsv(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold" style={{ color: TEXT }}>
                    <Download size={14} /> Export CSV (all history)
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActionsOpen(false); void exportCsv("xlsx"); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold" style={{ color: TEXT }}>
                    <Download size={14} /> Export Excel (source tabs)
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setActionsOpen(false); setMetricsModalOpen(true); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold" style={{ color: TEXT }}>
                    <Activity size={14} /> Update visits
                  </button>
                  {canUpdateLeads && (
                    <button type="button" role="menuitem" disabled={importingLeads} onClick={() => { setActionsOpen(false); importInputRef.current?.click(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold disabled:opacity-50" style={{ color: TEXT }}>
                      <FileUp size={14} /> {importingLeads ? "Importing…" : "Import CSV"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {!callsTab && (
        <div className="mt-3 hidden flex-wrap gap-2 xl:flex">
            <SelectControl
              label="Filter by campaign"
              value={campaignFilter}
              onChange={(value) => setFilterParam("campaign", value)}
              options={[
                { label: "All Campaigns", value: "all" },
                { label: "Speed-to-Lead", value: "speed-to-lead" },
                { label: "14-Day Nurture", value: "14-day-nurture" },
                { label: "No Campaign", value: "none" },
              ]}
            />
            <SelectControl
              label="Filter by status"
              value={statusFilter}
              onChange={(value) => setFilterParam("status", value)}
              options={[
                { label: "All statuses", value: "all" },
                ...STATUS_FILTER_OPTIONS.map((status) => ({
                  label: status,
                  value: status
                })),
              ]}
            />
            <SelectControl
              label="Filter by source"
              value={sourceFilter}
              onChange={(value) => setFilterParam("source", value)}
              options={sources}
            />
            <SelectControl label="Filter by ad campaign" value={adCampaignFilter} onChange={(value) => setFilterParam("adCampaign", value)} options={AD_CAMPAIGN_OPTIONS} />
            <DateRangeFilter value={dateSelection} onChange={setDateRange} presets={LEAD_DATE_PRESETS} allowAll />
            <SelectControl
              label="Filter by tag"
              value={tagFilter.length === 1 ? tagFilter[0] : tagFilter.length > 1 ? "__multi" : "all"}
              onChange={(value) => { if (value !== "__multi") setFilterParam("tags", value); }}
              options={[
                { label: "All tags", value: "all" },
                ...(tagFilter.length > 1 ? [{ label: `${tagFilter.length} tags`, value: "__multi" }] : []),
                ...AI_TAGS.map((tag) => ({ label: tag, value: tag })),
              ]}
            />
        </div>
        )}

        {!callsTab && activeView !== "gift-cards" && offerCodeFilter === "all" && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Quick filters">
            <button
              type="button"
              onClick={() => setFilterParam("offerCode", BLACK_FRIDAY_OFFER_CODE)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold"
              style={{ borderColor: BORDER, backgroundColor: CARD, color: TEXT }}
              aria-label="Show Black Friday leads (offer code BF2026)"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
              Black Friday
            </button>
          </div>
        )}

        {visibleChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {visibleChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilterParam(chip.key, "all")}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold"
                style={{ borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-primary-soft)", color: "var(--brand-primary-strong)" }}
                aria-label={`Remove ${chip.label} filter`}
              >
                {chip.label}<X size={12} />
              </button>
            ))}
            <button type="button" onClick={() => clearFilters()} className="min-h-8 px-2 text-[11px] font-bold" style={{ color: MUTED }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-stretch sm:justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-filters-title"
            className="mobile-safe-bottom relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-2xl border sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-2xl"
            style={{ backgroundColor: PANEL, borderColor: BORDER }}
          >
            <div className="mobile-safe-top flex items-start justify-between gap-4 border-b p-4 sm:p-5" style={{ borderColor: BORDER }}>
              <div>
                <p id="lead-filters-title" className="text-base font-extrabold" style={{ color: TEXT }}>Filter {activeViewOption.label}</p>
                <p className="mt-1 text-xs" style={{ color: MUTED }}>Filters apply only to this tab.</p>
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="grid size-10 place-items-center rounded-xl border" style={{ backgroundColor: CARD, borderColor: BORDER, color: MUTED }} aria-label="Close filters">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectControl
                  label="Filter by campaign"
                  value={campaignFilter}
                  onChange={(value) => setFilterParam("campaign", value)}
                  options={[
                    { label: "All Campaigns", value: "all" },
                    { label: "Speed-to-Lead", value: "speed-to-lead" },
                    { label: "14-Day Nurture", value: "14-day-nurture" },
                    { label: "No Campaign", value: "none" },
                  ]}
                />
                <SelectControl
                  label="Filter by campaign status"
                  value={campaignStatusFilter}
                  onChange={(value) => setFilterParam("campaignStatus", value)}
                  options={[
                    { label: "Campaign status: All", value: "all" },
                    ...["Active", "Paused", "Stopped", "Completed"].map((value) => ({ label: value, value })),
                  ]}
                />
                <SelectControl
                  label="Filter by current step"
                  value={campaignStepFilter}
                  onChange={(value) => setFilterParam("campaignStep", value)}
                  options={[
                    { label: "All Steps", value: "all" },
                    ...["Day 1 SMS", "Day 3 Email", "Day 5 SMS", "Day 8 Email", "Day 12 SMS"].map((value) => ({ label: value, value })),
                  ]}
                />
                <SelectControl
                  label="Filter by status"
                  value={statusFilter}
                  onChange={(value) => setFilterParam("status", value)}
                  options={[
                    { label: "All statuses", value: "all" },
                    ...STATUS_FILTER_OPTIONS.map((status) => ({ label: status, value: status })),
                  ]}
                />
                <SelectControl label="Filter by source" value={sourceFilter} onChange={(value) => setFilterParam("source", value)} options={sources} />
                <SelectControl label="Filter by ad campaign" value={adCampaignFilter} onChange={(value) => setFilterParam("adCampaign", value)} options={AD_CAMPAIGN_OPTIONS} />
                <DateRangeFilter value={dateSelection} onChange={setDateRange} presets={LEAD_DATE_PRESETS} allowAll />
                <SelectControl
                  label="Filter by SMS sent"
                  value={smsFilter}
                  onChange={(value) => setFilterParam("smsStatus", value)}
                  options={[
                    { label: "SMS: All", value: "all" },
                    { label: "SMS sent", value: "sent" },
                    { label: "SMS not sent", value: "not_sent" },
                  ]}
                />
                <SelectControl
                  label="Filter by email sent"
                  value={emailFilter}
                  onChange={(value) => setFilterParam("emailStatus", value)}
                  options={[
                    { label: "Email: All", value: "all" },
                    { label: "Email sent", value: "sent" },
                    { label: "Email not sent", value: "not_sent" },
                  ]}
                />
                <SelectControl
                  label="Filter by lead type"
                  value={leadTypeFilter}
                  onChange={(value) => setFilterParam("leadType", value)}
                  options={[
                    { label: "Lead type: All", value: "all" },
                    { label: "Not a lead (any type)", value: NOT_A_LEAD_FILTER },
                    ...LEAD_TYPES.map((type) => ({ label: type, value: type })),
                  ]}
                />
              </div>
              <fieldset className="mt-5">
                <legend className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>
                  Tags <span className="normal-case tracking-normal" style={{ color: MUTED }}>· matches any selected</span>
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {AI_TAGS.map((tag) => {
                    const selected = tagFilter.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          const next = selected ? tagFilter.filter((item) => item !== tag) : [...tagFilter, tag];
                          setFilterParam("tags", next.join(","));
                        }}
                        className="min-h-8 rounded-full border px-3 text-[11px] font-bold transition"
                        style={{
                          borderColor: selected ? "var(--brand-primary)" : BORDER,
                          backgroundColor: selected ? "var(--brand-primary-soft)" : CARD,
                          color: selected ? "var(--brand-primary-strong)" : MUTED
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="flex items-center justify-between gap-3 border-t p-4 sm:p-5" style={{ borderColor: BORDER }}>
              <button type="button" onClick={() => clearFilters()} disabled={activeFilterCount === 0} className="min-h-11 rounded-xl px-3 text-xs font-bold disabled:opacity-40" style={{ color: MUTED }}>
                Clear all
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="min-h-11 rounded-xl px-5 text-xs font-extrabold" style={{ backgroundColor: GOLD, color: "var(--primary-foreground)" }}>
                Show results{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>
            </div>
          </aside>
        </div>
      )}

      {callsTab ? (
        // Call opportunities replace the lead table; the header and filters above stay in place.
        <CallLeadsPanel data={callData} filters={callFilters} focusCallId={searchParams.get("call")} onLeadCreated={() => void refreshLeads()} />
      ) : loading ? (
        <LoadingRegion label="Loading leads" className="overflow-hidden rounded-2xl border" ><SkeletonRows rows={8} /></LoadingRegion>
      ) : error ? (
        <div
          className="flex items-start gap-3 rounded-2xl border p-5"
          style={{
            borderColor: "rgba(248,113,113,0.25)",
            backgroundColor: "rgba(248,113,113,0.08)"
          }}
        >
          <AlertCircle size={18} style={{ color: "#F87171" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#F87171" }}>
              Could not load leads
            </p>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              {error}
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border px-6 py-20 text-center"
          style={{ borderColor: BORDER, backgroundColor: CARD }}
        >
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(201,168,76,0.10)", color: GOLD }}
          >
            <SlidersHorizontal size={22} />
          </div>
          <p className="text-base font-bold" style={{ color: TEXT }}>
            {hasQueryFilters ? "No Leads match the current filters" : activeViewOption.empty}
          </p>
          <p className="mt-1 max-w-md text-sm" style={{ color: MUTED }}>
            {hasQueryFilters
              ? "Adjust the filters or search term to bring Leads back into view."
              : `New ${activeViewOption.label.toLowerCase()} will appear here automatically.`}
          </p>
          {hasQueryFilters && (
            <button
              type="button"
              onClick={() => clearFilters(true)}
              className="mt-4 min-h-10 rounded-xl border px-4 text-xs font-bold"
              style={{ borderColor: BORDER, backgroundColor: PANEL, color: TEXT }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : activeView === "gift-cards" ? (
        <GiftCardsTable leads={filtered} onOpen={setSelectedLead} />
      ) : (
        <>
          <div
            className="hidden overflow-visible rounded-2xl border lg:block"
            style={{ borderColor: BORDER, backgroundColor: CARD }}
          >
            <div className="max-h-[68vh] overflow-y-auto overflow-x-hidden">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: "var(--background-subtle)" }}>
                    {[
                      { key: "name", label: "Name", width: "w-[16%]" },
                      { key: "contact", label: "Contact", width: "w-[15%]" },
                      { key: "source", label: "Source", width: "w-[11%]" },
                      { key: "status", label: "Status", width: "w-[108px]" },
                      { key: "campaigns", label: "Campaigns", width: "" },
                      { key: "replied", label: "Replied", width: "w-[60px]" },
                      { key: "delivery", label: "Delivery", width: "w-[100px]" },
                      { key: "activity", label: "Activity", width: "w-[84px]" },
                      { key: "actions", label: "", width: "w-[108px]" },
                    ].map((heading) => (
                      <th
                        key={heading.key}
                        className={`border-b py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] ${heading.width} ${heading.key === "actions" ? "px-2" : "px-3"}`}
                        style={{ color: DIM, borderColor: BORDER_SOFT }}
                      >
                        {heading.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const duplicate = isDuplicateLead(lead);
                    return (
                      <tr
                        key={lead.id}
                        className="group cursor-pointer transition-colors"
                        style={{ backgroundColor: BG }}
                        onClick={() => setSelectedLead(lead)}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor =
                            CARD_HOVER;
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = BG;
                        }}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ")
                            setSelectedLead(lead);
                        }}
                      >
                        <td
                          className="border-b px-3 py-3"
                          style={{ borderColor: BORDER_SOFT }}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className="hidden h-9 w-9 shrink-0 items-center min-[1440px]:flex justify-center rounded-xl border text-xs font-extrabold"
                              style={{
                                color: GOLD,
                                backgroundColor: "rgba(201,168,76,0.09)",
                                borderColor: "rgba(201,168,76,0.18)"
                              }}
                            >
                              {initials(lead.name)}
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-sm font-bold [overflow-wrap:anywhere]"
                                style={{ color: TEXT }}
                              >
                                {lead.name || "Unnamed lead"}
                              </p>
                              <p
                                className="text-[11px] [overflow-wrap:anywhere]"
                                style={{ color: duplicate ? "#A1A1AA" : DIM }}
                              >
                                {duplicate
                                  ? "Possible duplicate"
                                  : lead.treatment || "No treatment captured"}
                              </p>
                              <LeadClassificationChips lead={lead} />
                            </div>
                          </div>
                        </td>
                        <td
                          className="border-b px-3 py-3 text-xs [overflow-wrap:anywhere]"
                          style={{ borderColor: BORDER_SOFT, color: MUTED }}
                        >
                          <span className="block">{lead.phone || "-"}</span>
                          <span className="mt-0.5 block">{lead.email || "-"}</span>
                        </td>
                        <td
                          className="border-b px-3 py-3 text-xs font-semibold [overflow-wrap:anywhere]"
                          style={{ borderColor: BORDER_SOFT, color: TEXT }}
                        >
                          <span className="block">{sourceLabel(lead.source)}</span>
                          {lead.utmCampaign && (
                            <small className="mt-0.5 block font-normal" style={{ color: MUTED }}>
                              Campaign: {adCampaignLabel(lead.utmCampaign)}
                            </small>
                          )}
                          {lead.utmAdGroup && (
                            <small className="block font-normal" style={{ color: MUTED }}>
                              Ad group: {adGroupLabel(lead.utmAdGroup)}
                            </small>
                          )}
                        </td>
                        <td
                          className="border-b px-1.5 py-3"
                          style={{ borderColor: BORDER_SOFT }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {canUpdateLeads ? (
                            <select
                              value={lead.status}
                              onChange={(event) =>
                                changeRowStatus(lead, event.target.value)
                              }
                              className="w-full max-w-full rounded-full border px-2 py-1 text-[11px] font-bold"
                              style={{
                                color: (
                                  STATUS_CONFIG[lead.status] ??
                                  STATUS_CONFIG.New
                                ).color,
                                backgroundColor: (
                                  STATUS_CONFIG[lead.status] ??
                                  STATUS_CONFIG.New
                                ).bg,
                                borderColor: (
                                  STATUS_CONFIG[lead.status] ??
                                  STATUS_CONFIG.New
                                ).border
                              }}
                              aria-label={`Change status for ${lead.name}`}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusPill status={lead.status} />
                          )}
                        </td>
                        <td
                          className="border-b px-3 py-3 [overflow-wrap:anywhere]"
                          style={{ borderColor: BORDER_SOFT }}
                        >
                          <LeadCampaignBadges campaigns={lead.campaigns} />
                        </td>
                        <td
                          className="border-b px-3 py-3"
                          style={{ borderColor: BORDER_SOFT }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={lead.replied}
                            aria-label={`Mark ${lead.name || "lead"} as ${lead.replied ? "not replied" : "replied"}`}
                            disabled={
                              !canUpdateLeads || updatingReplied.has(lead.id)
                            }
                            onClick={() =>
                              void changeReplied(lead, !lead.replied)
                            }
                            className="relative inline-flex h-6 w-10 items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              backgroundColor: lead.replied
                                ? "rgba(45,212,191,.22)"
                                : "rgba(255,255,255,.05)",
                              borderColor: lead.replied
                                ? "rgba(45,212,191,.45)"
                                : BORDER_SOFT
                            }}
                          >
                            {updatingReplied.has(lead.id) ? (
                              <Loader2
                                size={13}
                                className="m-auto animate-spin"
                                style={{ color: GOLD }}
                              />
                            ) : (
                              <span
                                className={`h-4 w-4 rounded-full transition-transform ${lead.replied ? "translate-x-[19px]" : "translate-x-[3px]"}`}
                                style={{
                                  backgroundColor: lead.replied ? TEAL : MUTED
                                }}
                              />
                            )}
                          </button>
                        </td>
                        <td
                          className="border-b px-1.5 py-3"
                          style={{ borderColor: BORDER_SOFT }}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <DeliveryPill
                              label="SMS"
                              value={lead.smsSentStatus}
                            />
                            <DeliveryPill
                              label="Email"
                              value={lead.emailSentStatus}
                            />
                          </div>
                        </td>
                        <td
                          className="border-b px-3 py-3 text-[11px] leading-4"
                          style={{ borderColor: BORDER_SOFT, color: MUTED }}
                        >
                          <span className="block">Created {timeAgo(lead.createdAt)}</span>
                          <span className="mt-1 block">
                            {lastContacted(lead)
                              ? `Contacted ${timeAgo(lastContacted(lead))}`
                              : "Not contacted"}
                          </span>
                        </td>
                        <td
                          className="relative border-b px-2 py-3 text-right"
                          style={{ borderColor: BORDER_SOFT }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {canUpdateLeads && (
                              <NotifyHaydenButton
                                lead={lead}
                                compact
                                notifying={notifyingHayden.has(lead.id)}
                                notified={notifiedHayden.has(lead.id)}
                                onNotify={(item) => void notifyHayden(item)}
                              />
                            )}
                            {canDeleteLeads && (
                              <button
                                type="button"
                                className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition hover:brightness-125"
                                style={{
                                  borderColor: "rgba(248,113,113,0.25)",
                                  color: "#F87171",
                                  backgroundColor: "rgba(248,113,113,0.08)"
                                }}
                                aria-label={`Delete ${lead.name || "lead"}`}
                                onClick={() => void deleteLead(lead)}
                                title="Delete lead"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                            <button
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
                              style={{
                                borderColor: BORDER_SOFT,
                                color: MUTED,
                                backgroundColor: "rgba(255,255,255,0.025)"
                              }}
                              aria-label={`Open quick actions for ${lead.name}`}
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === lead.id ? null : lead.id,
                                )
                              }
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                          {openMenuId === lead.id && (
                            <div
                              className="absolute right-3 top-10 z-20 w-44 rounded-xl border p-1 text-left"
                              style={{
                                backgroundColor: "#08080C",
                                borderColor: BORDER,
                                boxShadow: "0 18px 50px rgba(0,0,0,0.35)"
                              }}
                            >
                              <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                                style={{ color: TEXT }}
                              >
                                <Phone size={13} /> Call
                              </a>
                              <a
                                href={`mailto:${lead.email}`}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                                style={{ color: TEXT }}
                              >
                                <Mail size={13} /> Email
                              </a>
                              <button
                                onClick={() =>
                                  navigator.clipboard?.writeText(
                                    `${lead.name} ${lead.phone} ${lead.email}`,
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold"
                                style={{ color: TEXT }}
                              >
                                <Copy size={13} /> Copy contact
                              </button>
                              {canDeleteLeads && (
                                <button
                                  type="button"
                                  onClick={() => void deleteLead(lead)}
                                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold"
                                  style={{ color: "#F87171" }}
                                >
                                  <Trash2 size={13} /> Delete lead
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
            {filtered.map((lead) => {
              const duplicate = isDuplicateLead(lead);
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedLead(lead);
                  }}
                  role="button"
                  tabIndex={0}
                  className="min-w-0 rounded-2xl border p-4 text-left"
                  style={{
                    backgroundColor: CARD,
                    borderColor: duplicate ? "rgba(161,161,170,0.28)" : BORDER
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold"
                        style={{
                          color: GOLD,
                          backgroundColor: "rgba(201,168,76,0.09)",
                          borderColor: "rgba(201,168,76,0.18)"
                        }}
                      >
                        {initials(lead.name)}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-bold"
                          style={{ color: TEXT }}
                        >
                          {lead.name || "Unnamed lead"}
                        </p>
                        <p
                          className="mt-1 text-xs [overflow-wrap:anywhere]"
                          style={{ color: MUTED }}
                        >
                          {lead.phone || (lead.email ? "" : "No contact captured")}
                        </p>
                        {lead.email && (
                          <p
                            className="mt-0.5 text-xs [overflow-wrap:anywhere]"
                            style={{ color: MUTED }}
                          >
                            {lead.email}
                          </p>
                        )}
                        <LeadClassificationChips lead={lead} />
                      </div>
                    </div>
                    <StatusPill status={lead.status} />
                  </div>
                  <div className="mt-4 grid gap-2">
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{ backgroundColor: "var(--surface-2)" }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: DIM }}
                      >
                        Source
                      </p>
                      <p
                        className="mt-1 text-xs font-semibold [overflow-wrap:anywhere]"
                        style={{ color: TEXT }}
                      >
                        {sourceLabel(lead.source)}
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{ backgroundColor: "var(--surface-2)" }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: DIM }}
                      >
                        Campaign
                      </p>
                      <div className="mt-1.5"><LeadCampaignBadges campaigns={lead.campaigns} /></div>
                    </div>
                    <div
                      className="rounded-xl px-3 py-2"
                      style={{ backgroundColor: "var(--surface-2)" }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: DIM }}
                      >
                        Last activity
                      </p>
                      <p
                        className="mt-1 text-xs font-semibold"
                        style={{ color: TEXT }}
                      >
                        {lastActivity(lead) ? timeAgo(lastActivity(lead)) : "No activity"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {duplicate && <StatusPill status="Duplicate" />}
                    <DeliveryPill label="SMS" value={lead.smsSentStatus} />
                    <DeliveryPill label="Email" value={lead.emailSentStatus} />
                    <button
                      type="button"
                      role="switch"
                      aria-checked={lead.replied}
                      disabled={!canUpdateLeads || updatingReplied.has(lead.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        void changeReplied(lead, !lead.replied);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold disabled:opacity-60"
                      style={{
                        color: lead.replied ? TEAL : MUTED,
                        borderColor: lead.replied
                          ? "rgba(45,212,191,.35)"
                          : BORDER_SOFT,
                        backgroundColor: lead.replied
                          ? "rgba(45,212,191,.1)"
                          : "rgba(255,255,255,.03)"
                      }}
                    >
                      {updatingReplied.has(lead.id) ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Check size={11} />
                      )}
                      Replied: {lead.replied ? "Yes" : "No"}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: BORDER_SOFT }}>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedLead(lead); }} className="min-h-10 flex-1 rounded-xl border px-3 text-xs font-bold" style={{ borderColor: BORDER, backgroundColor: PANEL, color: TEXT }}>
                      View details
                    </button>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()} className="grid size-10 place-items-center rounded-xl border" style={{ borderColor: BORDER, color: TEAL }} aria-label={`Call ${lead.name || "lead"}`}>
                        <Phone size={15} />
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()} className="grid size-10 place-items-center rounded-xl border" style={{ borderColor: BORDER, color: TEAL }} aria-label={`Email ${lead.name || "lead"}`}>
                        <Mail size={15} />
                      </a>
                    )}
                    {canUpdateLeads && (
                      <NotifyHaydenButton
                        lead={lead}
                        compact
                        notifying={notifyingHayden.has(lead.id)}
                        notified={notifiedHayden.has(lead.id)}
                        onNotify={(item) => void notifyHayden(item)}
                      />
                    )}
                    {canDeleteLeads && (
                      <button type="button" onClick={(event) => { event.stopPropagation(); void deleteLead(lead); }} className="grid size-10 place-items-center rounded-xl border" style={{ color: "var(--danger-text)", backgroundColor: "var(--danger-bg)", borderColor: "var(--danger-border)" }} aria-label={`Delete ${lead.name || "lead"}`}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!callsTab && !loading && !error && (
        <nav
          aria-label="Leads pagination"
          className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: BORDER, backgroundColor: CARD }}
        >
          <p className="text-sm font-semibold tabular-nums" style={{ color: MUTED }}>
            {visibleRange.from
              ? `Showing ${visibleRange.from}–${visibleRange.to}${leadSummary ? ` of ${leadSummary.total}` : ""} leads`
              : "Showing 0 leads"}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-2 text-xs font-bold" style={{ color: MUTED }}>
              <span className="hidden sm:inline">Rows per page</span>
              <span className="sm:hidden">Rows</span>
              <select
                value={pageSize}
                onChange={(event) => changePageSize(event.target.value)}
                disabled={refreshing}
                aria-label="Rows per page"
                className="h-10 rounded-xl border px-3 text-sm font-bold outline-none focus-visible:ring-2"
                style={{ backgroundColor: PANEL, borderColor: BORDER, color: TEXT }}
              >
                {[20, 30, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void goPrevious()}
                disabled={pageIndex === 0 || refreshing}
                aria-label="Show previous page of leads"
                className="h-10 rounded-xl border px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                Previous
              </button>
              <span className="min-w-14 text-center text-xs font-bold tabular-nums" style={{ color: MUTED }}>
                Page {pageIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => void goNext()}
                disabled={!nextCursor || refreshing}
                aria-label="Show next page of leads"
                className="h-10 rounded-xl border px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: BORDER, color: TEXT }}
              >
                {refreshing ? <Loader2 className="mx-auto animate-spin" size={14} aria-hidden="true" /> : "Next"}
              </button>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {visibleRange.from ? `Showing Leads ${visibleRange.from} through ${visibleRange.to}. Page ${pageIndex + 1}.` : "No Leads to show."}
          </p>
        </nav>
      )}

      <LeadDetailsModal
        lead={selectedLead}
        duplicate={selectedLead ? isDuplicateLead(selectedLead) : false}
        onClose={() => {
          setSelectedLead(null);
          if (deepLinkLeadId) updateQuery({ lead: null }, { resetPagination: false });
        }}
        onStatusChange={(updated) => {
          applyLeadUpdate(updated);
          void reloadRowsAndSummary();
        }}
        canUpdate={canUpdateLeads}
        canDelete={canDeleteLeads}
        onDelete={(lead) => void deleteLead(lead)}
        getAuthHeaders={getAuthHeaders}
        onLeadUpdate={(updated) => {
          setLeads((current) =>
            current.map((item) => (item.id === updated.id ? updated : item)),
          );
          setSelectedLead(updated);
          showToast("success", "Lead updated");
          void reloadRowsAndSummary();
        }}
        onAddToCampaign={role === "admin" ? setCampaignLead : undefined}
        onNotify={(lead) => void notifyHayden(lead)}
        notifying={selectedLead ? notifyingHayden.has(selectedLead.id) : false}
        notified={selectedLead ? notifiedHayden.has(selectedLead.id) : false}
        onReclassify={(lead, leadType) => void reclassifyLead(lead, leadType)}
        reclassifying={reclassifying}
      />
      {role === "admin" && <AddLeadsToCampaignModal
        open={Boolean(campaignLead)}
        initialLeadId={campaignLead?.id}
        onClose={() => setCampaignLead(null)}
        onComplete={() => {
          void reloadRowsAndSummary(null, 1);
          showToast("success", "Campaign enrollment updated");
        }}
      />}
      <AddLeadModal
        open={addModalOpen}
        saving={savingLead}
        error={addError}
        onClose={() => {
          if (!savingLead) setAddModalOpen(false);
        }}
        onSubmit={addLead}
      />
      <UpdateClinicMetricsModal
        open={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        onSaved={() => showToast("success", "Monthly clinic metrics updated")}
      />
      <DestructiveConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Permanently delete ${deleteTarget?.name ?? "this Lead"}?`}
        description="This will permanently delete the Lead and all linked Nurture Enrollment and Message Log records. This action cannot be undone."
        confirmLabel="Delete permanently"
        loading={deletingLead}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteImpact(null);
        }}
        onConfirm={() => void confirmDeleteLead()}
      >
        <div className="space-y-1">
          <p>
            {deleteImpact?.nurtureEnrollments ?? <Skeleton className="inline-block h-3 w-6 rounded align-middle" />} Nurture Enrollment records
          </p>
          <p>{deleteImpact?.messageLogs ?? <Skeleton className="inline-block h-3 w-6 rounded align-middle" />} Message Log records</p>
          <p>
            Current campaign status:{" "}
            {deleteImpact?.activeCampaign ?? <Skeleton className="inline-block h-3 w-24 rounded-full align-middle" />}
          </p>
        </div>
      </DestructiveConfirmDialog>
    </div>
  );
}
