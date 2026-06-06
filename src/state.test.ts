import { describe, expect, it } from "vitest";
import { parseCSV } from "./calc";
import { type AppState, type SlotId, canRun, initialState, reduce, slotReady } from "./state";

const PRIOR = "First Name,Last Name\nJohn,Smith\nJane,Doe";
const CURRENT = "First Name,Last Name\nJane,Doe\nAmy,New";

function load(state: AppState, slot: SlotId, csv: string, fileName = "f.csv"): AppState {
  return reduce(state, { type: "file-parsed", slot, fileName, parsed: parseCSV(csv) });
}

describe("reduce — file slots", () => {
  it("starts empty, not runnable", () => {
    const s = initialState();
    expect(s.slotA.status).toBe("empty");
    expect(canRun(s)).toBe(false);
  });

  it("loads a file and auto-detects columns → slot ready", () => {
    const s = load(initialState(), "A", PRIOR);
    expect(s.slotA.status).toBe("loaded");
    expect(slotReady(s.slotA)).toBe(true);
    expect(canRun(s)).toBe(false); // only one slot
  });

  it("becomes runnable only when BOTH slots are ready", () => {
    let s = load(initialState(), "A", PRIOR);
    s = load(s, "B", CURRENT);
    expect(canRun(s)).toBe(true);
  });

  it("a file with no name columns loads but is NOT ready", () => {
    const s = load(initialState(), "A", "Email,Phone\nx@y.com,555");
    expect(s.slotA.status).toBe("loaded");
    expect(slotReady(s.slotA)).toBe(false);
    expect(canRun(s)).toBe(false);
  });

  it("file-error sets the slot to error", () => {
    const s = reduce(initialState(), {
      type: "file-error",
      slot: "A",
      fileName: "bad.png",
      message: "That's not a CSV",
    });
    expect(s.slotA.status).toBe("error");
    expect(canRun(s)).toBe(false);
  });
});

describe("reduce — run + results invalidation", () => {
  function ready(): AppState {
    let s = load(initialState(), "A", PRIOR);
    s = load(s, "B", CURRENT);
    return s;
  }

  it("run computes stats", () => {
    const s = reduce(ready(), { type: "run" });
    expect(s.results).not.toBeNull();
    expect(s.results?.activeCount).toBe(2); // Jane, Amy
    expect(s.results?.inactiveCount).toBe(1); // John dropped
    expect(s.results?.newCount).toBe(1); // Amy
  });

  it("run is a no-op when not both ready", () => {
    const s = reduce(load(initialState(), "A", PRIOR), { type: "run" });
    expect(s.results).toBeNull();
  });

  it("re-uploading a file after results clears the stale result", () => {
    const ran = reduce(ready(), { type: "run" });
    expect(ran.results).not.toBeNull();
    const reloaded = load(ran, "B", "First Name,Last Name\nJohn,Smith\nJane,Doe");
    expect(reloaded.results).toBeNull();
  });

  it("changing a column mapping after results clears the stale result", () => {
    const ran = reduce(ready(), { type: "run" });
    const remapped = reduce(ran, { type: "set-column", slot: "A", field: "firstName", index: 1 });
    expect(remapped.results).toBeNull();
  });

  it("set-column on an unloaded slot is a no-op", () => {
    const s = reduce(initialState(), {
      type: "set-column",
      slot: "A",
      field: "patientId",
      index: 2,
    });
    expect(s.slotA.status).toBe("empty");
  });

  it("reset returns to initial", () => {
    const s = reduce(reduce(ready(), { type: "run" }), { type: "reset" });
    expect(s.slotA.status).toBe("empty");
    expect(s.results).toBeNull();
  });

  it("auto-detects a Patient ID column → matches by id (survives a name change)", () => {
    const before = "First Name,Last Name,Chart #\nMary,Jones,P1\nGus,Old,P9";
    const after = "First Name,Last Name,Chart #\nMary,Smith,P1"; // P1 married name; P9 dropped
    let s = load(initialState(), "A", before);
    s = load(s, "B", after);
    const ran = reduce(s, { type: "run" });
    // id mode: P1 stays active despite the name change; P9 is the only inactive.
    expect(ran.results?.inactiveCount).toBe(1);
    expect(ran.results?.newCount).toBe(0);
  });
});
