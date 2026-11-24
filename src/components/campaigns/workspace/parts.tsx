"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, X } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { PAGE_SIZES, initials } from "@/lib/campaigns/paginate";
import s from "./workspace.module.css";

export { s as workspace };

/* ---------- Hero ---------- */

export type HeroMeta = { label: string; value: ReactNode; hint?: ReactNode };

export function WorkspaceHero({ icon, eyebrow, title, status, description, pills, meta, actions }: {
  icon: ReactNode; eyebrow: string; title: string; status: string; description: string;
  pills: ReactNode[]; meta?: HeroMeta[]; actions?: ReactNode;
}) {
  return (
    <header className={s.hero}>
      <div className={s.heroOrb} aria-hidden="true" />
      <div className={s.heroGrid}>
        <div className={s.heroMain}>
          <span className={s.heroIcon}>{icon}</span>
          <div className="min-w-0">
            <p className={s.eyebrow}>{eyebrow}</p>
            <div className={s.heroTitleRow}>
              <h1 className={s.heroTitle}>{title}</h1>
              <CampaignStatusBadge status={status} />
            </div>
            <p className={s.heroText}>{description}</p>
            <div className={s.pills}>{pills.map((pill, i) => <span key={i} className={s.pill}>{pill}</span>)}</div>
          </div>
        </div>
        <div className={s.heroSide}>
          {actions ? <div className={s.heroActions}>{actions}</div> : null}
          {meta?.length ? (
            <dl className={s.heroMeta}>
              {meta.map((item) => (
                <div key={item.label}>
                  <dt className={s.metaLabel}>{item.label}</dt>
                  <dd className={s.metaValue}>{item.value}</dd>
                  {item.hint ? <dd className={s.metaHint}>{item.hint}</dd> : null}
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* ---------- Tabs ---------- */

export function WorkspaceTabs<T extends string>({ tabs, active, onChange, label }: {
  tabs: { key: T; label: string; count?: number }[]; active: T; onChange: (key: T) => void; label: string;
}) {
  return (
    <nav className={s.tabs} aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.key} type="button" aria-current={active === tab.key ? "page" : undefined}
          className={`${s.tab} ${active === tab.key ? s.tabActive : ""}`} onClick={() => onChange(tab.key)}>
          {tab.label}
          {typeof tab.count === "number" ? <span className={s.tabCount}>{tab.count.toLocaleString()}</span> : null}
        </button>
      ))}
    </nav>
  );
}

/* ---------- Row menu (portal; a bottom sheet on phones) ---------- */

type MenuPos = { top?: number; bottom?: number; right?: number; left?: number; sheet?: boolean };

export function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [pos, setPos] = useState<MenuPos | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pos) return;
    const onPointer = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setPos(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setPos(null); button.current?.focus(); } };
    const close = () => setPos(null);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menu.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (pos) { setPos(null); return; }
    if (window.innerWidth < 640) { setPos({ left: 12, right: 12, bottom: 12, sheet: true }); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    setPos(window.innerHeight - r.bottom < 180 ? { bottom: window.innerHeight - r.top + 6, right } : { top: r.bottom + 6, right });
  };
  return (
    <>
      <button ref={button} type="button" className={s.iconButton} aria-label={label} aria-haspopup="menu" aria-expanded={Boolean(pos)} onClick={toggle}>
        <MoreHorizontal size={17} />
      </button>
      {pos && createPortal(
        <>
          {pos.sheet ? <div className={s.sheetBackdrop} aria-hidden="true" /> : null}
          <div ref={menu} role="menu" className={`${s.rowMenu} ${pos.sheet ? s.rowMenuSheet : ""}`}
            style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right }} onClick={(e) => e.stopPropagation()}>
            {children(() => setPos(null))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

/* ---------- Toolbar pieces ---------- */

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className={s.search}>
      <Search size={15} aria-hidden="true" />
      <span className={s.srOnly}>{placeholder}</span>
      <input className={s.input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <select aria-label={label} className={s.select} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ClearFilters({ onClear }: { onClear: () => void }) {
  return <button type="button" className={s.clear} onClick={onClear}><X size={12} /> Clear filters</button>;
}

/* ---------- Pagination ---------- */

export function TablePagination({ from, to, total, page, pages, pageSize, noun, onPage, onPageSize }: {
  from: number; to: number; total: number; page: number; pages: number; pageSize: number; noun: string;
  onPage: (page: number) => void; onPageSize: (size: number) => void;
}) {
  return (
    <nav className={s.pager} aria-label={`${noun} pages`}>
      <span aria-live="polite">{total ? `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()} ${noun}` : `No ${noun}`}</span>
      <div className={s.pagerControls}>
        <label className="inline-flex items-center gap-2">
          Rows
          <select className={s.pagerSelect} value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <button type="button" className={s.pageButton} disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={14} /> Previous</button>
        <span className={s.pageNow}>Page {page} of {pages}</span>
        <button type="button" className={s.pageButton} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={14} /></button>
      </div>
    </nav>
  );
}

/* ---------- Small pieces ---------- */

export function Avatar({ name }: { name: string }) {
  return <span className={s.avatar} aria-hidden="true">{initials(name)}</span>;
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>{icon}</span>
      <p className={s.emptyTitle}>{title}</p>
      <p className={s.emptyText}>{text}</p>
    </div>
  );
}

export function Tag({ tone = "muted", children }: { tone?: "gold" | "muted" | "success" | "warning" | "danger" | "info"; children: ReactNode }) {
  const cls = { gold: s.tagGold, muted: s.tagMuted, success: s.tagSuccess, warning: s.tagWarning, danger: s.tagDanger, info: s.tagInfo }[tone];
  return <span className={`${s.tag} ${cls}`}>{children}</span>;
}

/* ---------- Journey rail ---------- */

export type RailStep = {
  key: string; label: string; when: string; figure: ReactNode; total?: string;
  progress?: number; state: { label: string; tone: "gold" | "muted" | "success" | "warning" | "danger" | "info" };
  node: "done" | "live" | "todo"; footLeft?: ReactNode; footRight?: ReactNode; current?: boolean;
};

export function JourneyRail({ steps }: { steps: RailStep[] }) {
  return (
    <ol className={s.rail} style={{ "--steps": steps.length } as CSSProperties}>
      {steps.map((step, i) => (
        <li key={step.key} className={`${s.railStep} ${step.current ? s.railStepCurrent : ""}`} aria-current={step.current ? "step" : undefined}>
          <div className={s.railTop}>
            <div className="flex min-w-0 items-start gap-3">
              <span className={`${s.railNode} ${step.node === "done" ? s.railNodeDone : step.node === "live" ? s.railNodeLive : ""}`}>{i + 1}</span>
              <div className="min-w-0">
                <p className={s.railLabel}>{step.label}</p>
                <p className={s.railWhen}>{step.when}</p>
              </div>
            </div>
            <Tag tone={step.state.tone}>{step.state.label}</Tag>
          </div>
          <p className={s.railFigure}>{step.figure}{step.total ? <small>{step.total}</small> : null}</p>
          {typeof step.progress === "number" ? (
            <div className={s.track} role="progressbar" aria-label={`${step.label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(step.progress)}>
              <div className={s.trackFill} style={{ width: `${Math.min(100, Math.max(step.progress > 0 ? 2 : 0, step.progress))}%` }} />
            </div>
          ) : null}
          {step.footLeft || step.footRight ? <div className={s.railFoot}><span>{step.footLeft}</span><span>{step.footRight}</span></div> : null}
        </li>
      ))}
    </ol>
  );
}

export function SplitBar({ label, left, right }: { label: string; left: { label: string; value: number }; right: { label: string; value: number } }) {
  const total = Math.max(1, left.value + right.value);
  return (
    <div className={s.split}>
      <p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p>
      <div className={s.splitBar} role="img" aria-label={`${left.label} ${left.value}, ${right.label} ${right.value}`}>
        <span style={{ width: `${(left.value / total) * 100}%` }} />
        <span style={{ width: `${(right.value / total) * 100}%` }} />
      </div>
      <div className={s.splitLegend}>
        <span>{left.label} <b>{left.value.toLocaleString()}</b></span>
        <span>{right.label} <b>{right.value.toLocaleString()}</b></span>
      </div>
    </div>
  );
}
