/**
 * Page state — hand-rolled reducer (same pattern as cvai-tools, lighter).
 *
 * Two INDEPENDENT file slots, not a linear flow. Either file can be loaded,
 * errored, or awaiting column mapping at any time; the run button derives from
 * whether BOTH slots are ready. Any change to a file or its column mapping
 * invalidates a prior result so the screen can never show stale numbers.
 *
 *   slotA (prior month) ─┐
 *                        ├─ canRun = both ready ──[run]──▶ results: Stats
 *   slotB (current) ─────┘                                     │
 *        any file/mapping change ───────────────────────────── invalidates ──▶ null
 *
 * The reducer is pure: FileReader I/O lives in main.ts and dispatches
 * `file-parsed` / `file-error`. computeStats runs here (all inputs are in state).
 */

import {
  type ColumnMapping,
  type ParsedCsv,
  type Stats,
  autoDetectColumns,
  computeStats,
  extractPatients,
  isMappingUsable,
  resolveKeyMode,
} from "./calc";

export type SlotId = "A" | "B";

export type FileSlot =
  | { status: "empty" }
  | { status: "error"; fileName: string; message: string }
  | {
      status: "loaded";
      fileName: string;
      rowCount: number;
      parsed: ParsedCsv;
      mapping: ColumnMapping;
    };

export interface AppState {
  /** Prior month. */
  slotA: FileSlot;
  /** Current month. */
  slotB: FileSlot;
  results: Stats | null;
}

export function initialState(): AppState {
  return { slotA: { status: "empty" }, slotB: { status: "empty" }, results: null };
}

/** A slot is ready when it's loaded AND its columns can produce a name. */
export function slotReady(slot: FileSlot): boolean {
  return slot.status === "loaded" && isMappingUsable(slot.mapping);
}

export function canRun(state: AppState): boolean {
  return slotReady(state.slotA) && slotReady(state.slotB);
}

export type Action =
  | { type: "file-parsed"; slot: SlotId; fileName: string; parsed: ParsedCsv }
  | { type: "file-error"; slot: SlotId; fileName: string; message: string }
  | { type: "file-cleared"; slot: SlotId }
  | { type: "set-column"; slot: SlotId; field: keyof ColumnMapping; index: number }
  | { type: "run" }
  | { type: "reset" };

function getSlot(state: AppState, id: SlotId): FileSlot {
  return id === "A" ? state.slotA : state.slotB;
}

function withSlot(state: AppState, id: SlotId, slot: FileSlot): AppState {
  // Any slot mutation invalidates a shown result — never display stale numbers.
  return id === "A"
    ? { ...state, slotA: slot, results: null }
    : { ...state, slotB: slot, results: null };
}

export function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "file-parsed": {
      const slot: FileSlot = {
        status: "loaded",
        fileName: action.fileName,
        rowCount: action.parsed.rows.length,
        parsed: action.parsed,
        mapping: autoDetectColumns(action.parsed.headers),
      };
      return withSlot(state, action.slot, slot);
    }

    case "file-error": {
      return withSlot(state, action.slot, {
        status: "error",
        fileName: action.fileName,
        message: action.message,
      });
    }

    case "file-cleared": {
      return withSlot(state, action.slot, { status: "empty" });
    }

    case "set-column": {
      const slot = getSlot(state, action.slot);
      if (slot.status !== "loaded") return state;
      const mapping: ColumnMapping = { ...slot.mapping, [action.field]: action.index };
      return withSlot(state, action.slot, { ...slot, mapping });
    }

    case "run": {
      if (!canRun(state)) return state;
      // canRun guarantees both slots are "loaded".
      const a = state.slotA as Extract<FileSlot, { status: "loaded" }>;
      const b = state.slotB as Extract<FileSlot, { status: "loaded" }>;
      const mode = resolveKeyMode(
        { id: a.mapping.patientId !== -1, dob: a.mapping.dob !== -1 },
        { id: b.mapping.patientId !== -1, dob: b.mapping.dob !== -1 },
      );
      const results = computeStats(
        extractPatients(a.parsed, a.mapping),
        extractPatients(b.parsed, b.mapping),
        mode,
      );
      return { ...state, results };
    }

    case "reset": {
      return initialState();
    }
  }
}
