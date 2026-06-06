/**
 * Upload section — two file slots (Prior / Current month). Each card is a real
 * <label>+<input type=file> (keyboard-operable). On load it shows the filename,
 * a mono row count, and column pickers (First/Last name, optional DOB, optional
 * Patient ID). Parse/read failures render an inline per-card error. The Run
 * button derives from canRun.
 *
 * I/O lives in main.ts: the card calls `onFile(slot, file)`, which runs the
 * FileReader and dispatches file-parsed / file-error. Column changes and Run
 * dispatch directly.
 */

import { type ColumnMapping, isMappingUsable } from "../calc";
import { el } from "../dom";
import { type Action, type AppState, type FileSlot, type SlotId, canRun } from "../state";

import "./upload.css";

interface UploadDeps {
  onFile: (slot: SlotId, file: File) => void;
  dispatch: (action: Action) => void;
}

const SLOT_META: Record<SlotId, { step: string; hint: string }> = {
  A: { step: "Step 1 · Prior Month", hint: "e.g. February export" },
  B: { step: "Step 2 · Current Month", hint: "e.g. March export" },
};

function columnSelect(
  label: string,
  headers: string[],
  selected: number,
  optional: boolean,
  onChange: (index: number) => void,
): HTMLElement {
  const select = el("select", { class: "col-select" }) as HTMLSelectElement;
  if (optional) {
    select.append(new Option("— none —", "-1", selected === -1, selected === -1));
  } else if (selected === -1) {
    select.append(new Option("— select —", "-1", true, true));
  }
  headers.forEach((h, i) => {
    select.append(new Option(h || `Column ${i + 1}`, String(i), false, i === selected));
  });
  select.addEventListener("change", () => onChange(Number(select.value)));
  // Stop the click from bubbling to the wrapping <label> (would reopen the file dialog).
  select.addEventListener("click", (e) => e.stopPropagation());
  return el(
    "label",
    { class: "col-field" },
    el("span", { class: "col-field__label" }, label),
    select,
  );
}

function pickers(slot: SlotId, mapping: ColumnMapping, headers: string[], deps: UploadDeps) {
  const set = (field: keyof ColumnMapping, index: number) =>
    deps.dispatch({ type: "set-column", slot, field, index });
  // Picking an explicit first/last column clears any auto-detected full-name source.
  const setName = (field: "firstName" | "lastName", index: number) => {
    set(field, index);
    if (mapping.fullName !== -1) set("fullName", -1);
  };
  return el(
    "div",
    { class: "col-pickers" },
    columnSelect("First name", headers, mapping.firstName, false, (i) => setName("firstName", i)),
    columnSelect("Last name", headers, mapping.lastName, false, (i) => setName("lastName", i)),
    columnSelect("Date of birth (optional)", headers, mapping.dob, true, (i) => set("dob", i)),
    columnSelect("Patient ID (optional)", headers, mapping.patientId, true, (i) =>
      set("patientId", i),
    ),
  );
}

function renderCard(slot: SlotId, state: FileSlot, deps: UploadDeps): HTMLElement {
  const meta = SLOT_META[slot];
  const input = el("input", {
    type: "file",
    accept: ".csv,text/csv",
    class: "upload-card__input",
  }) as HTMLInputElement;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) deps.onFile(slot, file);
    input.value = ""; // allow re-selecting the same file
  });

  const children: (Node | string | false)[] = [
    input,
    el("div", { class: "upload-card__step" }, meta.step),
  ];

  if (state.status === "loaded") {
    children.push(
      el("div", { class: "upload-card__title" }, state.fileName.replace(/\.csv$/i, "")),
      el(
        "div",
        { class: "upload-card__ok" },
        "✓ ",
        el("span", { class: "mono" }, String(state.rowCount)),
        ` record${state.rowCount === 1 ? "" : "s"} loaded`,
      ),
      !isMappingUsable(state.mapping) &&
        el(
          "div",
          { class: "upload-card__error", role: "alert" },
          "Couldn't find name columns — pick the First and Last name columns below.",
        ),
      pickers(slot, state.mapping, state.parsed.headers, deps),
    );
  } else if (state.status === "error") {
    children.push(
      el("div", { class: "upload-card__title" }, state.fileName),
      el("div", { class: "upload-card__error", role: "alert" }, state.message),
    );
  } else {
    children.push(
      el("div", { class: "upload-card__title" }, "Select CSV file"),
      el("div", { class: "upload-card__hint" }, meta.hint),
    );
  }

  const cls =
    "upload-card" +
    (state.status === "loaded" ? " is-loaded" : "") +
    (state.status === "error" ? " is-error" : "");
  return el("label", { class: cls }, ...children);
}

export function createUpload(deps: UploadDeps): {
  el: HTMLElement;
  update: (state: AppState) => void;
} {
  const row = el("div", { class: "upload-row" });
  const runBtn = el(
    "button",
    { class: "run-btn", type: "button", disabled: true },
    "Run Analysis →",
  ) as HTMLButtonElement;
  runBtn.addEventListener("click", () => deps.dispatch({ type: "run" }));
  const hint = el("p", { class: "run-hint" });

  const root = el(
    "section",
    { class: "container upload", "aria-label": "Upload monthly exports" },
    row,
    runBtn,
    hint,
  );

  function update(state: AppState): void {
    row.replaceChildren(renderCard("A", state.slotA, deps), renderCard("B", state.slotB, deps));
    const ready = canRun(state);
    runBtn.disabled = !ready;
    const loadedCount = [state.slotA, state.slotB].filter((s) => s.status === "loaded").length;
    hint.textContent =
      ready || loadedCount === 0
        ? ""
        : "Add and map both months to run.";
  }

  return { el: root, update };
}
