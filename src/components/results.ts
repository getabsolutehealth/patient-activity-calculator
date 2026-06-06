/**
 * Results — revealed after Run. Net Momentum is the oversized hero stat (the
 * "growing or bleeding" signal); Active / Inactive / Churn / New form the
 * supporting row. Three parameterized export panels list patients (capped at
 * VISIBLE_CAP rows on screen; the CSV always holds everyone) with warm zero
 * states. aria-live announces the reveal to screen readers.
 */

import { type Patient, type Stats, formatName, toCSV } from "../calc";
import { el } from "../dom";
import { type Action, type AppState } from "../state";

import "./results.css";

const VISIBLE_CAP = 100;

interface PanelSpec {
  title: string;
  tone: "pos" | "neg" | "info";
  rows: Patient[];
  filePrefix: string;
  /** Shown when rows is empty — a warm, specific line. */
  emptyLine: string;
}

function downloadCsv(rows: Patient[], prefix: string): void {
  const stamp = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\//g, "-");
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `${prefix}_${stamp}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
}

function statCard(value: string, label: string, sub: string, tone: string): HTMLElement {
  return el(
    "div",
    { class: "stat-card" },
    el("div", { class: `stat-card__value mono ${tone}` }, value),
    el("div", { class: "stat-card__label" }, label),
    el("div", { class: "stat-card__sub" }, sub),
  );
}

function panel(spec: PanelSpec): HTMLElement {
  const shown = spec.rows.slice(0, VISIBLE_CAP);
  const list =
    spec.rows.length === 0
      ? el("div", { class: "panel__empty" }, spec.emptyLine)
      : el(
          "ol",
          { class: "panel__list" },
          ...shown.map((p, i) =>
            el(
              "li",
              { class: "panel__item" },
              el("span", { class: "panel__idx mono" }, String(i + 1)),
              `${formatName(p.last)}, ${formatName(p.first)}`,
            ),
          ),
        );

  const footerNote =
    spec.rows.length > VISIBLE_CAP
      ? el(
          "div",
          { class: "panel__note" },
          "showing ",
          el("span", { class: "mono" }, String(VISIBLE_CAP)),
          " of ",
          el("span", { class: "mono" }, String(spec.rows.length)),
          " — download CSV for all",
        )
      : null;

  const dlBtn = el(
    "button",
    { class: `panel__dl ${spec.tone}`, type: "button", disabled: spec.rows.length === 0 },
    `↓ ${spec.title} CSV`,
  ) as HTMLButtonElement;
  dlBtn.addEventListener("click", () => downloadCsv(spec.rows, spec.filePrefix));

  return el(
    "div",
    { class: "panel" },
    el(
      "div",
      { class: "panel__head" },
      el("span", { class: "panel__title" }, spec.title),
      el("span", { class: "panel__count mono" }, String(spec.rows.length)),
    ),
    list,
    footerNote,
    el("div", { class: "panel__foot" }, dlBtn),
  );
}

function render(stats: Stats, dispatch: (a: Action) => void): HTMLElement {
  const momentumStr = stats.momentum > 0 ? `+${stats.momentum}` : String(stats.momentum);
  const momentumTone = stats.momentum > 0 ? "pos" : stats.momentum < 0 ? "neg" : "warn";
  const churnStr = stats.churnPct === null ? "—" : `${stats.churnPct.toFixed(1)}%`;

  const hero = el(
    "div",
    { class: "results__hero" },
    el(
      "div",
      { class: `results__hero-value mono ${momentumTone}`, "aria-hidden": "true" },
      momentumStr,
    ),
    el("div", { class: "results__hero-label" }, "Net Momentum"),
    el("div", { class: "results__hero-sub" }, "New conversions − inactives"),
    el("span", { class: "visually-hidden" }, `Net momentum: ${momentumStr}`),
  );

  const supporting = el(
    "div",
    { class: "stat-row" },
    statCard(stats.activeCount.toLocaleString(), "Active Patients", "Seen this month", "pos"),
    statCard(stats.inactiveCount.toLocaleString(), "Inactive", "Not seen this month", "neg"),
    statCard(churnStr, "Churn Rate", "Inactive ÷ prior", "warn"),
    statCard(stats.newCount.toLocaleString(), "New Conversions", "New this month", "info"),
  );

  const panels = el(
    "div",
    { class: "panel-row" },
    panel({
      title: "Active",
      tone: "pos",
      rows: stats.active,
      filePrefix: "active_patients",
      emptyLine: "No active patients this month.",
    }),
    panel({
      title: "New",
      tone: "info",
      rows: stats.newPatients,
      filePrefix: "new_conversions",
      emptyLine: "No new patients this month.",
    }),
    panel({
      title: "Inactive",
      tone: "neg",
      rows: stats.inactive,
      filePrefix: "inactive_patients",
      emptyLine: "No patients dropped off — 100% retention this month.",
    }),
  );

  const resetBtn = el(
    "button",
    { class: "reset-btn", type: "button" },
    "↺ Start over",
  ) as HTMLButtonElement;
  resetBtn.addEventListener("click", () => dispatch({ type: "reset" }));

  const children: (Node | string | false)[] = [
    el(
      "div",
      { class: "section-rule" },
      el("span", {}, "Results"),
    ),
  ];
  if (stats.identical) {
    children.push(
      el(
        "div",
        { class: "results__banner", role: "status" },
        "These two files look identical — did you mean to compare different months?",
      ),
    );
  }
  children.push(hero, supporting, panels, el("div", { class: "reset-wrap" }, resetBtn));
  return el("div", { class: "results__inner" }, ...children);
}

export function createResults(dispatch: (a: Action) => void): {
  el: HTMLElement;
  update: (state: AppState) => void;
} {
  const root = el("section", {
    class: "container results",
    "aria-live": "polite",
    "aria-label": "Results",
  });

  function update(state: AppState): void {
    if (state.results === null) {
      root.replaceChildren();
      root.classList.remove("is-visible");
      return;
    }
    root.replaceChildren(render(state.results, dispatch));
    root.classList.add("is-visible");
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return { el: root, update };
}
