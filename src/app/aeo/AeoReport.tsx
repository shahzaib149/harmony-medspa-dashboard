"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDot,
  Compass,
  FileCheck2,
  Globe2,
  Link2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Waypoints,
} from "lucide-react";
import type { AeoReportData } from "@/lib/aeo/data";
import {
  HEADLINE_METRICS,
  SUPPORTING_METRICS,
  FOUNDATION_LIVE_SINCE,
} from "@/lib/aeo/foundation";
import { WORK_ITEMS } from "@/lib/aeo/remaining-work";
import {
  competitorLeaderboard,
  engineSnapshots,
  ENGINES,
  latestCheckDate,
  latestPerPrompt,
  mentionRateSeries,
  PROMPT_CATEGORIES,
} from "@/lib/aeo/visibility";
import { REFERRER_CLASSES } from "@/lib/aeo/referrer-classification";
import { AiLeadsChart, MentionRateChart, SourceDonut } from "./AeoCharts";
import { ENGINE_COLORS } from "./engine-colors";
import PromptResultsTable from "./PromptResultsTable";
import s from "./aeo.module.css";

const dateLabel = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const engineLabel = (name: string) =>
  name === "Google AI Overview" ? "Google AI" : name;
const reportTabs = ["Overview", "Visibility", "Roadmap"] as const;
const engineNotes = [
  "Conversational discovery",
  "Answers with sources",
  "Google's AI assistant",
  "AI-powered search results",
];
const sourceColors = [
  "var(--brand-primary)",
  "var(--success)",
  "var(--info)",
  "var(--chart-5)",
  "var(--chart-6)",
];

function EngineMark({
  engine,
  small = false,
}: {
  engine: string;
  small?: boolean;
}) {
  const index = ENGINES.indexOf(engine as (typeof ENGINES)[number]);
  const Icon = [MessageCircle, Waypoints, Sparkles, Search][index] ?? Globe2;
  return (
    <span
      className={`${s.engineMark} ${small ? s.engineMarkSmall : ""}`}
      style={{ color: ENGINE_COLORS[engine as (typeof ENGINES)[number]] }}
    >
      <Icon size={small ? 15 : 21} strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

function EmptyPlot({
  title,
  detail,
  bars = false,
  unavailable = false,
}: {
  title: string;
  detail: string;
  bars?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className={`${s.emptyPlot} ${bars ? s.emptyPlotSmall : ""}`}>
      <div className={s.plotScale} aria-hidden="true">
        {(bars ? ["", "", ""] : ["100%", "75%", "50%", "25%", "0%"]).map(
          (v, i) => (
            <span key={i}>{v}</span>
          ),
        )}
      </div>
      <div className={s.plotGrid} aria-hidden="true" />
      <div className={s.emptyMessage}>
        <span className={s.emptyIcon}>
          {bars ? <Users size={22} /> : <Waypoints size={24} />}
        </span>
        <strong>{title}</strong>
        <p>{detail}</p>
        <span className={s.pill}>
          {unavailable ? "Temporarily unavailable" : "Awaiting baseline"}
        </span>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  detail,
  icon: Icon,
}: {
  title: string;
  detail: string;
  icon: typeof Globe2;
}) {
  return (
    <div className={s.sectionTitle}>
      <span className={s.sectionIcon}>
        <Icon size={19} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}

export default function AeoReport({ data }: { data: AeoReportData }) {
  const [tab, setTab] = useState("Overview");
  const [selectedEngine, setSelectedEngine] = useState("All engines");
  const rows = data.visibility.ok ? data.visibility.data : [];
  const latest = latestCheckDate(rows);
  const snapshots = engineSnapshots(rows);
  const filtered =
    selectedEngine === "All engines"
      ? rows
      : rows.filter((r) => r.engine === selectedEngine);
  const series = mentionRateSeries(filtered);
  const board = competitorLeaderboard(filtered, 5);
  const results = latestPerPrompt(rows);
  const prompts = data.prompts.ok ? data.prompts.data : null;
  const attribution = data.attribution.ok ? data.attribution.data : null;
  const snapshotRows = snapshots.filter((x) => x.checkDate);
  const totalChecked = snapshotRows.reduce((a, x) => a + x.prompts, 0);
  const totalMentions = snapshotRows.reduce((a, x) => a + x.mentions, 0);
  const totalCitations = snapshotRows.reduce((a, x) => a + x.citations, 0);
  const done = WORK_ITEMS.filter((x) => x.done);
  const pending = WORK_ITEMS.filter((x) => !x.done);
  const percent = Math.round((done.length / WORK_ITEMS.length) * 100);
  const visibilityValue = totalChecked
    ? `${Math.round((totalMentions / totalChecked) * 100)}%`
    : "—";

  function exportReport() {
    const columns = [
      "Check date",
      "Question",
      "Category",
      "Engine",
      "Mentioned",
      "Position",
      "Cited",
      "Competitors",
    ];
    const escape = (v: unknown) => {
      const value = String(v ?? "");
      return `"${(/^[=+@\-]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
    };
    const csv = [
      columns,
      ...rows.map((r) => [
        r.checkDate,
        r.prompt,
        r.category,
        r.engine,
        r.mentioned,
        r.position,
        r.cited,
        r.competitors.join("; "),
      ]),
    ]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `harmony-ai-search-${latest ?? "results"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={s.report}>
      <div className={s.topline}>
        <span>
          <span className={s.liveDot} />
          harmonymedspafl.com <span className={s.separator}>/</span> Sarasota,
          Florida
        </span>
        <a href="https://harmonymedspafl.com" target="_blank" rel="noreferrer">
          View website <ArrowUpRight size={14} />
        </a>
      </div>
      <section className={s.hero} aria-labelledby="report-title">
        <div className={s.heroCopy}>
          <span className={s.eyebrow}>
            <Sparkles size={15} /> Answer & generative engine optimization
          </span>
          <h1 id="report-title">
            A new way to search.
            <br />
            <span>A stronger presence for Harmony.</span>
          </h1>
          <p>
            Track how AI assistants discover your clinic, mention your
            treatments, and connect people to Harmony.
          </p>
          <div className={s.heroFooter}>
            <span className={s.successPill}>
              <ShieldCheck size={14} /> Foundation complete
            </span>
            <span>Launched {dateLabel(FOUNDATION_LIVE_SINCE)}</span>
          </div>
        </div>
        <div
          className={s.network}
          aria-label="Harmony's visibility is monitored across four AI search engines"
        >
          <svg
            className={s.networkLines}
            viewBox="0 0 380 235"
            aria-hidden="true"
          >
            <ellipse cx="190" cy="118" rx="145" ry="86" />
            <ellipse cx="190" cy="118" rx="97" ry="58" />
            <path d="M190 118 L62 49 M190 118 L318 49 M190 118 L62 188 M190 118 L318 188" />
          </svg>
          <div className={s.networkCenter}>
            <Globe2 size={25} />
            <strong>Harmony</strong>
            <span>AI search presence</span>
          </div>
          {ENGINES.map((e, i) => (
            <div key={e} className={`${s.networkNode} ${s[`node${i}`]}`}>
              <EngineMark engine={e} small />
              <span>{engineLabel(e)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className={s.toolbar}>
        <div className={s.tabs} role="tablist" aria-label="Report sections">
          {reportTabs.map((t, index) => (
            <button
              key={t}
              role="tab"
              id={`tab-${t}`}
              aria-controls="report-panel"
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? reportTabs.length - 1
                      : (index +
                          (event.key === "ArrowRight" ? 1 : -1) +
                          reportTabs.length) %
                        reportTabs.length;
                setTab(reportTabs[next]);
                document.getElementById(`tab-${reportTabs[next]}`)?.focus();
              }}
              onClick={() => setTab(t)}
              className={tab === t ? s.tabActive : ""}
            >
              {t}
            </button>
          ))}
        </div>
        <div className={s.toolbarActions}>
          <span className={s.lastCheck}>
            <CircleDot size={13} />
            {!data.visibility.ok
              ? "Results unavailable"
              : latest
                ? `Checked ${dateLabel(latest)}`
                : "First check pending"}
          </span>
          <button
            className={s.export}
            onClick={exportReport}
            disabled={!rows.length}
          >
            <ArrowDownToLine size={14} /> Export results
          </button>
        </div>
      </div>

      <div id="report-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab !== "Roadmap" && (
          <>
            <div className={s.metrics}>
              {[
                {
                  label: "AI mention rate",
                  value: visibilityValue,
                  detail: !data.visibility.ok
                    ? "Visibility results unavailable"
                    : totalChecked
                      ? `${totalMentions} mentions in ${totalChecked} checks`
                      : "Available after the first check",
                  icon: MessageCircle,
                  tone: "teal",
                },
                {
                  label: "Source citations",
                  value: totalChecked ? String(totalCitations) : "—",
                  detail: totalChecked
                    ? "Across each engine's latest check"
                    : "Links to Harmony in AI answers",
                  icon: Link2,
                  tone: "blue",
                },
                {
                  label: "AI-referred leads",
                  value: attribution ? String(attribution.byClass.AI) : "—",
                  detail: !attribution
                    ? "Lead attribution unavailable"
                    : attribution.captured
                      ? "From identifiable AI referrals"
                      : "No attributed AI enquiries yet",
                  icon: Users,
                  tone: "gold",
                },
                {
                  label: "Questions monitored",
                  value: prompts ? String(prompts.active) : "—",
                  detail: `Across ${ENGINES.length} AI search engines`,
                  icon: Target,
                  tone: "purple",
                },
              ].map((m) => (
                <article className={s.metric} key={m.label}>
                  <div className={s.metricTop}>
                    <span>{m.label}</span>
                    <span className={`${s.metricIcon} ${s[m.tone]}`}>
                      <m.icon size={18} />
                    </span>
                  </div>
                  <strong>{m.value}</strong>
                  <p>{m.detail}</p>
                </article>
              ))}
            </div>
            <section className={s.section} aria-labelledby="visibility-heading">
              <SectionTitle
                title="Your visibility, across AI search"
                detail="From a patient's question to your clinic's next opportunity."
                icon={Waypoints}
              />
              <div className={s.analyticsGrid}>
                <article className={s.card}>
                  <div className={s.cardHead}>
                    <div>
                      <h3 id="visibility-heading">Mention rate over time</h3>
                      <p>Share of checked questions that name Harmony.</p>
                    </div>
                    <select
                      aria-label="Filter visibility chart by engine"
                      value={selectedEngine}
                      onChange={(e) => setSelectedEngine(e.target.value)}
                    >
                      <option>All engines</option>
                      {ENGINES.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  {!data.visibility.ok ? (
                    <div className={s.errorNote}>
                      Visibility results are unavailable. Reload to try again.
                    </div>
                  ) : series.length ? (
                    <MentionRateChart data={series} />
                  ) : (
                    <EmptyPlot
                      title="Your visibility story starts here"
                      detail="The first check establishes your baseline. Future checks show how your presence changes."
                    />
                  )}
                  <div className={s.legend}>
                    {ENGINES.filter(
                      (e) =>
                        selectedEngine === "All engines" ||
                        selectedEngine === e,
                    ).map((e) => (
                      <span key={e}>
                        <i style={{ background: ENGINE_COLORS[e] }} />
                        {engineLabel(e)}
                      </span>
                    ))}
                  </div>
                </article>
                <article className={`${s.card} ${s.coverageCard}`}>
                  <div className={s.cardHead}>
                    <div>
                      <h3>Question coverage</h3>
                      <p>What patients are asking about.</p>
                    </div>
                    <Compass size={19} className={s.muted} />
                  </div>
                  <div
                    className={s.coverageRing}
                    style={{
                      background: prompts?.active
                        ? `conic-gradient(${PROMPT_CATEGORIES.map((c, i) => {
                            const start =
                              (PROMPT_CATEGORIES.slice(0, i).reduce(
                                (a, k) => a + prompts.byCategory[k],
                                0,
                              ) /
                                prompts.active) *
                              100;
                            const end =
                              start +
                              (prompts.byCategory[c] / prompts.active) * 100;
                            return `${sourceColors[i]} ${start}% ${end}%`;
                          }).join(",")})`
                        : "var(--border-subtle)",
                    }}
                    role="img"
                    aria-label={`${prompts?.active ?? "Unknown number of"} active questions by category`}
                  >
                    <div>
                      <strong>{prompts?.active ?? "—"}</strong>
                      <span>active questions</span>
                    </div>
                  </div>
                  <div className={s.categoryList}>
                    {PROMPT_CATEGORIES.map((c, i) => (
                      <div key={c}>
                        <span>
                          <i style={{ background: sourceColors[i] }} />
                          {c}
                        </span>
                        <strong>{prompts ? prompts.byCategory[c] : "—"}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
              <div className={s.engineGrid}>
                {snapshots.map((snap, i) => (
                  <article className={s.engineCard} key={snap.engine}>
                    <div className={s.engineTop}>
                      <EngineMark engine={snap.engine} />
                      <span
                        className={
                          snap.checkDate ? s.engineChecked : s.engineWaiting
                        }
                      >
                        {!data.visibility.ok
                          ? "Unavailable"
                          : snap.checkDate
                            ? "Checked"
                            : "Awaiting check"}
                      </span>
                    </div>
                    <h3>{engineLabel(snap.engine)}</h3>
                    <p>{engineNotes[i]}</p>
                    <div className={s.engineValue}>
                      <strong>
                        {snap.checkDate
                          ? `${Math.round((snap.mentions / snap.prompts) * 100)}%`
                          : "—"}
                      </strong>
                      <span>mention rate</span>
                    </div>
                    <div className={s.engineBottom}>
                      <span>
                        <b>{snap.checkDate ? snap.citations : "—"}</b> citations
                      </span>
                      <span>
                        <b>{snap.averagePosition ?? "—"}</b> avg. position
                      </span>
                    </div>
                    {snap.checkDate && (
                      <small className={s.engineDate}>
                        {dateLabel(snap.checkDate)} · {snap.prompts} questions
                        checked
                      </small>
                    )}
                  </article>
                ))}
              </div>
              <article className={s.card}>
                <div className={s.cardHead}>
                  <div>
                    <h3>Local competitive landscape</h3>
                    <p>
                      Other clinics named in recorded answers, across all check
                      dates
                      {selectedEngine !== "All engines"
                        ? ` on ${selectedEngine}`
                        : ""}
                      .
                    </p>
                  </div>
                  <span className={s.pill}>Sarasota & surrounding areas</span>
                </div>
                {board.length ? (
                  <ol className={s.competitors}>
                    {board.map((b, i) => (
                      <li key={b.name}>
                        <span className={s.rank}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={s.competitorName}>
                          {b.name}
                          <small>
                            {b.engines} {b.engines === 1 ? "engine" : "engines"}
                          </small>
                        </span>
                        <span className={s.bar}>
                          <i
                            style={{
                              width: `${(b.mentions / board[0].mentions) * 100}%`,
                            }}
                          />
                        </span>
                        <b>
                          {b.mentions}
                          <small>mentions</small>
                        </b>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className={s.competitorEmpty}>
                    <span className={s.emptyIcon}>
                      <Search size={20} />
                    </span>
                    <div>
                      <strong>
                        {data.visibility.ok
                          ? "The local picture is taking shape"
                          : "Competitive results unavailable"}
                      </strong>
                      <p>
                        {data.visibility.ok
                          ? "Competitor rankings appear once AI search answers have been recorded."
                          : "Reload the page to try again."}
                      </p>
                    </div>
                    <span className={s.pill}>No recorded rankings</span>
                  </div>
                )}
                {results.length > 0 && (
                  <details className={s.disclosure}>
                    <summary>
                      Explore question-by-question results{" "}
                      <span>
                        {results.length} results <ChevronRight size={14} />
                      </span>
                    </summary>
                    <div className={s.disclosureBody}>
                      <PromptResultsTable rows={results} />
                    </div>
                  </details>
                )}
              </article>
            </section>
          </>
        )}

        {tab === "Overview" && (
          <section className={s.section}>
            <SectionTitle
              title="From discovery to enquiries"
              detail="See which sources bring people to Harmony."
              icon={Users}
            />
            <div className={s.leadsGrid}>
              <article className={s.card}>
                <div className={s.cardHead}>
                  <div>
                    <h3>Lead source mix</h3>
                    <p>
                      {attribution
                        ? `${attribution.captured} enquiries with a recorded source`
                        : "Lead sources unavailable"}
                    </p>
                  </div>
                  <Link2 size={18} className={s.muted} />
                </div>
                {attribution ? (
                  <>
                    <div className={s.sourceLayout}>
                      <SourceDonut
                        data={REFERRER_CLASSES.map((name, i) => ({
                          name,
                          value: attribution.byClass[name],
                          color: sourceColors[i],
                        }))}
                        total={attribution.captured}
                      />
                      <div className={s.sourceList}>
                        {REFERRER_CLASSES.map((c, i) => (
                          <div key={c}>
                            <span>
                              <i style={{ background: sourceColors[i] }} />
                              {c === "AI" ? "AI assistants" : c}
                            </span>
                            <b>{attribution.byClass[c]}</b>
                          </div>
                        ))}
                      </div>
                    </div>
                    {attribution.notCaptured > 0 && (
                      <p className={s.footnote}>
                        {attribution.notCaptured} enquiries have no recorded
                        source and are excluded.
                      </p>
                    )}
                  </>
                ) : (
                  <p className={s.errorNote}>
                    Lead sources could not be loaded. Reload to try again.
                  </p>
                )}
              </article>
              <article className={s.card}>
                <div className={s.cardHead}>
                  <div>
                    <h3>AI-referred enquiries</h3>
                    <p>Recorded enquiries from identifiable AI referrals.</p>
                  </div>
                  <span className={s.totalBadge}>
                    {attribution ? attribution.byClass.AI : "—"}
                    <small>total</small>
                  </span>
                </div>
                {attribution?.aiByMonth.length ? (
                  <AiLeadsChart data={attribution.aiByMonth} />
                ) : (
                  <EmptyPlot
                    bars
                    unavailable={!attribution}
                    title={
                      attribution
                        ? "No AI referrals recorded yet"
                        : "Referral results unavailable"
                    }
                    detail={
                      attribution
                        ? "Monthly activity appears as enquiries arrive with an identifiable AI source."
                        : "Reload the page to try again."
                    }
                  />
                )}
                <p className={s.footnote}>
                  Some AI tools omit referral information. Recorded enquiries
                  may undercount actual AI referrals.
                </p>
                {attribution && attribution.aiSources.length > 0 && (
                  <div className={s.legend}>
                    {attribution.aiSources.map((x) => (
                      <span key={x.source}>
                        {x.source} · {x.leads}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </section>
        )}

        {tab !== "Visibility" && (
          <>
            <section className={s.section}>
              <SectionTitle
                title="Built to be discovered"
                detail="The website foundation behind your AI search presence."
                icon={ShieldCheck}
              />
              <div className={s.foundationGrid}>
                <article className={`${s.card} ${s.foundationCard}`}>
                  <div className={s.foundationTop}>
                    <span className={s.successPill}>
                      <CheckCheck size={14} /> Technical foundation delivered
                    </span>
                    <span className={s.muted}>
                      {dateLabel(FOUNDATION_LIVE_SINCE)}
                    </span>
                  </div>
                  <div className={s.foundationNumbers}>
                    <div>
                      <strong>
                        {HEADLINE_METRICS[0].value}
                        <span>
                          <ArrowUpRight size={20} /> from{" "}
                          {HEADLINE_METRICS[0].before}
                        </span>
                      </strong>
                      <h3>Pages in the launch sitemap</h3>
                      <p>
                        Treatment, provider and article pages made discoverable.
                      </p>
                    </div>
                    <div>
                      <strong>
                        {HEADLINE_METRICS[1].value}
                        <FileCheck2 size={24} />
                      </strong>
                      <h3>Page identities corrected</h3>
                      <p>
                        Each page points to its own address instead of the
                        homepage.
                      </p>
                    </div>
                  </div>
                  <div className={s.foundationFacts}>
                    {SUPPORTING_METRICS.map((m) => (
                      <div key={m.id} title={m.why}>
                        <b>{m.value}</b>
                        <span>{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className={s.footnote}>
                    Foundation figures reflect the launch audit, not
                    today&apos;s index or sitemap size. Technical readiness
                    supports discovery; recommendations depend on content,
                    relevance and reputation.
                  </p>
                </article>
                <article className={`${s.card} ${s.progressCard}`}>
                  <h3>Program progress</h3>
                  <p className={s.muted}>Completed implementation milestones</p>
                  <div
                    className={s.progressRing}
                    style={{
                      background: `conic-gradient(var(--success) ${percent}%, var(--surface-hover) 0)`,
                    }}
                    role="img"
                    aria-label={`${done.length} of ${WORK_ITEMS.length} program milestones complete`}
                  >
                    <div>
                      <strong>
                        {done.length}
                        <span>/{WORK_ITEMS.length}</span>
                      </strong>
                      <small>milestones complete</small>
                    </div>
                  </div>
                  <div className={s.progressStats}>
                    <span>
                      <i className={s.liveDot} />
                      {done.length} complete
                    </span>
                    <span>
                      <i className={s.pendingDot} />
                      {pending.length} upcoming
                    </span>
                  </div>
                  <p className={s.footnote}>
                    Implementation progress, separate from search performance.
                  </p>
                </article>
              </div>
            </section>
            <section className={s.section}>
              <SectionTitle
                title="The next steps for Harmony"
                detail="A clear path from technical readiness to stronger visibility."
                icon={Compass}
              />
              <div className={s.roadmapGrid}>
                {[
                  {
                    title: "Search & local presence",
                    icon: Globe2,
                    items: pending.filter((item) =>
                      [
                        "Google Search Console",
                        "Bing Webmaster Tools",
                        "Google Business Profile",
                      ].includes(item.label),
                    ),
                    caption: "Help people find the clinic",
                  },
                  {
                    title: "Trust & patient confidence",
                    icon: ShieldCheck,
                    items: pending.filter((item) =>
                      [
                        "Review requests",
                        "Provider review of medical FAQs",
                      ].includes(item.label),
                    ),
                    caption: "Build confidence in your expertise",
                  },
                  {
                    title: "Treatment content",
                    icon: FileCheck2,
                    items: pending.filter((item) =>
                      ["Answer-first content", "Page descriptions"].includes(
                        item.label,
                      ),
                    ),
                    caption: "Answer the questions that matter",
                  },
                ].map((group) => (
                  <article
                    className={`${s.card} ${s.roadmapCard}`}
                    key={group.title}
                  >
                    <span className={s.roadmapIcon}>
                      <group.icon size={21} />
                    </span>
                    <h3>{group.title}</h3>
                    <p>{group.caption}</p>
                    <ul>
                      {!group.items.length && (
                        <li>
                          <Check size={14} />
                          <span>All milestones complete</span>
                        </li>
                      )}
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <span className={s.pendingDot} />
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <details className={`${s.card} ${s.completed}`}>
                <summary>
                  <span>
                    <span className={s.checkIcon}>
                      <Check size={15} />
                    </span>
                    {done.length} completed milestones
                  </span>
                  <ChevronRight size={17} />
                </summary>
                <div className={s.completedGrid}>
                  {done.map((item) => (
                    <div key={item.label}>
                      <Check size={15} />
                      <span>
                        <strong>{item.label}</strong>
                        <p>{item.detail}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          </>
        )}
      </div>
      <footer className={s.reportFooter}>
        <span>
          <Sparkles size={14} /> Harmony AI Search intelligence
        </span>
        <span>Measured visibility. Meaningful patient growth.</span>
      </footer>
    </div>
  );
}
