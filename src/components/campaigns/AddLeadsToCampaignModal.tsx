"use client";
import Papa from "papaparse";
import { FileUp, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BulkActionConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BulkEnrollmentResult } from "@/lib/types/campaigns";
type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  replied: boolean;
  campaigns?: Array<{ campaign: string; status: string }>;
};
type NewLead = {
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  notes: string;
};
type CsvRow = NewLead & {
  rowId: string;
  rowNumber: number;
  existing?: Lead;
  reason?: string;
};
const blank: NewLead = {
  name: "",
  email: "",
  phone: "",
  message: "",
  source: "Manual Campaign Entry",
  notes: "",
};
const blocked: Record<string, string> = {
  Booked: "Booked",
  Duplicate: "Duplicate",
  Failed: "Failed Lead",
  "Not Interested": "Not interested",
};
const digits = (value: string) =>
  value.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
function eligibility(lead: Lead) {
  if (blocked[lead.status]) return blocked[lead.status];
  if (lead.replied) return "Replied";
  if (
    lead.campaigns?.some(
      (item) => item.campaign === "14-Day Nurture" && item.status === "Active",
    )
  )
    return "Already active";
  if (!lead.email || digits(lead.phone).length !== 10)
    return "Valid email and US phone required";
  return "";
}
function firstSend(date: string, time: string) {
  if (!date || !time) return "";
  const probe = new Date(`${date}T12:00:00Z`);
  const zone =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "longOffset",
    })
      .formatToParts(probe)
      .find((part) => part.type === "timeZoneName")
      ?.value.replace("GMT", "") || "-04:00";
  return `${date}T${time}:00${zone}`;
}
function rowError(row: NewLead) {
  if (!row.name.trim()) return "Name is required";
  if (!row.email.trim() || !row.phone.trim())
    return "Email and phone are required for nurture";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return "Invalid email";
  if (digits(row.phone).length !== 10) return "Invalid US phone";
  return "";
}

export default function AddLeadsToCampaignModal({
  open,
  onClose,
  onComplete,
  initialLeadId,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialLeadId?: string;
}) {
  const [tab, setTab] = useState<"existing" | "new" | "csv">("existing"),
    [leads, setLeads] = useState<Lead[]>([]),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("All"),
    [newLead, setNewLead] = useState<NewLead>(blank),
    [csvRows, setCsvRows] = useState<CsvRow[]>([]),
    [csvSelected, setCsvSelected] = useState<Set<string>>(new Set()),
    [fileName, setFileName] = useState(""),
    [date, setDate] = useState(""),
    [time, setTime] = useState("16:00"),
    [permission, setPermission] = useState(false),
    [saving, setSaving] = useState(false),
    [confirming, setConfirming] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<BulkEnrollmentResult | null>(null);
  const master = useRef<HTMLInputElement>(null),
    fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    setTab("existing");
    setQuery("");
    setStatus("All");
    setSelected(initialLeadId ? new Set([initialLeadId]) : new Set());
    setCsvSelected(new Set());
    setPermission(false);
    setResult(null);
    setError("");
  }, [initialLeadId, open]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const allLeads: Lead[] = [];
          let cursor: string | null = null;
          let page = 1;

          do {
            const params = new URLSearchParams({
              page: String(page),
              pageSize: "50",
            });
            if (cursor) params.set("cursor", cursor);
            if (query.trim()) params.set("search", query.trim());
            if (status !== "All") params.set("status", status);

            const response = await fetch(`/api/airtable/leads?${params}`, {
              cache: "no-store",
              signal: controller.signal,
            });
            const body = (await response.json()) as {
              error?: string;
              leads?: Lead[];
              nextCursor?: string | null;
            };
            if (!response.ok || body.error) {
              throw new Error(body.error || "Leads could not be loaded");
            }

            allLeads.push(...(body.leads ?? []));
            cursor = body.nextCursor ?? null;
            page += 1;
          } while (cursor && !controller.signal.aborted);

          if (!controller.signal.aborted) {
            setLeads(allLeads);
            setError("");
          }
        } catch (caught) {
          if (!(caught instanceof DOMException && caught.name === "AbortError")) {
            setError("Leads could not be loaded");
          }
        }
      })();
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query, status]);
  const visible = useMemo(
    () =>
      leads,
    [leads],
  );
  const eligibleVisible = visible.filter((lead) => !eligibility(lead));
  useEffect(() => {
    if (master.current)
      master.current.indeterminate =
        eligibleVisible.some((lead) => selected.has(lead.id)) &&
        !eligibleVisible.every((lead) => selected.has(lead.id));
  }, [eligibleVisible, selected]);
  const count =
      tab === "existing" ? selected.size : tab === "new" ? 1 : csvSelected.size,
    ready =
      count > 0 &&
      Boolean(date && time && permission) &&
      (tab !== "new" || !rowError(newLead));
  const update = (key: keyof NewLead, value: string) =>
    setNewLead((current) => ({ ...current, [key]: value }));
  function parseCsv(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: ({ data, meta }) => {
        const header = (wanted: string[]) =>
          meta.fields?.find((field) =>
            wanted.includes(field.toLowerCase().replace(/[^a-z]/g, "")),
          ) ?? "";
        const keys = {
          name: header(["name", "fullname", "leadname"]),
          email: header(["email", "emailaddress"]),
          phone: header(["phone", "phonenumber", "mobile"]),
          message: header(["message", "inquiry"]),
          source: header(["source", "leadsource"]),
          notes: header(["notes", "note"]),
        };
        const seen = new Set<string>();
        const rows = data.map((raw, index) => {
          const row: CsvRow = {
            rowId: `row-${index + 2}`,
            rowNumber: index + 2,
            name: raw[keys.name] ?? "",
            email: raw[keys.email] ?? "",
            phone: raw[keys.phone] ?? "",
            message: raw[keys.message] ?? "",
            source: raw[keys.source] || "Manual Campaign Entry",
            notes: raw[keys.notes] ?? "",
          };
          const existing = leads.find(
            (lead) =>
              (row.email &&
                lead.email.toLowerCase() === row.email.toLowerCase()) ||
              (row.phone && digits(lead.phone) === digits(row.phone)),
          );
          const key = row.email.toLowerCase() || digits(row.phone);
          row.existing = existing;
          row.reason =
            rowError(row) ||
            (seen.has(key) && "Duplicate row in file") ||
            (existing && eligibility(existing)) ||
            "";
          if (key) seen.add(key);
          return row;
        });
        setCsvRows(rows);
        setCsvSelected(
          new Set(rows.filter((row) => !row.reason).map((row) => row.rowId)),
        );
      },
      error: () =>
        setError("The CSV could not be read. Check the file and try again."),
    });
  }
  async function enroll() {
    setSaving(true);
    setError("");
    try {
      const url =
        tab === "csv"
          ? "/api/airtable/nurture-enrollments/import"
          : "/api/airtable/nurture-enrollments/bulk-enroll";
      const payload =
        tab === "csv"
          ? {
              rows: csvRows,
              selectedRowIds: [...csvSelected],
              firstSendAt: firstSend(date, time),
              timezone: "America/New_York",
            }
          : {
              leadIds: tab === "existing" ? [...selected] : [],
              newLeads: tab === "new" ? [newLead] : [],
              firstSendAt: firstSend(date, time),
              timezone: "America/New_York",
            };
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok && !body.enrolled)
        throw new Error(body.error || "Leads could not be enrolled");
      setResult(body);
      setConfirming(false);
      onComplete();
    } catch (event) {
      setError(
        event instanceof Error ? event.message : "Leads could not be enrolled",
      );
    } finally {
      setSaving(false);
    }
  }
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "var(--overlay)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-leads-title"
    >
      <div
        className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden sm:h-auto sm:max-h-[94dvh] sm:max-w-6xl sm:rounded-2xl sm:border"
        style={{
          backgroundColor: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <header className="mobile-safe-top flex shrink-0 items-start justify-between gap-3 border-b border-(--border-subtle) p-4 sm:p-5">
          <div>
            <h2
              id="add-leads-title"
              className="font-serif text-2xl text-(--text-primary)"
            >
              Add Leads to 14-Day Nurture
            </h2>
            <p className="mt-1 text-sm text-(--text-muted)">
              Create enrollment records only. Make.com sends messages when they
              become due.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-xl"
          >
            <X className="text-(--text-muted)" />
          </button>
        </header>
        {result ? (
          <Result result={result} onClose={onClose} />
        ) : (
          <>
            <nav className="flex shrink-0 overflow-x-auto border-b border-(--border-subtle) px-4">
              {[
                ["existing", "Select Existing Leads"],
                ["new", "Add New Lead"],
                ["csv", "Import CSV"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as typeof tab)}
                  className="whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors"
                  style={{
                    color:
                      tab === key
                        ? "var(--brand-primary)"
                        : "var(--text-muted)",
                    borderColor:
                      tab === key
                        ? "var(--brand-primary)"
                        : "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              {tab === "existing" && (
                <Existing
                  leads={visible}
                  selected={selected}
                  query={query}
                  status={status}
                  master={master}
                  onQuery={setQuery}
                  onStatus={setStatus}
                  onSelected={setSelected}
                />
              )}{" "}
              {tab === "new" && (
                <NewLeadForm
                  value={newLead}
                  update={update}
                  match={leads.find(
                    (lead) =>
                      (newLead.email &&
                        lead.email.toLowerCase() ===
                          newLead.email.toLowerCase()) ||
                      (newLead.phone &&
                        digits(lead.phone) === digits(newLead.phone)),
                  )}
                />
              )}{" "}
              {tab === "csv" && (
                <CsvPanel
                  rows={csvRows}
                  selected={csvSelected}
                  fileName={fileName}
                  inputRef={fileRef}
                  onFile={parseCsv}
                  onClear={() => {
                    setCsvRows([]);
                    setCsvSelected(new Set());
                    setFileName("");
                  }}
                  onSelected={setCsvSelected}
                />
              )}
              <Schedule
                date={date}
                time={time}
                permission={permission}
                onDate={setDate}
                onTime={setTime}
                onPermission={setPermission}
              />
              {error && (
                <p role="alert" className="mt-3 text-sm text-(--danger)">
                  {error}
                </p>
              )}
            </div>
            <footer className="mobile-safe-bottom flex shrink-0 flex-col gap-2 border-t border-(--border-subtle) p-4 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between sm:p-5">
              <p className="text-sm text-(--text-muted)">{count} selected</p>
              <button
                disabled={!ready || saving}
                onClick={() => setConfirming(true)}
                className="min-h-11 w-full rounded-xl bg-(--brand-primary) px-5 py-2.5 text-sm font-bold text-(--primary-foreground) disabled:opacity-40 min-[380px]:w-auto"
              >
                {tab === "csv"
                  ? `Start nurture for ${count} Leads`
                  : `Add ${count} Lead${count === 1 ? "" : "s"} to Campaign`}
              </button>
            </footer>
          </>
        )}
        <BulkActionConfirmDialog
          open={confirming}
          title={`Start 14-Day Nurture for ${count} Leads?`}
          description="The selected Leads will be enrolled in the 14-Day Nurture campaign. Make.com will begin sending messages when the selected First Send At time becomes due."
          confirmLabel={`Enroll ${count} Leads`}
          loading={saving}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void enroll()}
        >
          <p>
            First Send At: <b>{formatSchedule(date, time)}</b>
          </p>
          <p>Timezone: America/New_York</p>
        </BulkActionConfirmDialog>
      </div>
    </div>
  );
}
function Existing({
  leads,
  selected,
  query,
  status,
  master,
  onQuery,
  onStatus,
  onSelected,
}: {
  leads: Lead[];
  selected: Set<string>;
  query: string;
  status: string;
  master: React.RefObject<HTMLInputElement | null>;
  onQuery: (v: string) => void;
  onStatus: (v: string) => void;
  onSelected: (v: Set<string>) => void;
}) {
  const eligible = leads.filter((lead) => !eligibility(lead));
  const all =
    eligible.length > 0 && eligible.every((lead) => selected.has(lead.id));
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-3 text-(--text-muted)" size={15} />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search Leads"
            className="h-11 w-full rounded-xl border border-(--border-subtle) bg-(--surface-2) pl-9 pr-3 text-(--text-primary)"
          />
        </label>
        <select
          value={status}
          onChange={(event) => onStatus(event.target.value)}
          className="h-11 rounded-xl border border-(--border-subtle) bg-(--surface-2) px-3 text-(--text-primary)"
        >
          <option>All</option>
          {[
            "New",
            "Contacted",
            "Booked",
            "Duplicate",
            "Failed",
            "Not Interested",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <button
          onClick={() => onSelected(new Set(eligible.map((lead) => lead.id)))}
          className="min-h-11 rounded-xl border border-(--border-subtle) px-3 text-xs font-bold text-(--text-primary)"
        >
          Select all eligible
        </button>
        <button
          onClick={() => onSelected(new Set())}
          className="min-h-11 rounded-xl px-3 text-xs text-(--text-muted)"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:hidden">
        {leads.map((lead) => {
          const why = eligibility(lead);
          const checked = selected.has(lead.id);
          return (
            <label
              key={lead.id}
              className={`flex min-h-20 items-start gap-3 rounded-2xl border p-4 ${why ? "opacity-55" : ""}`}
              style={{
                borderColor: checked
                  ? "color-mix(in srgb, var(--brand-primary) 50%, transparent)"
                  : "var(--border-subtle)",
                backgroundColor: checked
                  ? "var(--brand-primary-soft)"
                  : "var(--surface-1)",
              }}
            >
              <input
                type="checkbox"
                disabled={Boolean(why)}
                checked={checked}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(lead.id);
                  else next.delete(lead.id);
                  onSelected(next);
                }}
                className="mt-1 size-5 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-(--text-primary)">
                  {lead.name}
                </span>
                <span className="mt-1 block break-anywhere text-xs text-(--text-secondary)">
                  {lead.email || lead.phone}
                </span>
                <span className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-(--surface-2) px-2 py-1 text-[10px] text-(--text-secondary)">
                    {lead.status}
                  </span>
                  <span
                    className={
                      why
                        ? "text-[10px] text-(--warning)"
                        : "text-[10px] text-(--healthy)"
                    }
                  >
                    {why || "Eligible"}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-(--border-subtle) bg-(--surface-1) sm:block">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead className="bg-(--surface-2) text-(--text-muted)">
            <tr>
              <th className="p-3">
                <input
                  ref={master}
                  type="checkbox"
                  checked={all}
                  aria-label="Select all visible eligible Leads"
                  onChange={(event) =>
                    onSelected(
                      event.target.checked
                        ? new Set(eligible.map((lead) => lead.id))
                        : new Set(),
                    )
                  }
                />
              </th>
              {["Lead", "Contact", "Status", "Eligibility"].map((value) => (
                <th key={value} className="p-3">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const why = eligibility(lead);
              return (
                <tr key={lead.id} className="border-t border-(--border-subtle)">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      disabled={Boolean(why)}
                      checked={selected.has(lead.id)}
                      aria-label={`Select ${lead.name}`}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(lead.id);
                        else next.delete(lead.id);
                        onSelected(next);
                      }}
                    />
                  </td>
                  <td className="p-3 font-bold text-(--text-primary)">{lead.name}</td>
                  <td className="p-3 text-(--text-secondary)">
                    {lead.email || lead.phone}
                  </td>
                  <td className="p-3 text-(--text-secondary)">{lead.status}</td>
                  <td
                    className={
                      why ? "p-3 text-(--warning)" : "p-3 text-(--healthy)"
                    }
                  >
                    {why || "Eligible"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
function NewLeadForm({
  value,
  update,
  match,
}: {
  value: NewLead;
  update: (key: keyof NewLead, value: string) => void;
  match?: Lead;
}) {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
      {(["name", "email", "phone", "source", "message", "notes"] as const).map(
        (key) => (
          <label
            key={key}
            className={
              key === "message" || key === "notes" ? "sm:col-span-2" : ""
            }
          >
            <span className="mb-1 block text-xs font-bold capitalize text-(--text-muted)">
              {key}
              {key === "name" ? " *" : ""}
            </span>
            <input
              value={value[key]}
              onChange={(event) => update(key, event.target.value)}
              className="h-11 w-full rounded-xl border border-(--border-subtle) bg-(--surface-2) px-3 text-(--text-primary)"
            />
          </label>
        ),
      )}
      {match && (
        <p className="sm:col-span-2 rounded-xl border border-(--healthy)/20 bg-(--healthy-soft) p-3 text-sm text-(--healthy)">
          Existing Lead found: {match.name}. This record will be used if
          eligible.
        </p>
      )}
      {rowError(value) && (
        <p className="sm:col-span-2 text-sm text-(--warning)">
          {rowError(value)}
        </p>
      )}
    </div>
  );
}
function CsvPanel({
  rows,
  selected,
  fileName,
  inputRef,
  onFile,
  onClear,
  onSelected,
}: {
  rows: CsvRow[];
  selected: Set<string>;
  fileName: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  onClear: () => void;
  onSelected: (v: Set<string>) => void;
}) {
  if (!rows.length)
    return (
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file?.name.endsWith(".csv")) onFile(file);
        }}
        className="rounded-2xl border border-dashed border-(--brand-primary)/30 bg-(--brand-primary-soft) p-6 text-center sm:p-12"
      >
        <FileUp className="mx-auto text-(--brand-primary)" />
        <h3 className="mt-4 font-serif text-xl text-(--text-primary)">Upload Lead CSV</h3>
        <p className="mt-2 text-sm text-(--text-muted)">
          Headers can include Name, Email, Phone, Message, Source, and Notes.
          Quoted commas and line breaks are supported.
        </p>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-xl bg-(--brand-primary) px-4 py-2 text-sm font-bold text-(--primary-foreground)"
        >
          Browse file
        </button>
      </div>
    );
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-(--text-primary)">
          {fileName} · {rows.length} rows
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() =>
              onSelected(
                new Set(
                  rows.filter((row) => !row.reason).map((row) => row.rowId),
                ),
              )
            }
            className="text-xs font-bold text-(--brand-primary)"
          >
            Select all eligible
          </button>
          <button
            onClick={() => onSelected(new Set())}
            className="text-xs text-(--text-muted)"
          >
            Clear
          </button>
          <button onClick={onClear} className="text-xs text-(--danger)">
            Remove file
          </button>
        </div>
      </div>
      <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto sm:hidden">
        {rows.map((row) => (
          <label
            key={row.rowId}
            className={`flex items-start gap-3 rounded-2xl border border-(--border-subtle) p-4 ${row.reason ? "opacity-55" : ""}`}
          >
            <input
              type="checkbox"
              disabled={Boolean(row.reason)}
              checked={selected.has(row.rowId)}
              onChange={(event) => {
                const next = new Set(selected);
                if (event.target.checked) next.add(row.rowId);
                else next.delete(row.rowId);
                onSelected(next);
              }}
              className="mt-1 size-5 shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="text-[10px] text-(--text-muted)">
                Row {row.rowNumber} · {row.existing ? "Existing" : "New"}
              </span>
              <span className="mt-1 block font-bold text-(--text-primary)">
                {row.name || "Unnamed Lead"}
              </span>
              <span className="mt-1 block break-anywhere text-xs text-(--text-secondary)">
                {row.email || row.phone}
              </span>
              <span
                className={
                  row.reason
                    ? "mt-2 block text-xs text-(--warning)"
                    : "mt-2 block text-xs text-(--healthy)"
                }
              >
                {row.reason || "Eligible"}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 hidden max-h-80 overflow-auto rounded-xl border border-(--border-subtle) sm:block">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="sticky top-0 bg-(--surface-2) text-(--text-muted)">
            <tr>
              {[
                "",
                "Row",
                "Lead",
                "Email",
                "Phone",
                "Existing / New",
                "Validation",
              ].map((value) => (
                <th key={value} className="p-3">
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowId} className="border-t border-(--border-subtle)">
                <td className="p-3">
                  <input
                    type="checkbox"
                    disabled={Boolean(row.reason)}
                    checked={selected.has(row.rowId)}
                    onChange={(event) => {
                      const next = new Set(selected);
                      if (event.target.checked) next.add(row.rowId);
                      else next.delete(row.rowId);
                      onSelected(next);
                    }}
                  />
                </td>
                <td className="p-3 text-(--text-muted)">{row.rowNumber}</td>
                <td className="p-3 text-(--text-primary)">{row.name}</td>
                <td className="p-3 text-(--text-secondary)">{row.email}</td>
                <td className="p-3 text-(--text-secondary)">{row.phone}</td>
                <td className="p-3">
                  <span className="rounded-full bg-(--surface-2) px-2 py-1 text-(--healthy)">
                    {row.existing ? "Existing" : "New"}
                  </span>
                </td>
                <td
                  className={
                    row.reason ? "p-3 text-(--warning)" : "p-3 text-(--healthy)"
                  }
                >
                  {row.reason || "Eligible"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Schedule({
  date,
  time,
  permission,
  onDate,
  onTime,
  onPermission,
}: {
  date: string;
  time: string;
  permission: boolean;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  onPermission: (v: boolean) => void;
}) {
  return (
    <div className="mt-5 grid gap-4 rounded-2xl border border-(--border-subtle) p-4 sm:grid-cols-4">
      <div>
        <p className="text-[10px] uppercase text-(--text-muted)">Campaign</p>
        <p className="text-sm text-(--text-primary)">14-Day Nurture</p>
      </div>
      <label>
        <span className="text-[10px] uppercase text-(--text-muted)">
          First Send Date
        </span>
        <input
          type="date"
          required
          value={date}
          onChange={(event) => onDate(event.target.value)}
          className="mt-1 w-full rounded-lg bg-(--surface-2) p-2 text-(--text-primary)"
        />
      </label>
      <label>
        <span className="text-[10px] uppercase text-(--text-muted)">
          First Send Time
        </span>
        <input
          type="time"
          required
          value={time}
          onChange={(event) => onTime(event.target.value)}
          className="mt-1 w-full rounded-lg bg-(--surface-2) p-2 text-(--text-primary)"
        />
      </label>
      <div>
        <p className="text-[10px] uppercase text-(--text-muted)">Timezone</p>
        <p className="text-sm text-(--text-primary)">America/New_York</p>
      </div>
      <label className="flex items-center gap-3 sm:col-span-4 text-sm text-(--text-secondary)">
        <input
          type="checkbox"
          checked={permission}
          onChange={(event) => onPermission(event.target.checked)}
        />
        SMS permission has been verified for all selected Leads
      </label>
    </div>
  );
}
function Result({
  result,
  onClose,
}: {
  result: BulkEnrollmentResult;
  onClose: () => void;
}) {
  return (
    <div className="overflow-y-auto p-6">
      <h3 className="font-serif text-2xl text-(--healthy)">Enrollment results</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <p className="rounded-xl bg-(--healthy-soft) p-4 text-(--healthy)">
          {result.enrolled.length} enrolled
        </p>
        <p className="rounded-xl bg-(--warning-soft) p-4 text-(--warning)">
          {result.skipped.length} skipped
        </p>
        <p className="rounded-xl bg-(--danger-soft) p-4 text-(--danger)">
          {result.failed.length} failed
        </p>
      </div>
      {[...result.skipped, ...result.failed].map((item, index) => (
        <p key={index} className="mt-2 text-sm text-(--text-secondary)">
          {item.name || item.leadId}: {item.reason}
        </p>
      ))}
      <button
        onClick={onClose}
        className="mt-6 rounded-xl bg-(--brand-primary) px-5 py-2 font-bold text-(--primary-foreground)"
      >
        Done
      </button>
    </div>
  );
}
function formatSchedule(date: string, time: string) {
  return date && time
    ? new Date(firstSend(date, time)).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not selected";
}
