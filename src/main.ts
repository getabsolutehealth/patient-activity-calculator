/**
 * Application entry — wires the reducer, components, and the one side effect
 * (reading the chosen file). Pure-DOM components: build once, update on each
 * state change.
 *
 *   onFile (FileReader) ─▶ dispatch(file-parsed | file-error)
 *   user actions ────────▶ dispatch(...)
 *   dispatch ─▶ reduce(state, action) ─▶ state' ─▶ updateAll(state')
 *
 * No third-party runtime: fonts are bundled, there is no analytics or error
 * reporting, and patient data never leaves the page. The only network the page
 * makes is the user clicking an outbound funnel link.
 */

import "./styles/global.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";

import { parseCSV } from "./calc";
import { createFooter } from "./components/footer";
import { createHeader } from "./components/header";
import { createHero } from "./components/hero";
import { createResults } from "./components/results";
import { createUpload } from "./components/upload";
import { el } from "./dom";
import { type Action, type AppState, type SlotId, initialState, reduce } from "./state";

const root = document.getElementById("app");
if (!root) throw new Error("patient-activity-calculator: missing #app mount point");

let state: AppState = initialState();

const dispatch = (action: Action): void => {
  state = reduce(state, action);
  updateAll();
};

/**
 * Read a chosen file and dispatch the result. The only side effect in the app.
 * Patient data stays in memory here — nothing is transmitted.
 */
function onFile(slot: SlotId, file: File): void {
  const looksCsv = /\.csv$/i.test(file.name) || file.type === "text/csv" || file.type === "";
  if (!looksCsv) {
    dispatch({ type: "file-error", slot, fileName: file.name, message: "That's not a CSV file." });
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => {
    dispatch({
      type: "file-error",
      slot,
      fileName: file.name,
      message: "Couldn't read this file. Try re-exporting it.",
    });
  };
  reader.onload = (e) => {
    const text = String(e.target?.result ?? "");
    const parsed = parseCSV(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      dispatch({
        type: "file-error",
        slot,
        fileName: file.name,
        message: "No rows we can read in this file.",
      });
      return;
    }
    dispatch({ type: "file-parsed", slot, fileName: file.name, parsed });
  };
  reader.readAsText(file);
}

const header = createHeader();
const hero = createHero();
const upload = createUpload({ onFile, dispatch });
const results = createResults(dispatch);
const footer = createFooter();

const main = el("main", { class: "page" }, hero.el, upload.el, results.el);
root.append(header.el, main, footer.el);

function updateAll(): void {
  upload.update(state);
  results.update(state);
}

updateAll();
