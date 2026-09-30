import { Bodoni_Moda } from "next/font/google";
import { Check } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { loadAeoReport, type AeoReportData } from "@/lib/aeo/data";
import { FOUNDATION_LIVE_SINCE, FOUNDATION_SCOPE, HEADLINE_METRICS, SUPPORTING_METRICS } from "@/lib/aeo/foundation";
import { WORK_ITEMS } from "@/lib/aeo/remaining-work";
import { REFERRER_CLASSES } from "@/lib/aeo/referrer-classification";
import {
  competitorLeaderboard,
  engineSnapshots,
  ENGINES,
  latestCheckDate,
  latestPerPrompt,
  mentionRateSeries,
  PROMPT_CATEGORIES,
  type VisibilityRow,
} from "@/lib/aeo/visibility";
import { AiLeadsChart, MentionRateChart } from "./AeoCharts";
import { ENGINE_COLORS } from "./engine-colors";
import PromptResultsTable from "./PromptResultsTable";
import styles from "./aeo.module.css";

export const dynamic = "force-dynamic";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-aeo-display", display: "swap" });

function longDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function AeoPage() {
  await requirePageAuth({ next: "/aeo" });
  const data = await loadAeoReport();

  return (
    <DashboardLayout title="AI Search Visibility" subtitle="How harmonymedspafl.com is found and cited by ChatGPT, Perplexity, Gemini and Google AI Overviews">
      <div className={`${styles.report} ${display.variable}`}>
        <Foundation />
        <Tracking data={data} />
        <Leads data={data} />
        <Programme />
      </div>
    </DashboardLayout>
  );
}

function Foundation() {
  return (
    <section className={styles.band} aria-labelledby="aeo-foundation">
      <p className={styles.eyebrow}>
        <span>Phase 1</span><span>Foundation complete</span><span>Live since {longDate(FOUNDATION_LIVE_SINCE)}</span>
      </p>
      <h2 id="aeo-foundation" className={`${styles.display} ${styles.thesis}`}>
        harmonymedspafl.com can now be <em>read and cited</em> by AI search.
      </h2>

      <div className={styles.plaques}>
        {HEADLINE_METRICS.map((metric) => (
          <article key={metric.id} className={styles.plaque}>
            <p className={styles.plaqueFigure}>
              {metric.before ? (
                <>
                  <span className={`${styles.display} ${styles.plaqueBefore}`}><span className={styles.srOnly}>was </span>{metric.before}</span>
                  <span className={styles.plaqueArrow} aria-hidden="true">→</span>
                </>
              ) : null}
              <span className={`${styles.display} ${styles.plaqueNumber}`}>{metric.value}</span>
            </p>
            <h3 className={styles.plaqueLabel}>{metric.label}</h3>
            <p className={styles.plaqueWhy}>{metric.why}</p>
          </article>
        ))}
      </div>

      <ul className={styles.facts}>
        {SUPPORTING_METRICS.map((metric) => (
          <li key={metric.id} className={styles.fact}>
            <span className={`${styles.display} ${styles.factValue}`}>{metric.value}</span>
            <span className={styles.factLabel}>{metric.label}</span>
            <span className={styles.factWhy}>{metric.why}</span>
          </li>
        ))}
      </ul>

      <div className={styles.scope}>
        <div><h3>What this does</h3><p>{FOUNDATION_SCOPE.does}</p></div>
        <div><h3>What it does not do</h3><p>{FOUNDATION_SCOPE.doesNot}</p></div>
      </div>
    </section>
  );
}

function SectionHead({ id, title, lede, aside }: { id: string; title: string; lede: string; aside?: React.ReactNode }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h2 id={id} className={`${styles.display} ${styles.sectionTitle}`}>{title}</h2>
        <p className={styles.sectionLede}>{lede}</p>
      </div>
      {aside}
    </div>
  );
}

function Tracking({ data }: { data: AeoReportData }) {
  const rows = data.visibility.ok ? data.visibility.data : [];
  const latest = latestCheckDate(rows);
  const stamp = (
    <p className={styles.stamp}>
      <span className={`${styles.stampDot} ${latest ? "" : styles.stampDotIdle}`} aria-hidden="true" />
      Latest check · <strong>{latest ? longDate(latest) : "none yet"}</strong>
    </p>
  );

  return (
    <section className={styles.section} aria-labelledby="aeo-tracking">
      <SectionHead
        id="aeo-tracking"
        title="AI visibility"
        lede="Whether Harmony is named, and linked as a source, when people ask AI assistants about med spas and treatments in Sarasota."
        aside={stamp}
      />

      {!data.visibility.ok ? (
        <div className={styles.card}><p className={styles.errorNote}>AI visibility results could not be loaded. Reload the page to try again.</p></div>
      ) : rows.length === 0 ? (
        <TrackingEmpty data={data} />
      ) : (
        <TrackingResults rows={rows} />
      )}
    </section>
  );
}

function TrackingEmpty({ data }: { data: AeoReportData }) {
  const prompts = data.prompts.ok ? data.prompts.data : null;
  return (
    <div className={`${styles.card} ${styles.empty}`}>
      <div>
        <h3 className={`${styles.display} ${styles.emptyTitle}`}>Tracking begins with the first visibility check.</h3>
        <p className={styles.emptyText}>
          Each check asks the same set of questions on every engine, so results stay comparable over time. The first meaningful trend is expected after 4–6 weeks of checks.
        </p>
      </div>
      <div className={styles.promptSet}>
        {prompts ? (
          <p className={styles.promptTotal}>
            <span className={styles.display}>{prompts.active}</span>
            <span>questions tracked on {ENGINES.length} engines</span>
          </p>
        ) : null}
        <ul className={styles.chips} aria-label="Engines">
          {ENGINES.map((engine) => (
            <li key={engine} className={styles.chip}>
              <span className={styles.swatch} style={{ background: ENGINE_COLORS[engine] }} aria-hidden="true" />{engine}
            </li>
          ))}
        </ul>
        {prompts ? (
          <ul className={styles.chips} aria-label="Question categories">
            {PROMPT_CATEGORIES.map((category) => (
              <li key={category} className={styles.chip}><b>{prompts.byCategory[category]}</b>{category}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function TrackingResults({ rows }: { rows: VisibilityRow[] }) {
  const series = mentionRateSeries(rows);
  const snapshots = engineSnapshots(rows);
  const board = competitorLeaderboard(rows);
  const top = board[0]?.mentions ?? 1;

  return (
    <>
      <div className={styles.gridChart}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Mention rate over time</h3>
          <p className={styles.cardNote}>Share of the questions checked where Harmony was named, per engine.</p>
          <MentionRateChart data={series} />
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Current snapshot</h3>
          <p className={styles.cardNote}>Each engine&apos;s most recent check.</p>
          <div className={styles.snapshots}>
            {snapshots.map((snap) => (
              <div key={snap.engine} className={styles.snapshot} style={{ ["--engine" as string]: ENGINE_COLORS[snap.engine] }}>
                <span className={styles.snapshotEngine}>{snap.engine}</span>
                {snap.checkDate ? (
                  <>
                    <dl className={styles.snapshotStats}>
                      <div><dt>Mentions</dt><dd>{snap.mentions}/{snap.prompts}</dd></div>
                      <div><dt>Cited</dt><dd>{snap.citations}</dd></div>
                      <div><dt>Avg. pos.</dt><dd>{snap.averagePosition ?? "—"}</dd></div>
                    </dl>
                    <span className={styles.snapshotMeta}>{longDate(snap.checkDate)}</span>
                  </>
                ) : (
                  <span className={styles.snapshotMeta}>Not checked yet</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.gridPair}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Competitors named</h3>
          <p className={styles.cardNote}>Clinics AI assistants named most often, across all checks.</p>
          {board.length ? (
            <ol className={styles.board}>
              {board.map((entry) => (
                <li key={entry.name} className={styles.boardRow}>
                  <span className={styles.boardName}>{entry.name}</span>
                  <span className={styles.boardCount}>{entry.mentions} · {entry.engines} {entry.engines === 1 ? "engine" : "engines"}</span>
                  <span className={styles.boardBar} aria-hidden="true"><span style={{ width: `${Math.max(6, (entry.mentions / top) * 100)}%` }} /></span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.quiet}>No competitors named in any check so far.</p>
          )}
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Results by question</h3>
          <p className={styles.cardNote}>Latest result for each question on each engine.</p>
          <PromptResultsTable rows={latestPerPrompt(rows)} />
        </div>
      </div>
    </>
  );
}

function Leads({ data }: { data: AeoReportData }) {
  const attribution = data.attribution.ok ? data.attribution.data : null;
  const caveat = "Some AI tools don't pass on where a visitor came from, so these figures are a lower bound, not a complete count.";

  return (
    <section className={styles.section} aria-labelledby="aeo-leads">
      <SectionHead id="aeo-leads" title="Leads from AI tools" lede="Enquiries that arrived after a visitor clicked through from an AI assistant." />
      {!attribution ? (
        <div className={styles.card}><p className={styles.errorNote}>Lead sources could not be loaded. Reload the page to try again.</p></div>
      ) : (
        <div className={styles.gridPair}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Where leads came from</h3>
            <p className={styles.cardNote}>{attribution.captured} {attribution.captured === 1 ? "lead" : "leads"} with a known source.</p>
            {attribution.captured ? (
              <ul className={styles.classBars}>
                {REFERRER_CLASSES.map((cls) => (
                  <li key={cls} className={styles.boardRow}>
                    <span className={styles.boardName}>{cls}</span>
                    <span className={styles.boardCount}>{attribution.byClass[cls]}</span>
                    <span className={styles.boardBar} aria-hidden="true"><span style={{ width: `${(attribution.byClass[cls] / attribution.captured) * 100}%` }} /></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.quiet}>No lead sources recorded yet.</p>
            )}
            {attribution.notCaptured ? (
              <p className={styles.caveat} style={{ marginTop: "1rem" }}>
                {attribution.notCaptured} earlier {attribution.notCaptured === 1 ? "lead was" : "leads were"} received before lead sources were tracked and {attribution.notCaptured === 1 ? "is" : "are"} not included.
              </p>
            ) : null}
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>AI-referred leads by month</h3>
            <p className={styles.cardNote}>{caveat}</p>
            {attribution.byClass.AI ? (
              <>
                <AiLeadsChart data={attribution.aiByMonth} />
                <ul className={styles.chips} aria-label="AI tools">
                  {attribution.aiSources.map((source) => (
                    <li key={source.source} className={styles.chip}><b>{source.leads}</b>{source.source}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.quiet}>No AI-referred leads recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Programme() {
  const done = WORK_ITEMS.filter((item) => item.done);
  const pending = WORK_ITEMS.filter((item) => !item.done);
  return (
    <section className={styles.section} aria-labelledby="aeo-programme">
      <SectionHead id="aeo-programme" title="Programme status" lede="What is complete and what comes next." />
      <div className={styles.status}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Complete <span className={styles.statusCount}>· {done.length}</span></h3>
          <ul className={styles.statusList}>
            {done.map((item) => (
              <li key={item.label} className={styles.statusItem}>
                <span className={styles.tick} aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                <strong>{item.label}</strong><span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Next <span className={styles.statusCount}>· {pending.length}</span></h3>
          <ul className={styles.statusList}>
            {pending.map((item) => (
              <li key={item.label} className={styles.statusItem}>
                <span className={styles.ring} aria-hidden="true" />
                <strong>{item.label}</strong><span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
