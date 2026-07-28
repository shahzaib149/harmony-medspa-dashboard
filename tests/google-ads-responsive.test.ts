import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const workspace = read(
  "src/app/google-ads-analytics/components/GoogleAdsWorkspace.tsx",
);
const dashboard = read("src/components/layout/DashboardLayout.tsx");
const styles = read("src/app/globals.css");

test("Google Ads shell contains horizontal overflow at the table, not page, level", () => {
  assert.match(dashboard, /min-w-0 max-w-full flex-1 overflow-x-hidden/);
  assert.match(workspace, /google-ads-table-shell[^\n]+overflow-auto/);
  assert.doesNotMatch(workspace, /\b(?:w-screen|100vw)\b/);
  assert.match(styles, /overscroll-behavior: contain/);
});

test("primary entity lists render mobile cards and desktop tables", () => {
  for (const label of [
    "Open campaign",
    "Open ad group",
    "Open ad",
    "Open keyword",
  ]) {
    assert.match(workspace, new RegExp(`actionLabel="${label}"`));
  }
  assert.match(workspace, /space-y-3 md:hidden/);
  assert.match(workspace, /google-ads-table-shell hidden[^\n]+md:block/);
});

test("workspace navigation and filters retain responsive interaction contracts", () => {
  assert.match(workspace, /scrollIntoView/);
  assert.match(workspace, /role="tablist"/);
  assert.match(workspace, /min-h-11 items-center/);
  assert.match(workspace, /useDebouncedValue\(search, 300\)/);
  assert.match(workspace, /google-ads-filters:/);
  assert.match(workspace, /Clear filters/);
});

test("large entity lists expose selectable bounded page sizes", () => {
  assert.match(workspace, /useState<25 \| 50 \| 100>\(25\)/);
  assert.match(workspace, /aria-label="Rows per page"/);
  assert.match(workspace, /<option value=\{100\}>100<\/option>/);
  assert.match(workspace, /sorted\.slice\(safePage \* pageSize/);
  const route = read("src/app/api/google-ads/workspace/route.ts");
  assert.match(route, /function paginatedAds/);
  assert.match(route, /view === "ads"/);
  assert.match(route, /ads: filtered\.slice\(safePage \* pageSize/);
});

test("all Google Ads workspace routes use the shared page", () => {
  const routes = [
    "campaigns",
    "ad-groups",
    "ads",
    "keywords",
    "search-terms",
    "assets",
    "publishing",
    "ai-suggestions",
  ];
  for (const route of routes) {
    const source = read(`src/app/google-ads-analytics/${route}/page.tsx`);
    assert.match(source, /WorkspacePage/);
  }
});

test("workspace queries reuse OAuth and defer secondary inventories", () => {
  const client = read("src/lib/google/ads-client.ts");
  const route = read("src/app/api/google-ads/workspace/route.ts");
  assert.match(client, /let accessTokenRequest: Promise<string> \| null/);
  assert.match(client, /includeSearchTerms\?: boolean/);
  assert.match(client, /includeAssets\?: boolean/);
  assert.match(route, /view === "search-terms"/);
  assert.match(route, /view === "assets"/);
  assert.doesNotMatch(route, /sync-audit/);
});
