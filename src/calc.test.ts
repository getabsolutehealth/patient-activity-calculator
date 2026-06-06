import { describe, expect, it } from "vitest";
import {
  autoDetectColumns,
  byName,
  computeStats,
  type ColumnMapping,
  type Patient,
  extractPatients,
  formatName,
  isMappingUsable,
  keyOf,
  parseCSV,
  resolveKeyMode,
  toCSV,
} from "./calc";

const NAME_ONLY: ColumnMapping = {
  firstName: 0,
  lastName: 1,
  fullName: -1,
  patientId: -1,
};

function patient(first: string, last: string, id = ""): Patient {
  return { first, last, id };
}

describe("parseCSV", () => {
  it("parses headers + rows", () => {
    const out = parseCSV("First Name,Last Name\nJohn,Smith\nJane,Doe");
    expect(out.headers).toEqual(["First Name", "Last Name"]);
    expect(out.rows).toEqual([
      ["John", "Smith"],
      ["Jane", "Doe"],
    ]);
  });

  it("returns no rows when fewer than 2 lines (header only / empty)", () => {
    expect(parseCSV("First Name,Last Name").rows).toEqual([]);
    expect(parseCSV("").rows).toEqual([]);
    expect(parseCSV("   ").rows).toEqual([]);
  });

  it("strips a UTF-8 BOM so the first header is clean", () => {
    const out = parseCSV("﻿First Name,Last Name\nJohn,Smith");
    expect(out.headers[0]).toBe("First Name");
  });

  it("handles CRLF line endings and trailing blank lines", () => {
    const out = parseCSV("First Name,Last Name\r\nJohn,Smith\r\n\r\n");
    expect(out.rows).toEqual([["John", "Smith"]]);
  });

  it("parses quoted fields containing commas", () => {
    const out = parseCSV('First Name,Last Name\n"Mary, Jo",Smith');
    expect(out.rows[0]).toEqual(["Mary, Jo", "Smith"]);
  });

  it("parses escaped embedded quotes", () => {
    const out = parseCSV('First Name,Last Name\n"O""Brien",Smith');
    expect(out.rows[0]).toEqual(['O"Brien', "Smith"]);
  });

  it("skips fully blank interior lines", () => {
    const out = parseCSV("First Name,Last Name\nJohn,Smith\n\nJane,Doe");
    expect(out.rows).toHaveLength(2);
  });
});

describe("autoDetectColumns", () => {
  it("detects first/last by common header names (case-insensitive)", () => {
    const m = autoDetectColumns(["FIRST NAME", "Last Name"]);
    expect(m.firstName).toBe(0);
    expect(m.lastName).toBe(1);
  });

  it("auto-detects a patient-level ID column", () => {
    const m = autoDetectColumns(["First Name", "Last Name", "Chart #"]);
    expect(m.patientId).toBe(2);
  });

  it("does NOT auto-detect a generic 'id' or 'account' column (could be a visit id)", () => {
    expect(autoDetectColumns(["First Name", "Last Name", "ID"]).patientId).toBe(-1);
    expect(autoDetectColumns(["First Name", "Last Name", "Account #"]).patientId).toBe(-1);
  });

  it("falls back to a full-name column when first/last are absent", () => {
    const m = autoDetectColumns(["Patient Name", "Chart Number"]);
    expect(m.fullName).toBe(0);
    expect(m.patientId).toBe(1);
  });

  it("does not hijack a full-name column when first AND last exist", () => {
    const m = autoDetectColumns(["First Name", "Last Name", "Patient Name"]);
    expect(m.fullName).toBe(-1);
  });

  it("isMappingUsable requires a name source", () => {
    expect(isMappingUsable(autoDetectColumns(["First Name", "Last Name"]))).toBe(true);
    expect(isMappingUsable(autoDetectColumns(["Full Name"]))).toBe(true);
    expect(isMappingUsable(autoDetectColumns(["Email", "Phone"]))).toBe(false);
  });
});

describe("extractPatients", () => {
  it("reads first/last and skips nameless rows", () => {
    const parsed = parseCSV("First Name,Last Name\nJohn,Smith\n,\nJane,Doe");
    const out = extractPatients(parsed, NAME_ONLY);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ first: "John", last: "Smith" });
  });

  it("splits a 'Last, First' full-name column", () => {
    const parsed = parseCSV('Name\n"Smith, John"');
    const m = autoDetectColumns(parsed.headers);
    const out = extractPatients(parsed, m);
    expect(out[0]).toMatchObject({ first: "John", last: "Smith" });
  });

  it("splits a 'First Last' full-name column", () => {
    const parsed = parseCSV("Name\nJohn Adams Smith");
    const m = autoDetectColumns(parsed.headers);
    const out = extractPatients(parsed, m);
    expect(out[0]).toMatchObject({ first: "John Adams", last: "Smith" });
  });

  it("reads a Patient ID when mapped", () => {
    const parsed = parseCSV("First Name,Last Name,Chart #\nJohn,Smith,MRN-9");
    const m = autoDetectColumns(parsed.headers);
    expect(extractPatients(parsed, m)[0]).toMatchObject({ id: "MRN-9" });
  });
});

describe("resolveKeyMode", () => {
  it("uses id only when both files map it", () => {
    expect(resolveKeyMode({ id: true }, { id: true })).toBe("id");
    expect(resolveKeyMode({ id: true }, { id: false })).toBe("name");
  });
  it("falls back to name", () => {
    expect(resolveKeyMode({ id: false }, { id: false })).toBe("name");
  });
});

describe("keyOf", () => {
  it("normalizes case and whitespace", () => {
    expect(keyOf(patient(" John ", "SMITH"), "name")).toBe("n:john|smith");
  });
  it("matches by id when in id mode (ignores name differences)", () => {
    const a = patient("Robert", "Lee", "MRN-1");
    const b = patient("Bob", "Lee", "MRN-1"); // same person, nickname
    expect(keyOf(a, "id")).toBe(keyOf(b, "id"));
    expect(keyOf(a, "name")).not.toBe(keyOf(b, "name"));
  });
});

describe("computeStats", () => {
  const prior = [patient("John", "Smith"), patient("Jane", "Doe"), patient("Bob", "Roe")];
  const current = [patient("Jane", "Doe"), patient("Bob", "Roe"), patient("Amy", "New")];

  it("computes active / inactive / new", () => {
    const s = computeStats(prior, current, "name");
    expect(s.activeCount).toBe(3);
    expect(s.inactiveCount).toBe(1); // John Smith dropped
    expect(s.inactive[0]).toMatchObject({ last: "Smith" });
    expect(s.newCount).toBe(1); // Amy New
    expect(s.newPatients[0]).toMatchObject({ last: "New" });
  });

  it("churn = inactive / prior unique total", () => {
    expect(computeStats(prior, current, "name").churnPct).toBeCloseTo((1 / 3) * 100, 5);
  });

  it("momentum = new - inactive", () => {
    expect(computeStats(prior, current, "name").momentum).toBe(0);
  });

  it("churn is null when prior is empty", () => {
    expect(computeStats([], current, "name").churnPct).toBeNull();
  });

  it("dedups repeated rows (counts unique patients, not visits) — by id", () => {
    // One patient seen 3 times this month (visit-level export) → one active patient.
    const visits = [
      patient("Jane", "Doe", "P1"),
      patient("Jane", "Doe", "P1"),
      patient("Jane", "Doe", "P1"),
      patient("Amy", "New", "P2"),
    ];
    const priorById = [patient("Jane", "Doe", "P1"), patient("Gus", "Old", "P9")];
    const s = computeStats(priorById, visits, "id");
    expect(s.activeCount).toBe(2); // P1, P2 — not 4 visit rows
    expect(s.inactiveCount).toBe(1); // P9 dropped
    expect(s.newCount).toBe(1); // P2
  });

  it("id matching survives a name change (same id)", () => {
    const before = [patient("Mary", "Jones", "P1")];
    const after = [patient("Mary", "Smith", "P1")]; // married name
    const s = computeStats(before, after, "id");
    expect(s.inactiveCount).toBe(0);
    expect(s.newCount).toBe(0);
    // name mode would wrongly count her as 1 inactive + 1 new:
    const wrong = computeStats(before, after, "name");
    expect(wrong.inactiveCount).toBe(1);
    expect(wrong.newCount).toBe(1);
  });

  it("flags identical files", () => {
    expect(computeStats(prior, prior, "name").identical).toBe(true);
    expect(computeStats(prior, current, "name").identical).toBe(false);
  });

  it("zero inactive when current is a superset of prior", () => {
    const s = computeStats(prior, [...prior, patient("Amy", "New")], "name");
    expect(s.inactiveCount).toBe(0);
    expect(s.churnPct).toBe(0);
  });
});

describe("formatName / byName", () => {
  it("title-cases", () => {
    expect(formatName("john o'brien")).toBe("John O'Brien");
  });
  it("sorts by last then first", () => {
    const list = [patient("Bob", "Smith"), patient("Amy", "Smith"), patient("Zoe", "Adams")];
    const sorted = [...list].sort(byName);
    expect(sorted.map((p) => p.last + p.first)).toEqual(["AdamsZoe", "SmithAmy", "SmithBob"]);
  });
});

describe("toCSV", () => {
  it("quotes fields and escapes embedded quotes", () => {
    const csv = toCSV([patient('O"Brien', "Smith")]);
    expect(csv).toContain('"O""Brien"');
  });

  it("neutralizes formula-injection cells", () => {
    const csv = toCSV([patient("=cmd", "Smith")]);
    // formatName title-cases first, then the leading '=' is neutralized with a quote.
    expect(csv).toContain('"\'=Cmd"');
  });

  it("adds a Patient ID column only when present", () => {
    expect(toCSV([patient("A", "B")]).split("\r\n")[0]).toBe('"First Name","Last Name"');
    const withId = toCSV([patient("A", "B", "P1")]);
    expect(withId.split("\r\n")[0]).toBe('"First Name","Last Name","Patient ID"');
  });

  it("title-cases exported names", () => {
    expect(toCSV([patient("john", "smith")])).toContain('"John","Smith"');
  });
});
