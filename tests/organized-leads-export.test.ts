import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { mapLead } from "../src/lib/leads/map-lead";
import { ALL_CALLS, callMarker } from "../src/lib/leads/call-records";
import { allLeadExportParams } from "../src/lib/leads/export";
import { EXPORT_HEADERS, organizedLeadCsv, organizedLeadRows } from "../src/lib/leads/organized-export";
import { leadExportWorkbook } from "../src/lib/leads/export-workbook";

const fixture = (id: string, source: string, extras = {}) => mapLead({ id, createdTime: "2026-07-16T14:00:00Z", fields: { Name: "=HYPERLINK(\"https://example.com\")", Phone: "+19415550123", Email: "test@example.com", Source: source, ...extras } });

test("all history includes non-leads and manual marketing while merging a saved call", () => {
  const call = ALL_CALLS[0];
  const leads = [fixture("website", "Website Contact Form", { "Lead Type": "Solicitor" }), fixture("marketing", "Manual Campaign Entry"), fixture("linked", "Call Leads", { Message: callMarker(call.id) }), fixture("unlinked", "Call Leads")];
  const rows = organizedLeadRows(leads);
  assert.equal(rows.length, ALL_CALLS.length + 3);
  assert.equal(rows.filter((row) => row[0] === "Marketing Leads").length, 1);
  assert.equal(rows.filter((row) => row[4] === call.id).length, 1);
  const linked = rows.find((row) => row[3] === "linked")!;
  assert.equal(linked[6], leads[2].phone);
  assert.equal(linked[19], call.assessment);
  assert.equal(linked[20], "Saved lead");
  assert.equal(rows.find((row) => row[3] === "unlinked")![0], "Call Leads");
  assert(rows.every((row) => row.length === EXPORT_HEADERS.length));
});

test("full-history query cannot inherit source, date, search, or real-lead filters", () => {
  assert.equal(allLeadExportParams().toString(), "view=all&pageSize=50");
  const records = [fixture("future", "Website", { "Lead Created At": "2027-01-01T00:00:00Z" }), fixture("spam", "Website", { "Lead Type": "Spam", Status: "Not a Lead" }), fixture("duplicate", "Manual Entry", { "Duplicate Flag": true }), fixture("invalid-date", "Website", { "Lead Created At": "unknown" })];
  const rows = organizedLeadRows(records);
  assert.deepEqual(new Set(rows.filter((row) => row[3]).map((row) => row[3])), new Set(records.map((lead) => lead.id)));
  assert.equal(rows.filter((row) => row[4]).length, ALL_CALLS.length);
});

test("CSV and Excel preserve every call, including missed calls and hangups", async () => {
  const rows = organizedLeadRows([]);
  const csv = Papa.parse<string[]>(organizedLeadCsv(rows), { skipEmptyLines: true }).data.slice(1);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await leadExportWorkbook(rows));
  const sheet = workbook.getWorksheet("Call Leads")!;
  for (const call of ALL_CALLS) {
    const csvRow = csv.find((row) => row[4] === call.id)!;
    const index = rows.findIndex((row) => row[4] === call.id) + 5;
    assert(csvRow, `Missing call ${call.id}`);
    assert.equal(csvRow[18], call.missed ? "Missed" : "Answered");
    assert.equal(csvRow[19], call.assessment);
    assert.equal(sheet.getCell(index, 5).value, call.id);
    assert.equal(sheet.getCell(index, 19).value, call.missed ? "Missed" : "Answered");
  }
  assert.equal(csv.filter((row) => row[18] === "Missed").length, ALL_CALLS.filter((call) => call.missed).length);
});

test("CSV roundtrip preserves multiline data and categorizes pending calls safely", () => {
  const rows = organizedLeadRows([fixture("website", "Website Contact Form", { Message: 'Message, "quoted"\nsecond line' })]);
  const parsed = Papa.parse<string[]>(organizedLeadCsv(rows), { skipEmptyLines: true });
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.data.length, rows.length + 1);
  const row = parsed.data.find((row) => row[3] === "website")!;
  assert.equal(row[22], 'Message, "quoted"\nsecond line');
  assert(row[5].startsWith("'="));
  const pending = parsed.data.find((row) => row[20] === "Caller details pending")!;
  assert.equal(pending[5], "");
  assert.equal(pending[6], "");
});

test("Excel download is a valid four-sheet workbook with identical overall records", async () => {
  const rows = organizedLeadRows([fixture("website", "Website Contact Form"), fixture("marketing", "Manual Campaign Entry")]);
  const bytes = await leadExportWorkbook(rows);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Overall Data", "Leads", "Marketing Leads", "Call Leads"]);
  const overall = workbook.getWorksheet("Overall Data")!;
  assert.equal(overall.rowCount, rows.length + 4);
  assert.equal(workbook.getWorksheet("Call Leads")!.rowCount, ALL_CALLS.length + 4);
  const website = rows.findIndex((row) => row[3] === "website") + 5;
  assert.equal(overall.getCell(website, 6).value, '=HYPERLINK("https://example.com")');
  assert.equal(overall.getCell(website, 7).value, "+19415550123");
  assert.equal(overall.getCell(website, 7).numFmt, "@");
  assert.equal(overall.getCell(website, 6).type, ExcelJS.ValueType.String);
});
