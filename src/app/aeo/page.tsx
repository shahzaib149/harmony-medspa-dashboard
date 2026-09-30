import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { loadAeoReport, type AeoReportData } from "@/lib/aeo/data";
import { FOUNDATION_LIVE_SINCE, FOUNDATION_SCOPE, HEADLINE_METRICS, SUPPORTING_METRICS } from "@/lib/aeo/foundation";
import { WORK_ITEMS, type WorkItem } from "@/lib/aeo/remaining-work";
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

function longDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default async function AeoPage() {
  await requirePageAuth({ next: "/aeo" });
  const data = await loadAeoReport();

  return (
    <DashboardLayout title="AI Search Visibility" subtitle="How harmonymedspafl.com is found and cited by ChatGPT, Perplexity, Gemini and Google AI Overviews">
      <div className={styles.report}>
        <Foundation />
        <Tracking data={data} />
        <Leads data={data} />
        <Programme />
      </div>
    </DashboardLayout>
  );
}

function SectionHead({ id, title, lede, aside }: { id: string; title: string; lede: string; aside?: React.ReactNode }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h2 id={id} className={styles.heading}>{title}</h2>
        <p className={styles.muted}>{lede}</p>
      </div>
      {aside}
    </div>
  );
}

function Foundation() {
  return (
    <section className={styles.section} aria-labelledby="aeo-foundation">
      <SectionHead
        id="aeo-foundation"
        title="harmonymedspafl.com can now be read and cited by AI search."
        lede={`Phase 1 · Foundation complete · Live since ${longDate(FOUNDATION_LIVE_SINCE)}`}
      />
      <div className={styles.card}>
        <div className={styles.figures}>
          {HEADLINE_METRICS.map((metric) => (
            <div key={metric.id} className={styles.figure}>
              <p className={styles.figureValue}>
                {metric.value}
                {metric.before ? <small>from {metric.before}</small> : null}
              </p>
              <hr className={styles.rule} />
              <h3 className={styles.heading}>{sentence(metric.label)}</h3>
              <p className={styles.body}>{metric.why}</p>
            </div>
          ))}
        </div>

        <p className={styles.factsRow}>
          {SUPPORTING_METRICS.map((metric) => (
            <span key={metric.id}><b>{metric.value}</b> {metric.label}</span>
          ))}
        </p>

        <div className={styles.scope}>
          <p><strong>What this does</strong>{FOUNDATION_SCOPE.does}</p>
          <p><strong>What it does not do</strong>{FOUNDATION_SCOPE.doesNot}</p>
        </div>
      </div>
    </section>
  );
}

function Tracking({ data }: { data: AeoReportData }) {
  const rows = data.visibility.ok ? data.visibility.data : [];
  const latest = latestCheckDate(rows);
  const stamp = (
    <p className={styles.stamp}>
      <span className={`${styles.dot} ${latest ? "" : styles.dotIdle}`} aria-hidden="true" />
      Latest check <strong>{latest ? longDate(latest) : "none yet"}</strong>
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
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.heading}>Tracking begins with the first visibility check.</h3>
        <p className={styles.body}>
          Each check asks the same set of questions on every engine, so results stay comparable over time. The first meaningful trend is expected after 4–6 weeks of checks.
        </p>
      </div>
      {prompts ? (
        <p className={styles.factsRow}>
          <span><b>{prompts.active}</b> questions tracked</span>
          {PROMPT_CATEGORIES.map((category) => <span key={category}><b>{prompts.byCategory[category]}</b> {category}</span>)}
          <span>{ENGINES.join(", ")}</span>
        </p>
      ) : null}
    </div>
  );
}

function TrackingResults({ rows }: { rows: VisibilityRow[] }) {
  const series = mentionRateSeries(rows);
  const snapshots = engineSnapshots(rows);
  const board = competitorLeaderboard(rows);
  const latest = latestPerPrompt(rows);
  const top = board[0]?.mentions ?? 1;

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.heading}>Mention rate over time</h3>
          <p className={styles.muted}>Share of the questions checked where Harmony was named, per engine.</p>
        </div>
        <MentionRateChart data={series} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.heading}>Current snapshot</h3>
          <p className={styles.muted}>Each engine&apos;s most recent check.</p>
        </div>
        <div className={styles.snapshots}>
          {snapshots.map((snap) => (
            <div key={snap.engine} className={styles.snapshot}>
              <span className={styles.snapshotName}>
                <span className={styles.swatch} style={{ background: ENGINE_COLORS[snap.engine] }} aria-hidden="true" />
                {snap.engine}
              </span>
              {snap.checkDate ? (
                <>
                  <span><span className={styles.stat}>{snap.mentions}/{snap.prompts}</span> mentioned</span>
                  <span><span className={styles.stat}>{snap.citations}</span> cited</span>
                  <span><span className={styles.stat}>{snap.averagePosition ?? "—"}</span> average position</span>
                  <span className={styles.muted}>{longDate(snap.checkDate)}</span>
                </>
              ) : (
                <span className={styles.muted}>Not checked yet</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <h3 className={styles.heading}>Competitors named</h3>
          <p className={styles.muted}>Clinics AI assistants named most often, across all checks.</p>
        </div>
        {board.length ? (
          <ol className={styles.board}>
            {board.map((entry) => (
              <li key={entry.name} className={styles.boardRow}>
                <span className={styles.boardName}>{entry.name}</span>
                <span className={styles.boardCount}>{entry.mentions} · {entry.engines} {entry.engines === 1 ? "engine" : "engines"}</span>
                <span className={styles.bar} aria-hidden="true"><span style={{ width: `${Math.max(4, (entry.mentions / top) * 100)}%` }} /></span>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.body}>No competitors named in any check so far.</p>
        )}

        <details className={styles.disclosure} style={{ marginTop: "1.75rem" }}>
          <summary>View all results <span className={styles.muted}>· {latest.length} questions and engines</span></summary>
          <div className={styles.disclosureBody}>
            <PromptResultsTable rows={latest} />
          </div>
        </details>
      </div>
    </>
  );
}

function Leads({ data }: { data: AeoReportData }) {
  const attribution = data.attribution.ok ? data.attribution.data : null;
  return (
    <section className={styles.section} aria-labelledby="aeo-leads">
      <SectionHead id="aeo-leads" title="Leads from AI tools" lede="Enquiries that arrived after a visitor clicked through from an AI assistant." />
      {!attribution ? (
        <div className={styles.card}><p className={styles.errorNote}>Lead sources could not be loaded. Reload the page to try again.</p></div>
      ) : (
        <div className={styles.card}>
          <div className={styles.split}>
            <div>
              <div className={styles.cardHead}>
                <h3 className={styles.heading}>Where leads came from</h3>
                <p className={styles.muted}>{attribution.captured} {attribution.captured === 1 ? "lead" : "leads"} with a known source.</p>
              </div>
              {attribution.captured ? (
                <ul className={styles.board}>
                  {REFERRER_CLASSES.map((cls) => (
                    <li key={cls} className={styles.boardRow}>
                      <span className={styles.boardName}>{cls}</span>
                      <span className={styles.boardCount}>{attribution.byClass[cls]}</span>
                      <span className={styles.bar} aria-hidden="true">
                        <span className={cls === "AI" ? styles.barAccent : undefined} style={{ width: `${(attribution.byClass[cls] / attribution.captured) * 100}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.body}>No lead sources recorded yet.</p>
              )}
              {attribution.notCaptured ? (
                <p className={styles.muted} style={{ marginTop: "1.25rem" }}>
                  {attribution.notCaptured} earlier {attribution.notCaptured === 1 ? "lead was" : "leads were"} received before lead sources were tracked and {attribution.notCaptured === 1 ? "is" : "are"} not included.
                </p>
              ) : null}
            </div>
            <div>
              <div className={styles.cardHead}>
                <h3 className={styles.heading}>AI-referred leads by month</h3>
                <p className={styles.muted}>Some AI tools don&apos;t pass on where a visitor came from, so these figures are a lower bound, not a complete count.</p>
              </div>
              {attribution.byClass.AI ? (
                <>
                  <AiLeadsChart data={attribution.aiByMonth} />
                  <ul className={styles.chips} aria-label="AI tools">
                    {attribution.aiSources.map((source) => <li key={source.source}><b>{source.leads}</b> {source.source}</li>)}
                  </ul>
                </>
              ) : (
                <p className={styles.body}>No AI-referred leads recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusList({ items, done }: { items: WorkItem[]; done: boolean }) {
  return (
    <ul className={styles.statusList}>
      {items.map((item) => (
        <li key={item.label} className={styles.statusItem}>
          <span className={`${styles.statusMark} ${done ? styles.statusMarkDone : ""}`} aria-hidden="true" />
          <span className={styles.statusLabel}>{item.label}</span>
          <span className={styles.statusDetail}>{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function Programme() {
  const done = WORK_ITEMS.filter((item) => item.done);
  const pending = WORK_ITEMS.filter((item) => !item.done);
  return (
    <section className={styles.section} aria-labelledby="aeo-programme">
      <SectionHead id="aeo-programme" title="Programme status" lede="What is complete and what comes next." />
      <div className={styles.card}>
        <h3 className={styles.heading}>Next <span className={styles.boardCount}>· {pending.length}</span></h3>
        <StatusList items={pending} done={false} />
        <details className={styles.disclosure} style={{ marginTop: "0.5rem" }}>
          <summary>{done.length} complete</summary>
          <div className={styles.disclosureBody} style={{ paddingTop: "0.5rem" }}>
            <StatusList items={done} done />
          </div>
        </details>
      </div>
    </section>
  );
}
