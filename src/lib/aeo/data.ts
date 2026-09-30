import "server-only";
import fs from "node:fs/promises";
import { listRecords, textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { summariseAttribution, type AttributionLead, type LeadAttribution } from "@/lib/aeo/attribution";
import { parseCompetitors, PROMPT_CATEGORIES, type PromptCategory, type VisibilityRow } from "@/lib/aeo/visibility";
import { countsAsRealLead } from "@/lib/leads/classification";

// Harmony base (appNL010pW9LUpgST). IDs are stable even if tables are renamed.
export const AEO_TABLES = {
  visibility: "tblKSJAoeACfueFgC",
  prompts: "tblirxomkWOgwb61q",
  leads: "tblLmBUvsRYFWrp5N",
} as const;

export type Loaded<T> = { ok: true; data: T } | { ok: false; error: string };

export type PromptSet = { active: number; byCategory: Record<PromptCategory, number> };

export type AeoReportData = {
  visibility: Loaded<VisibilityRow[]>;
  prompts: Loaded<PromptSet>;
  attribution: Loaded<LeadAttribution>;
};

type Fixture = {
  visibility?: VisibilityRow[];
  prompts?: PromptSet;
  leads?: Array<AttributionLead & { leadType?: string }>;
};

/**
 * Local screenshots only: AEO_FIXTURE_FILE points at a JSON file outside the repo.
 * Ignored unless NODE_ENV is "development", so it can never affect production.
 */
async function readFixture(): Promise<Fixture | null> {
  const file = process.env.AEO_FIXTURE_FILE?.trim();
  if (process.env.NODE_ENV !== "development" || !file) return null;
  return JSON.parse(await fs.readFile(file, "utf8")) as Fixture;
}

function bool(fields: Record<string, unknown>, key: string) {
  return fields[key] === true;
}

function toVisibilityRow(record: AirtableRecord): VisibilityRow {
  const f = record.fields;
  const position = typeof f["Position"] === "number" && Number.isFinite(f["Position"]) ? (f["Position"] as number) : null;
  return {
    checkDate: textField(f, "Check Date").slice(0, 10),
    prompt: textField(f, "Prompt").trim(),
    category: textField(f, "Prompt Category"),
    engine: textField(f, "Engine"),
    mentioned: bool(f, "Mentioned"),
    position: bool(f, "Mentioned") ? position : null,
    cited: bool(f, "Cited"),
    competitors: parseCompetitors(textField(f, "Competitors Named")),
    notes: textField(f, "Notes"),
  };
}

function emptyCategories(): Record<PromptCategory, number> {
  return Object.fromEntries(PROMPT_CATEGORIES.map((c) => [c, 0])) as Record<PromptCategory, number>;
}

function reason(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function loadVisibility(): Promise<VisibilityRow[]> {
  const params = new URLSearchParams();
  for (const field of ["Check Date", "Prompt", "Prompt Category", "Engine", "Mentioned", "Position", "Cited", "Competitors Named", "Notes"]) params.append("fields[]", field);
  const records = await listRecords(AEO_TABLES.visibility, params);
  return records.map(toVisibilityRow).filter((row) => row.checkDate && row.prompt && row.engine);
}

async function loadPrompts(): Promise<PromptSet> {
  const params = new URLSearchParams({ filterByFormula: "{Active}" });
  params.append("fields[]", "Category");
  const records = await listRecords(AEO_TABLES.prompts, params);
  const byCategory = emptyCategories();
  for (const record of records) {
    const category = textField(record.fields, "Category") as PromptCategory;
    if (category in byCategory) byCategory[category] += 1;
  }
  return { active: records.length, byCategory };
}

async function loadAttribution(): Promise<LeadAttribution> {
  const params = new URLSearchParams();
  for (const field of ["Referrer Source", "UTM Source", "Lead Created At", "Lead Type"]) params.append("fields[]", field);
  const records = await listRecords(AEO_TABLES.leads, params);
  const leads = records
    .filter((record) => countsAsRealLead({ leadType: textField(record.fields, "Lead Type") }))
    .map((record) => ({
      createdAt: textField(record.fields, "Lead Created At") || record.createdTime,
      referrerSource: textField(record.fields, "Referrer Source"),
      utmSource: textField(record.fields, "UTM Source"),
    }));
  return summariseAttribution(leads);
}

async function settle<T>(load: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await load() };
  } catch (error) {
    return { ok: false, error: reason(error) };
  }
}

export async function loadAeoReport(): Promise<AeoReportData> {
  const fixture = await readFixture();
  if (fixture) {
    const leads = (fixture.leads ?? []).filter((lead) => countsAsRealLead({ leadType: lead.leadType ?? "" }));
    return {
      visibility: { ok: true, data: fixture.visibility ?? [] },
      prompts: { ok: true, data: fixture.prompts ?? { active: 0, byCategory: emptyCategories() } },
      attribution: { ok: true, data: summariseAttribution(leads) },
    };
  }
  const [visibility, prompts, attribution] = await Promise.all([settle(loadVisibility), settle(loadPrompts), settle(loadAttribution)]);
  return { visibility, prompts, attribution };
}
