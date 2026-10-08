import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, leadExportPageRequest } from "../src/lib/leads/export";

test("export pagination retains browser session and filters", () => {
  const original = new Request("https://dashboard.example/api/airtable/leads/export?view=all", { headers: { cookie: "session=verified", "x-unrelated": "not-forwarded" } });
  const page = leadExportPageRequest(original, new URLSearchParams({ view: "all", cursor: "nextPage", pageSize: "50" }));
  assert.equal(page.headers.get("cookie"), "session=verified");
  assert.equal(page.headers.get("x-unrelated"), null);
  assert.equal(new URL(page.url).searchParams.get("cursor"), "nextPage");
  assert.equal(new URL(page.url).searchParams.get("view"), "all");
});

test("API bearer authentication is forwarded, absent authentication is never manufactured", () => {
  const original = new Request("https://dashboard.example/api/airtable/leads/export", { headers: { authorization: "Bearer verified-token" } });
  assert.equal(leadExportPageRequest(original, new URLSearchParams()).headers.get("authorization"), "Bearer verified-token");
  assert.equal(leadExportPageRequest(new Request(original.url), new URLSearchParams()).headers.get("authorization"), null);
});

test("CSV preserves multiline quotes and neutralizes executable cell prefixes", () => {
  assert.equal(csvCell('Hello, "world"\nnext line'), '"Hello, ""world""\nnext line"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell("=1+1"), '"\'=1+1"');
  assert.equal(csvCell("+19415550123"), '"\'+19415550123"');
});
