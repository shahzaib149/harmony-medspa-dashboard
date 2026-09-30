"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ENGINES, PROMPT_CATEGORIES, type VisibilityRow } from "@/lib/aeo/visibility";
import styles from "./aeo.module.css";

type SortKey = "prompt" | "category" | "engine" | "mentioned" | "position" | "cited" | "checkDate";
const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "prompt", label: "Prompt" },
  { key: "category", label: "Category" },
  { key: "engine", label: "Engine" },
  { key: "mentioned", label: "Mentioned" },
  { key: "position", label: "Position" },
  { key: "cited", label: "Cited" },
  { key: "checkDate", label: "Checked" },
];

function compare(a: VisibilityRow, b: VisibilityRow, key: SortKey) {
  if (key === "position") return (a.position ?? Infinity) - (b.position ?? Infinity);
  if (key === "mentioned" || key === "cited") return Number(b[key]) - Number(a[key]);
  return String(a[key]).localeCompare(String(b[key]));
}

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function PromptResultsTable({ rows }: { rows: VisibilityRow[] }) {
  const [engine, setEngine] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "prompt", dir: 1 });

  const visible = useMemo(
    () => rows
      .filter((row) => (engine === "all" || row.engine === engine) && (category === "all" || row.category === category))
      .sort((a, b) => compare(a, b, sort.key) * sort.dir || a.prompt.localeCompare(b.prompt)),
    [rows, engine, category, sort],
  );

  const toggle = (key: SortKey) => setSort((current) => ({ key, dir: current.key === key ? (current.dir === 1 ? -1 : 1) : 1 }));

  return (
    <div>
      <div className={styles.filters}>
        <label>
          Engine
          <select value={engine} onChange={(event) => setEngine(event.target.value)}>
            <option value="all">All engines</option>
            {ENGINES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {PROMPT_CATEGORIES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>Latest result for each prompt on each engine</caption>
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => {
                const active = sort.key === key;
                const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                return (
                  <th key={key} scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                    <button type="button" onClick={() => toggle(key)}>
                      {label} <Icon size={12} aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={`${row.prompt}::${row.engine}`}>
                <td>{row.prompt}</td>
                <td>{row.category || "—"}</td>
                <td>{row.engine}</td>
                <td className={row.mentioned ? styles.yes : styles.no}>{row.mentioned ? "Yes" : "No"}</td>
                <td>{row.position ?? "—"}</td>
                <td className={row.cited ? styles.yes : styles.no}>{row.cited ? "Yes" : "No"}</td>
                <td>{shortDate(row.checkDate)}</td>
              </tr>
            ))}
            {!visible.length ? (
              <tr><td colSpan={COLUMNS.length}>No results match these filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
