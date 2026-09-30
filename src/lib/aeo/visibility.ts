// Pure aggregation for AI visibility checks (AEO_Visibility rows). No I/O here.

export const ENGINES = ["ChatGPT", "Perplexity", "Gemini", "Google AI Overview"] as const;
export type Engine = (typeof ENGINES)[number];
export const PROMPT_CATEGORIES = ["Discovery", "Service", "Comparison", "Local"] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export type VisibilityRow = {
  checkDate: string; // YYYY-MM-DD
  prompt: string;
  category: string;
  engine: string;
  mentioned: boolean;
  position: number | null;
  cited: boolean;
  competitors: string[];
  notes: string;
};

export type MentionRatePoint = { date: string } & Partial<Record<Engine, number>>;

/**
 * Mention rate per check date per engine: share of the prompts checked that day
 * on that engine where Harmony was mentioned. Uses the rows actually recorded for
 * that run, not today's prompt list, so past points never shift.
 */
export function mentionRateSeries(rows: VisibilityRow[]): MentionRatePoint[] {
  const byDate = new Map<string, Map<string, { total: number; mentioned: number }>>();
  for (const row of rows) {
    if (!row.checkDate || !row.engine) continue;
    const engines = byDate.get(row.checkDate) ?? new Map();
    const tally = engines.get(row.engine) ?? { total: 0, mentioned: 0 };
    tally.total += 1;
    if (row.mentioned) tally.mentioned += 1;
    engines.set(row.engine, tally);
    byDate.set(row.checkDate, engines);
  }
  return [...byDate.keys()].sort().map((date) => {
    const point: MentionRatePoint = { date };
    for (const [engine, tally] of byDate.get(date)!) {
      if ((ENGINES as readonly string[]).includes(engine) && tally.total) {
        point[engine as Engine] = Math.round((tally.mentioned / tally.total) * 100);
      }
    }
    return point;
  });
}

export type EngineSnapshot = {
  engine: Engine;
  checkDate: string | null;
  prompts: number;
  mentions: number;
  citations: number;
  averagePosition: number | null;
};

/** Each engine's most recent check run. */
export function engineSnapshots(rows: VisibilityRow[]): EngineSnapshot[] {
  return ENGINES.map((engine) => {
    const engineRows = rows.filter((row) => row.engine === engine && row.checkDate);
    const checkDate = engineRows.reduce<string | null>((latest, row) => (!latest || row.checkDate > latest ? row.checkDate : latest), null);
    const latest = engineRows.filter((row) => row.checkDate === checkDate);
    const positions = latest.filter((row) => row.mentioned && row.position !== null).map((row) => row.position as number);
    return {
      engine,
      checkDate,
      prompts: latest.length,
      mentions: latest.filter((row) => row.mentioned).length,
      citations: latest.filter((row) => row.cited).length,
      averagePosition: positions.length ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : null,
    };
  });
}

/** Normalise a competitor name so "elite medical spa " and "Elite Medical Spa" count together. */
export function normaliseCompetitor(name: string) {
  return name.trim().replace(/\s+/g, " ").replace(/[.,;]+$/, "");
}

export function parseCompetitors(value: string): string[] {
  return value.split(/[,\n]/).map(normaliseCompetitor).filter(Boolean);
}

export type CompetitorCount = { name: string; mentions: number; engines: number };

/** Competitors named across all checks, most frequent first. */
export function competitorLeaderboard(rows: VisibilityRow[], limit = 10): CompetitorCount[] {
  const counts = new Map<string, { name: string; mentions: number; engines: Set<string> }>();
  for (const row of rows) {
    for (const raw of row.competitors) {
      const name = normaliseCompetitor(raw);
      if (!name) continue;
      const key = name.toLowerCase();
      const entry = counts.get(key) ?? { name, mentions: 0, engines: new Set<string>() };
      entry.mentions += 1;
      entry.engines.add(row.engine);
      counts.set(key, entry);
    }
  }
  return [...counts.values()]
    .map(({ name, mentions, engines }) => ({ name, mentions, engines: engines.size }))
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Latest result for each prompt on each engine. */
export function latestPerPrompt(rows: VisibilityRow[]): VisibilityRow[] {
  const latest = new Map<string, VisibilityRow>();
  for (const row of rows) {
    const key = `${row.prompt.toLowerCase()}::${row.engine}`;
    const current = latest.get(key);
    if (!current || row.checkDate > current.checkDate) latest.set(key, row);
  }
  return [...latest.values()].sort((a, b) => a.prompt.localeCompare(b.prompt) || a.engine.localeCompare(b.engine));
}

export function latestCheckDate(rows: VisibilityRow[]): string | null {
  return rows.reduce<string | null>((latest, row) => (row.checkDate && (!latest || row.checkDate > latest) ? row.checkDate : latest), null);
}
