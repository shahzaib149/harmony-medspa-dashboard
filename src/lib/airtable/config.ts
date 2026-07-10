export const AIRTABLE_LEADS_BASE_ID = process.env.AIRTABLE_LEADS_BASE_ID ?? "appNL010pW9LUpgST";

export function getAirtableApiKey() {
  return process.env.AIRTABLE_API_KEY?.trim() ?? "";
}

export function isAirtableConfigured() {
  return Boolean(getAirtableApiKey());
}
