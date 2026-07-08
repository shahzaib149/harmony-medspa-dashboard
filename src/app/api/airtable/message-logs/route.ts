import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import type { DeliveryStatus, MessageChannel, MessageLog } from "@/types/message-log";

const MESSAGE_LOG_TABLE = "Message Log";
const LEADS_TABLE = "Leads";
const BASE_ID = process.env.AIRTABLE_LEADS_BASE_ID ?? "appNL010pW9LUpgST";
const API_KEY = process.env.AIRTABLE_API_KEY!;

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

type LeadSummary = {
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
};

function str(fields: Record<string, unknown>, key: string): string {
  const value = fields[key];
  if (value === undefined || value === null || value === "") return "";
  return String(value);
}

function strAny(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = str(fields, key);
    if (value) return value;
  }
  return "";
}

function channel(value: string): MessageChannel {
  const normalized = value.trim().toLowerCase();
  if (normalized === "email") return "Email";
  if (normalized === "sms" || normalized === "text") return "SMS";
  return "Unknown";
}

function deliveryStatus(value: string): DeliveryStatus {
  const normalized = value.trim().toLowerCase();
  if (["pending", "queued", "scheduled", "sending"].includes(normalized)) return "Pending";
  if (["sent", "delivered", "success", "successful", "ok"].includes(normalized)) return "Sent";
  if (["failed", "fail", "error", "rejected", "bounced", "undelivered", "invalid"].includes(normalized)) return "Failed";
  return "Unknown";
}

function linkedLeadId(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item);
    return first ?? null;
  }
  if (typeof value === "string" && value) return value;
  return null;
}

function escapeFormulaString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function airtableErrorMessage(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
    return parsed?.error?.message ?? parsed?.error?.type ?? raw.slice(0, 200);
  } catch {
    return raw.slice(0, 200);
  }
}

async function fetchAirtableRecords(tableName: string, params: URLSearchParams): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const pageParams = new URLSearchParams(params);
    pageParams.set("pageSize", "100");
    if (offset) pageParams.set("offset", offset);

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}?${pageParams}`,
      { headers: { Authorization: `Bearer ${API_KEY}` }, next: { revalidate: 30 } }
    );

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      throw new Error(`Airtable ${response.status}: ${airtableErrorMessage(raw)}`);
    }

    const data = await response.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

async function fetchLeadSummaries(leadIds: string[]) {
  const leadMap = new Map<string, LeadSummary>();
  const uniqueIds = Array.from(new Set(leadIds)).filter(Boolean);

  for (let index = 0; index < uniqueIds.length; index += 20) {
    const batch = uniqueIds.slice(index, index + 20);
    const params = new URLSearchParams({
      filterByFormula: `OR(${batch.map((id) => `RECORD_ID()='${escapeFormulaString(id)}'`).join(",")})`,
    });

    try {
      const records = await fetchAirtableRecords(LEADS_TABLE, params);
      for (const record of records) {
        leadMap.set(record.id, {
          name: strAny(record.fields, "Name", "Full Name", "Patient Name", "Lead Name") || null,
          email: strAny(record.fields, "Email", "Email Address") || null,
          phone: strAny(record.fields, "Phone", "Phone Number", "Mobile") || null,
          status: strAny(record.fields, "Status", "Lead Status") || null,
        });
      }
    } catch (error) {
      console.error("Could not resolve linked leads for Message Log records", error);
    }
  }

  return leadMap;
}

function withinDateRange(iso: string | null, range: string) {
  if (range === "all") return true;
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const hours: Record<string, number> = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
    "90d": 24 * 90,
  };
  const maxHours = hours[range];
  if (!maxHours) return true;
  return Date.now() - date.getTime() <= maxHours * 60 * 60 * 1000;
}

function matchesSearch(log: MessageLog, query: string) {
  if (!query) return true;
  const haystack = [
    log.recipientLeadName,
    log.recipientLeadEmail,
    log.recipientLeadPhone,
    log.messageBody,
    log.mandrillMessageId,
    log.errorReason,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!API_KEY) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const channelFilter = searchParams.get("channel") ?? "All";
  const statusFilter = searchParams.get("status") ?? "All";
  const dateRange = searchParams.get("dateRange") ?? "all";
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  try {
    const params = new URLSearchParams({
      "sort[0][field]": "Sent At",
      "sort[0][direction]": "desc",
    });
    const records = await fetchAirtableRecords(MESSAGE_LOG_TABLE, params);
    const leadIds = records.map((record) => linkedLeadId(record.fields["Recipient Lead"])).filter((id): id is string => Boolean(id));
    const leadMap = await fetchLeadSummaries(leadIds);

    const messageLogs = records.map<MessageLog>((record) => {
      const recipientLeadId = linkedLeadId(record.fields["Recipient Lead"]);
      const lead = recipientLeadId ? leadMap.get(recipientLeadId) : null;

      return {
        id: record.id,
        recipientLeadId,
        recipientLeadName: lead?.name ?? (recipientLeadId ? "Linked lead" : null),
        recipientLeadEmail: lead?.email ?? null,
        recipientLeadPhone: lead?.phone ?? null,
        recipientLeadStatus: lead?.status ?? null,
        channel: channel(strAny(record.fields, "Channel", "Message Channel", "Type")),
        messageBody: strAny(record.fields, "Message Body", "Body", "Message", "Content"),
        deliveryStatus: deliveryStatus(strAny(record.fields, "Delivery Status", "Status", "Mandrill Status")),
        sentAt: strAny(record.fields, "Sent At", "Sent Date", "Created At") || record.createdTime,
        mandrillMessageId: strAny(record.fields, "Mandrill Message ID", "Mandrill ID", "Message ID") || null,
        errorReason: strAny(record.fields, "Error Reason", "Error", "Failure Reason") || null,
        createdTime: record.createdTime,
      };
    }).filter((log) => {
      const channelMatches = channelFilter === "All" || log.channel === channelFilter;
      const statusMatches = statusFilter === "All" || log.deliveryStatus === statusFilter;
      return channelMatches && statusMatches && withinDateRange(log.sentAt, dateRange) && matchesSearch(log, search);
    });

    return Response.json({ messageLogs, count: messageLogs.length });
  } catch (error) {
    console.error("Message Log Airtable fetch failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load message logs" },
      { status: 500 }
    );
  }
}
