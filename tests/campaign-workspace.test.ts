import test from "node:test";
import assert from "node:assert/strict";
import { countdown, initials, paginate, relativeTime } from "../src/lib/campaigns/paginate";
import { createLimiter, retryDelayMs } from "../src/lib/airtable/throttle";
import { nextSend, type StepProgress } from "../src/lib/black-friday/campaign";
import { deliveryStatus, mapMessageLog, messageLogQuery, sequenceFormula } from "../src/lib/campaigns/message-log";

test("paginate slices pages and clamps out-of-range pages", () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);
  const p2 = paginate(items, 2, 20);
  assert.deepEqual([p2.from, p2.to, p2.pages, p2.rows[0]], [21, 40, 3, 21]);
  const last = paginate(items, 9, 20);
  assert.deepEqual([last.page, last.from, last.to, last.rows.length], [3, 41, 45, 5]);
  const empty = paginate([], 4, 30);
  assert.deepEqual([empty.page, empty.pages, empty.from, empty.to], [1, 1, 0, 0]);
});

test("initials ignore nickname quotes and brackets", () => {
  assert.equal(initials('Lauren "Laurie" Minero'), "LM");
  assert.equal(initials("Swareen (Reena) Lynam"), "SL");
  assert.equal(initials("Cher"), "C");
  assert.equal(initials("  "), "?");
});

test("countdown and relative time read naturally", () => {
  const now = Date.parse("2026-11-24T15:00:00Z");
  assert.equal(countdown(now + (2 * 1440 + 4 * 60 + 5) * 60_000, now), "in 2d 4h");
  assert.equal(countdown(now + 95 * 60_000, now), "in 1h 35m");
  assert.equal(countdown(now - 1, now), "now");
  assert.equal(relativeTime("2026-11-24T14:57:00Z", now), "3m ago");
  assert.equal(relativeTime("2026-11-22T15:00:00Z", now), "2d ago");
  assert.equal(relativeTime("not a date", now), "");
});

test("limiter spaces request starts and never lets two start in the same slot", async () => {
  let clock = 0;
  const waits: number[] = [];
  const wait = createLimiter(220, () => clock, async (ms) => { waits.push(ms); clock += ms; });
  const starts: number[] = [];
  await Promise.all([0, 1, 2, 3].map(async () => { await wait(); starts.push(clock); }));
  assert.deepEqual(starts, [0, 220, 440, 660]);
  assert.deepEqual(waits, [220, 220, 220]);
});

test("429 backoff honours Retry-After (capped) and otherwise doubles from 1s", () => {
  assert.equal(retryDelayMs(1, null), 1000);
  assert.equal(retryDelayMs(2, null), 2000);
  assert.equal(retryDelayMs(3, ""), 4000);
  assert.equal(retryDelayMs(1, "3"), 3000);
  assert.equal(retryDelayMs(1, "30"), 8000);
});

const step = (id: StepProgress["id"], sent: number, eligible: number): StepProgress => ({ id, label: id, window: "", sent, eligible, remaining: eligible - sent, state: "Scheduled" });

test("next send skips finished steps and past slots", () => {
  const steps = [step("Members Early Access", 18, 1690), step("Public Sale Open", 0, 1690), step("Last Chance", 0, 1690)];
  assert.deepEqual(nextSend(steps, new Date("2026-11-24T13:00:00Z")), { step: steps[0], at: "2026-11-24T10:00:00-05:00" });
  assert.equal(nextSend(steps, new Date("2026-11-24T16:00:00Z"))?.at, "2026-11-25T10:00:00-05:00");
  const done = [step("Members Early Access", 1690, 1690), steps[1], steps[2]];
  assert.equal(nextSend(done, new Date("2026-11-24T13:00:00Z"))?.step.id, "Public Sale Open");
  assert.equal(nextSend(steps, new Date("2026-12-01T00:00:00Z")), null);
});

test("Message Log mapping keeps the shared delivery buckets and lead details", () => {
  const leads = new Map([["recLead", { name: "Fictional Lead", email: "lead@example.com", phone: "+19415550100", status: "New" }]]);
  const mapped = mapMessageLog({ id: "recMsg", createdTime: "2026-11-23T12:00:00Z", fields: { "Recipient Lead": ["recLead"], Channel: "SMS", Sequence: "Black Friday 2026", "Sequence Step": "BF-Instant", "Delivery Status": "sent", "Message Body": "Hi" } }, leads);
  assert.equal(mapped.recipientLeadName, "Fictional Lead");
  assert.equal(mapped.deliveryStatus, "Sent");
  assert.equal(mapped.sentAt, "2026-11-23T12:00:00Z");
  assert.equal(mapMessageLog({ id: "x", createdTime: "", fields: {} }, leads).isOrphaned, true);
  assert.equal(deliveryStatus("rejected"), "Failed");
  assert.equal(deliveryStatus("queued"), "Pending");
});

test("Message Log queries filter by sequence and request only the needed fields", () => {
  assert.equal(sequenceFormula(["Speed-to-Lead"]), "{Sequence}='Speed-to-Lead'");
  assert.equal(sequenceFormula(["A", "B's"]), "OR({Sequence}='A',{Sequence}='B\\'s')");
  const q = messageLogQuery("{Sequence}='A'");
  assert.equal(q.get("filterByFormula"), "{Sequence}='A'");
  assert.ok(!q.getAll("fields[]").includes("Message Body"));
});
