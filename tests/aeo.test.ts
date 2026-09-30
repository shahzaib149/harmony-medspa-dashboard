import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyLeadSource, sourceLabel } from "../src/lib/aeo/referrer-classification";
import { summariseAttribution } from "../src/lib/aeo/attribution";
import {
  competitorLeaderboard,
  engineSnapshots,
  latestCheckDate,
  latestPerPrompt,
  mentionRateSeries,
  parseCompetitors,
  type VisibilityRow,
} from "../src/lib/aeo/visibility";

const row = (overrides: Partial<VisibilityRow>): VisibilityRow => ({
  checkDate: "2026-10-01", prompt: "best med spa in Sarasota FL", category: "Discovery", engine: "ChatGPT",
  mentioned: false, position: null, cited: false, competitors: [], notes: "", ...overrides,
});

test("referrer classification", () => {
  assert.equal(classifyLeadSource("https://chatgpt.com/"), "AI");
  assert.equal(classifyLeadSource("https://www.perplexity.ai/search?q=x"), "AI");
  assert.equal(classifyLeadSource("https://www.google.com/"), "Search");
  assert.equal(classifyLeadSource("https://www.google.co.uk/"), "Search");
  assert.equal(classifyLeadSource("https://l.facebook.com/l.php"), "Social");
  assert.equal(classifyLeadSource("direct"), "Direct");
  assert.equal(classifyLeadSource("https://www.harmonymedspafl.com/services"), "Direct");
  assert.equal(classifyLeadSource("https://some-blog.example/post"), "Other");
  assert.equal(classifyLeadSource(""), "Not captured");
  // Gemini is AI, not Google Search.
  assert.equal(classifyLeadSource("https://gemini.google.com/app"), "AI");
  // An AI UTM tag wins when the referrer itself was stripped.
  assert.equal(classifyLeadSource("direct", "chatgpt.com"), "AI");
  assert.equal(sourceLabel("direct", "chatgpt.com"), "chatgpt.com");
  assert.equal(sourceLabel("https://www.perplexity.ai/x"), "perplexity.ai");
});

test("attribution never counts uncaptured leads as Direct and fills month gaps", () => {
  const summary = summariseAttribution([
    { createdAt: "2026-08-10T10:00:00Z", referrerSource: "", utmSource: "" },
    { createdAt: "2026-10-02T10:00:00Z", referrerSource: "https://chatgpt.com/", utmSource: "" },
    { createdAt: "2026-12-05T10:00:00Z", referrerSource: "direct", utmSource: "chatgpt.com" },
    { createdAt: "2026-11-05T10:00:00Z", referrerSource: "direct", utmSource: "" },
  ]);
  assert.equal(summary.notCaptured, 1);
  assert.equal(summary.captured, 3);
  assert.equal(summary.byClass.Direct, 1);
  assert.equal(summary.byClass.AI, 2);
  assert.deepEqual(summary.aiByMonth, [{ month: "2026-10", leads: 1 }, { month: "2026-11", leads: 0 }, { month: "2026-12", leads: 1 }]);
  assert.deepEqual(summary.aiSources, [{ source: "chatgpt.com", leads: 2 }]);
});

test("mention rate uses the rows recorded in each run", () => {
  const rows = [
    row({ mentioned: true }), row({ prompt: "b" }), row({ prompt: "c" }), row({ prompt: "d", mentioned: true }),
    row({ engine: "Perplexity", mentioned: true }),
    row({ checkDate: "2026-10-04", mentioned: true }),
  ];
  assert.deepEqual(mentionRateSeries(rows), [
    { date: "2026-10-01", ChatGPT: 50, Perplexity: 100 },
    { date: "2026-10-04", ChatGPT: 100 },
  ]);
});

test("snapshot, leaderboard and latest-per-prompt", () => {
  const rows = [
    row({ checkDate: "2026-10-01", mentioned: true, position: 4, competitors: ["Elite Medical Spa"] }),
    row({ checkDate: "2026-10-04", mentioned: true, position: 2, cited: true, competitors: ["Elite Medical Spa", "SRQ Med Spa"] }),
    row({ checkDate: "2026-10-04", prompt: "b", mentioned: true, position: 3, competitors: ["elite medical spa "] }),
    row({ engine: "Gemini", competitors: ["SRQ Med Spa"] }),
  ];
  const chatgpt = engineSnapshots(rows).find((s) => s.engine === "ChatGPT")!;
  assert.deepEqual(chatgpt, { engine: "ChatGPT", checkDate: "2026-10-04", prompts: 2, mentions: 2, citations: 1, averagePosition: 2.5 });
  assert.equal(engineSnapshots(rows).find((s) => s.engine === "Perplexity")!.checkDate, null);
  assert.deepEqual(competitorLeaderboard(rows), [
    { name: "Elite Medical Spa", mentions: 3, engines: 1 },
    { name: "SRQ Med Spa", mentions: 2, engines: 2 },
  ]);
  const latest = latestPerPrompt(rows);
  assert.equal(latest.length, 3);
  assert.equal(latest.find((r) => r.prompt === "best med spa in Sarasota FL" && r.engine === "ChatGPT")!.position, 2);
  assert.equal(latestCheckDate(rows), "2026-10-04");
  assert.equal(latestCheckDate([]), null);
  assert.deepEqual(parseCompetitors("Elite Medical Spa, SRQ Med Spa.,\nBowtique"), ["Elite Medical Spa", "SRQ Med Spa", "Bowtique"]);
});
