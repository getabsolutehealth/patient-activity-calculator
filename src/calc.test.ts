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
  dob: -1,
  patientId: -1,
};

function patient(first: string, last: string, dob = "", id = ""): Patient {
  return { first, last, dob, id };
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
    const m = autoDetectColumns(["FIRST NAME", "Last Name", "DOB"]);
    expect(m.firstName).toBe(0);
    expect(m.lastName).toBe(1);
    expect(m.dob).toBe(2);
  });

  it("falls back to a full-name column when first/last are absent", () => {
    const m = autoDetectColumns(["Patient Name", "Chart #"]);
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
    const parsed = parseCSV("Name\n\"Smith, John\"");
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
});

describe("resolveKeyMode", () => {
  it("uses id only when both files map it", () => {
    expect(resolveKeyMode({ id: true, dob: false }, { id: true, dob: false })).toBe("id");
    expect(resolveKeyMode({ id: true, dob: false }, { id: false, dob: false })).toBe("name");
  });
  it("uses name-dob when both map dob (and not both id)", () => {
    expect(resolveKeyMode({ id: false, dob: true }, { id: false, dob: true })).toBe("name-dob");
  });
  it("falls back to name", () => {
    expect(resolveKeyMode({ id: false, dob: false }, { id: false, dob: false })).toBe("name");
  });
});

describe("keyOf", () => {
  it("normalizes case and whitespace", () => {
    expect(keyOf(patient(" John ", "SMITH"), "name")).toBe("n:john|smith");
  });
  it("distinguishes twins by dob", () => {
    const a = patient("Sam", "Lee", "2020-01-01");
    const b = patient("Sam", "Lee", "2018-05-05");
    expect(keyOf(a, "name-dob")).not.toBe(keyOf(b, "name-dob"));
    expect(keyOf(a, "name")).toBe(keyOf(b, "name")); // collide without dob
  });
  it("uses id when in id mode", () => {
    expect(keyOf(patient("X", "Y", "", "MRN-9"), "id")).toBe("id:mrn-9");
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
    const s = computeStats(prior, current, "name");
    expect(s.churnPct).toBeCloseTo((1 / 3) * 100, 5);
  });

  it("momentum = new - inactive", () => {
    expect(computeStats(prior, current, "name").momentum).toBe(0);
  });

  it("churn is null when prior is empty", () => {
    expect(computeStats([], current, "name").churnPct).toBeNull();
  });

  it("dedups repeated rows within a file (counts unique patients, not visits)", () => {
    const dupCurrent = [patient("Jane", "Doe"), patient("Jane", "Doe"), patient("Amy", "New")];
    expect(computeStats(prior, dupCurrent, "name").activeCount).toBe(2);
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

  it("twins counted separately in name-dob mode", () => {
    const p = [patient("Sam", "Lee", "2020-01-01"), patient("Sam", "Lee", "2018-05-05")];
    expect(computeStats(p, p, "name-dob").activeCount).toBe(2);
    expect(computeStats(p, p, "name").activeCount).toBe(1);
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
    const csv = toCSV([patient("O\"Brien", "Smith")]);
    expect(csv).toContain('"O""Brien"');
  });

  it("neutralizes formula-injection cells", () => {
    const csv = toCSV([patient("=cmd", "Smith")]);
    // formatName title-cases first, then the leading '=' is neutralized with a quote.
    expect(csv).toContain('"\'=Cmd"'); // leading apostrophe inside the quoted field
  });

  it("adds DOB / Patient ID columns only when present", () => {
    expect(toCSV([patient("A", "B")]).split("\r\n")[0]).toBe('"First Name","Last Name"');
    const withDob = toCSV([patient("A", "B", "2020-01-01")]);
    expect(withDob.split("\r\n")[0]).toBe('"First Name","Last Name","Date of Birth"');
  });

  it("title-cases exported names", () => {
    expect(toCSV([patient("john", "smith")])).toContain('"John","Smith"');
  });
});
