import "server-only";
import { unstable_cache } from "next/cache";
import { listRecords, textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { mapLead, type Lead } from "@/lib/leads/map-lead";
import { BLACK_FRIDAY_OFFER_CODE, GIFT_CARD_FORMULA } from "@/lib/leads/classification";
import { MESSAGE_LOG_FIELDS, MESSAGE_LOG_FIELDS_WITH_BODY, dateValue, mapMessageLog, messageLogQuery, sequenceFormula } from "@/lib/campaigns/message-log";
import type { MessageLog } from "@/types/message-log";
import {
  BF_AUDIENCE_TABLE, BLACK_FRIDAY_SEQUENCE, buildBlackFridayCampaign, summarizeBlackFriday,
  type AudienceContact, type BfMessage, type BlackFridayCampaignData,
} from "./campaign";
import { GIFT_CARD_CONFIRMATION_STEP, buildGiftCardCampaign, summarizeGiftCards, type GiftCardCampaignData, type GiftCardMessage } from "@/lib/gift-cards/campaign";

/** Same tags as the campaigns overview: lead writes and the Refresh button expire them. */
const TAGS = ["airtable-leads", "campaigns"];

const quote = (value: string) => `'${value.replaceAll("'", "\\'")}'`;
function query(formula: string | null, fields: string[] = []) {
  const params = new URLSearchParams(formula ? { filterByFormula: formula } : {});
  fields.forEach((field) => params.append("fields[]", field));
  return params;
}

const AUDIENCE_FIELDS = ["Name", "First Name", "Email", "Phone", "Segment", "Email OK", "SMS OK", "Unsubscribed", "Also a Lead", "Sent Steps", "Notes"];
const AUDIENCE_COUNT_FIELDS = ["Email", "Phone", "Segment", "Email OK", "SMS OK", "Unsubscribed", "Also a Lead", "Sent Steps"];

function mapContact(record: AirtableRecord): AudienceContact {
  const f = record.fields;
  const segment = textField(f, "Segment");
  return {
    id: record.id,
    name: textField(f, "Name") || "Unnamed contact",
    firstName: textField(f, "First Name"),
    email: textField(f, "Email"),
    phone: textField(f, "Phone"),
    segment: segment === "Member" || segment === "Existing Patient" ? segment : "",
    emailOk: f["Email OK"] === true,
    smsOk: f["SMS OK"] === true,
    unsubscribed: f.Unsubscribed === true,
    alsoLead: f["Also a Lead"] === true,
    sentSteps: Array.isArray(f["Sent Steps"]) ? (f["Sent Steps"] as unknown[]).map(String) : [],
    notes: textField(f, "Notes"),
    createdAt: record.createdTime,
  };
}

const toBfMessage = (m: MessageLog): BfMessage => ({ id: m.id, step: m.sequenceStep ?? "", channel: m.channel, status: m.rawDeliveryStatus ?? "", sentAt: m.sentAt ?? m.createdTime });
const byNewest = (a: MessageLog, b: MessageLog) => dateValue(b.sentAt) - dateValue(a.sentAt);

async function bfLeads() {
  return (await listRecords("Leads", query(`{Offer Code}=${quote(BLACK_FRIDAY_OFFER_CODE)}`))).map(mapLead);
}

/** Card summary: only the fields it counts, no message bodies. */
export async function blackFridaySummary() {
  const [audience, messages, leads] = await Promise.all([
    listRecords(BF_AUDIENCE_TABLE, query(null, AUDIENCE_COUNT_FIELDS)),
    listRecords("Message Log", messageLogQuery(sequenceFormula([BLACK_FRIDAY_SEQUENCE]), MESSAGE_LOG_FIELDS)),
    bfLeads(),
  ]);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const logs = messages.map((record) => mapMessageLog(record, leadMap));
  return summarizeBlackFriday(buildBlackFridayCampaign(audience.map(mapContact), logs.map(toBfMessage), leads));
}

export type BlackFridayWorkspace = BlackFridayCampaignData & { websiteLeads: Lead[]; conversations: MessageLog[] };

async function loadBlackFridayWorkspace(): Promise<BlackFridayWorkspace> {
  const [audience, messages, leads] = await Promise.all([
    listRecords(BF_AUDIENCE_TABLE, query(null, AUDIENCE_FIELDS)),
    listRecords("Message Log", messageLogQuery(sequenceFormula([BLACK_FRIDAY_SEQUENCE]), MESSAGE_LOG_FIELDS_WITH_BODY)),
    bfLeads(),
  ]);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const conversations = messages.map((record) => mapMessageLog(record, leadMap)).sort(byNewest);
  const data = buildBlackFridayCampaign(audience.map(mapContact), conversations.map(toBfMessage), leads);
  return { ...data, websiteLeads: [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), conversations };
}

/** Gift card card summary. */
export async function giftCardSummary() {
  return summarizeGiftCards(await loadGiftCards(false));
}

export type GiftCardWorkspace = GiftCardCampaignData & { conversations: MessageLog[] };

async function loadGiftCards(withBody: boolean): Promise<GiftCardWorkspace> {
  const [records, messages] = await Promise.all([
    listRecords("Leads", query(GIFT_CARD_FORMULA)),
    listRecords("Message Log", messageLogQuery(`{Sequence Step}=${quote(GIFT_CARD_CONFIRMATION_STEP)}`, withBody ? MESSAGE_LOG_FIELDS_WITH_BODY : MESSAGE_LOG_FIELDS)),
  ]);
  const leads = records.map(mapLead);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const conversations = messages.map((record) => mapMessageLog(record, leadMap)).sort(byNewest);
  const giftMessages: GiftCardMessage[] = conversations.map((m) => ({ id: m.id, leadIds: m.recipientLeadId ? [m.recipientLeadId] : [], channel: m.channel, status: m.rawDeliveryStatus ?? "", sentAt: m.sentAt ?? m.createdTime }));
  return { ...buildGiftCardCampaign(leads, giftMessages), conversations };
}

/** Workspaces, in Next's shared data cache (stale-while-revalidate across server instances). */
export const cachedBlackFridayWorkspace = unstable_cache(loadBlackFridayWorkspace, ["black-friday-workspace-v2"], { tags: TAGS, revalidate: 120 });
export const cachedGiftCardWorkspace = unstable_cache(() => loadGiftCards(true), ["gift-card-workspace-v2"], { tags: TAGS, revalidate: 120 });
