import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Security regression guard (see security report PHASE 8).
// Every exported HTTP handler in an API Route Handler MUST perform an
// independent server-side authorization check. This test fails the build if a
// new route ships without one, so protection can never silently regress.

const API_ROOT = join(process.cwd(), "src", "app", "api");
const HANDLER_RE = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;
const AUTH_CALL_RE = /require(?:Role|AuthenticatedUser|Admin|Editor)\s*\(/;

// Routes that are intentionally exempt from an inline auth call, each with a
// documented reason. Keep this list SHORT and justified — do not add a route
// here just to silence the test.
const EXEMPT: Record<string, string> = {
  // Thin delegates that forward the (unchanged) Request to an already-protected
  // handler which performs the auth check.
  "airtable/message-log/route.ts":
    "delegates to airtable/message-logs GET (viewer-protected)",
  "airtable/nurture-enrollments/import/route.ts":
    "forwards the request to nurture-enrollments/bulk-enroll POST (admin-protected)",
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === "route.ts") out.push(full);
  }
  return out;
}

test("every API route handler enforces server-side authorization", () => {
  const files = walk(API_ROOT);
  assert.ok(files.length > 0, "expected to find API route handlers");

  const offenders: string[] = [];

  for (const file of files) {
    const rel = relative(API_ROOT, file).replace(/\\/g, "/");
    const source = readFileSync(file, "utf8");
    const methods = [...source.matchAll(HANDLER_RE)].map((m) => m[1]);
    if (methods.length === 0) continue;

    if (rel in EXEMPT) continue;

    if (!AUTH_CALL_RE.test(source)) {
      offenders.push(`${rel} exports [${methods.join(", ")}] but has no requireRole/requireAuthenticatedUser call`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Unprotected API route handler(s) found:\n  - ${offenders.join("\n  - ")}\n\n` +
      `Add an auth guard (e.g. \`await requireRole(request, "viewer")\`) or, if the route is a ` +
      `thin delegate to an already-protected handler, add it to EXEMPT with a reason.`,
  );
});
