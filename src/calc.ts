/**
 * Pure calculation core for the Patient Activity Calculator. No DOM, no I/O —
 * everything here is deterministic and unit-tested in calc.test.ts.
 *
 * Pipeline:
 *
 *   raw CSV text ──parseCSV──▶ { headers, rows }
 *                                  │
 *               autoDetectColumns / user picks ──▶ ColumnMapping
 *                                  │
 *              extractPatients(parsed, mapping) ──▶ Patient[]
 *                                  │
 *   prior[] + current[] ──computeStats(_, _, keyMode)──▶ Stats
 *                                  │
 *               toCSV(patients) ──▶ download blob text
 *
 * Patient matching (eng review 2026-06-06): a name-only key mis-counts twins,
 * duplicate names, and name changes. Match-key precedence, decided once across
 * BOTH files so keys are comparable:
 *   - "id"        : Patient ID column mapped in both files  (most reliable)
 *   - "name-dob"  : first + last + DOB                      (disambiguates twins)
 *   - "name"      : first + last                            (universal fallback)
 */

// -----------------------------------------------------------------------------
// CSV parsing

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * Parse CSV text into headers + rows.
 *
 * Handles: UTF-8 BOM (Excel exports prepend one — left in place it corrupts the
 * first header and breaks column detection), CRLF and LF line endings, quoted
 * fields containing commas/newlines, and escaped embedded quotes ("" → ").
 * Fully blank lines are skipped. Returns empty headers/rows when there's no
 * data row (caller treats that as a parse error).
 */
export function parseCSV(text: string): ParsedCsv {
  // Strip UTF-8 BOM if present.
  let input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  // Normalize line endings so the field parser only deals with "\n".
  input = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += ch;
    }
  }
  // Flush the final field/record (no trailing newline).
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  // Trim cells and drop fully-blank rows.
  const cleaned = records
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));

  if (cleaned.length < 2) {
    // Need at least a header row + one data row to be usable.
    return { headers: cleaned[0] ?? [], rows: [] };
  }
  const [headers, ...rows] = cleaned;
  return { headers: headers ?? [], rows };
}

// -----------------------------------------------------------------------------
// Column detection

export interface ColumnMapping {
  /** Index of the first-name column, or -1 if using fullName. */
  firstName: number;
  /** Index of the last-name column, or -1 if using fullName. */
  lastName: number;
  /** Index of a single "Full Name" column, or -1 if using first/last. */
  fullName: number;
  /** Optional DOB column index, or -1. */
  dob: number;
  /** Optional Patient ID column index, or -1. */
  patientId: number;
}

const FIRST_CANDIDATES = ["first name", "firstname", "first", "fname", "given name"];
const LAST_CANDIDATES = ["last name", "lastname", "last", "lname", "surname", "family name"];
const FULL_CANDIDATES = ["patient name", "full name", "name", "patient"];
const DOB_CANDIDATES = ["dob", "date of birth", "birth date", "birthdate", "d.o.b."];
const ID_CANDIDATES = [
  "patient id",
  "patientid",
  "id",
  "chart",
  "chart number",
  "chart #",
  "mrn",
  "account",
  "account number",
];

function findHeader(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(cand);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Best-effort column auto-detection. Prefers explicit first/last columns; falls
 * back to a single full-name column. DOB and Patient ID are optional. A mapping
 * is "usable" (see `isMappingUsable`) only if it can produce a name.
 */
export function autoDetectColumns(headers: string[]): ColumnMapping {
  const firstName = findHeader(headers, FIRST_CANDIDATES);
  const lastName = findHeader(headers, LAST_CANDIDATES);
  // Only treat a full-name column as the name source when we don't have both
  // first AND last (avoids hijacking "Patient Name" when First/Last exist).
  const fullName =
    firstName !== -1 && lastName !== -1 ? -1 : findHeader(headers, FULL_CANDIDATES);
  return {
    firstName,
    lastName,
    fullName,
    dob: findHeader(headers, DOB_CANDIDATES),
    patientId: findHeader(headers, ID_CANDIDATES),
  };
}

/** A mapping can extract names if it has a full-name column or BOTH first+last. */
export function isMappingUsable(m: ColumnMapping): boolean {
  return m.fullName !== -1 || (m.firstName !== -1 && m.lastName !== -1);
}

// -----------------------------------------------------------------------------
// Patient extraction

export interface Patient {
  first: string;
  last: string;
  dob: string;
  id: string;
}

/** Split a single full-name cell into {first, last}. Handles "Last, First". */
function splitFullName(full: string): { first: string; last: string } {
  const trimmed = full.trim();
  if (trimmed.includes(",")) {
    const [last, ...rest] = trimmed.split(",");
    return { last: (last ?? "").trim(), first: rest.join(",").trim() };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? "", last: "" };
  const last = parts[parts.length - 1] ?? "";
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

function cell(row: string[], idx: number): string {
  if (idx < 0) return "";
  return (row[idx] ?? "").trim();
}

/**
 * Extract patients from parsed rows using the column mapping. Rows with no
 * usable name are skipped. No dedup here — that happens in computeStats once the
 * key mode is known.
 */
export function extractPatients(parsed: ParsedCsv, m: ColumnMapping): Patient[] {
  const out: Patient[] = [];
  for (const row of parsed.rows) {
    let first = "";
    let last = "";
    if (m.fullName !== -1) {
      ({ first, last } = splitFullName(cell(row, m.fullName)));
    } else {
      first = cell(row, m.firstName);
      last = cell(row, m.lastName);
    }
    const id = cell(row, m.patientId);
    const dob = cell(row, m.dob);
    if (first === "" && last === "" && id === "") continue; // nothing to identify
    out.push({ first, last, dob, id });
  }
  return out;
}

// -----------------------------------------------------------------------------
// Matching + stats

export type KeyMode = "id" | "name-dob" | "name";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Choose the strongest key mode usable across BOTH files. Mixing key schemes
 * between files would make every patient look new/inactive, so the decision is
 * made once. `mapped` reflects which optional columns the user mapped per file.
 */
export function resolveKeyMode(
  priorMapped: { id: boolean; dob: boolean },
  currentMapped: { id: boolean; dob: boolean },
): KeyMode {
  if (priorMapped.id && currentMapped.id) return "id";
  if (priorMapped.dob && currentMapped.dob) return "name-dob";
  return "name";
}

export function keyOf(p: Patient, mode: KeyMode): string {
  switch (mode) {
    case "id":
      return `id:${norm(p.id)}`;
    case "name-dob":
      return `nd:${norm(p.first)}|${norm(p.last)}|${norm(p.dob)}`;
    case "name":
      return `n:${norm(p.first)}|${norm(p.last)}`;
  }
}

/** Title-case a name for display + export (matches the v1 tool's behavior). */
export function formatName(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Sort by last name, then first. */
export function byName(a: Patient, b: Patient): number {
  return a.last.localeCompare(b.last) || a.first.localeCompare(b.first);
}

/** Dedup a patient list by key, keeping the first occurrence. */
function dedupe(patients: Patient[], mode: KeyMode): Map<string, Patient> {
  const m = new Map<string, Patient>();
  for (const p of patients) {
    const k = keyOf(p, mode);
    if (!m.has(k)) m.set(k, p);
  }
  return m;
}

export interface Stats {
  activeCount: number;
  inactiveCount: number;
  newCount: number;
  /** Inactive ÷ prior unique total, as a percent (null when prior is empty). */
  churnPct: number | null;
  /** New conversions − inactive. */
  momentum: number;
  active: Patient[];
  inactive: Patient[];
  newPatients: Patient[];
  /** True when both files dedupe to the identical key set (likely same export). */
  identical: boolean;
}

/**
 * Compute the activity stats from prior- and current-month patient lists.
 *   active   = unique patients in current
 *   inactive = in prior, not in current
 *   new      = in current, not in prior
 */
export function computeStats(prior: Patient[], current: Patient[], mode: KeyMode): Stats {
  const priorMap = dedupe(prior, mode);
  const currentMap = dedupe(current, mode);

  const active = [...currentMap.values()].sort(byName);
  const inactive = [...priorMap.entries()]
    .filter(([k]) => !currentMap.has(k))
    .map(([, v]) => v)
    .sort(byName);
  const newPatients = [...currentMap.entries()]
    .filter(([k]) => !priorMap.has(k))
    .map(([, v]) => v)
    .sort(byName);

  const churnPct =
    priorMap.size > 0 ? (inactive.length / priorMap.size) * 100 : null;

  const identical =
    priorMap.size > 0 &&
    priorMap.size === currentMap.size &&
    [...priorMap.keys()].every((k) => currentMap.has(k));

  return {
    activeCount: currentMap.size,
    inactiveCount: inactive.length,
    newCount: newPatients.length,
    churnPct,
    momentum: newPatients.length - inactive.length,
    active,
    inactive,
    newPatients,
    identical,
  };
}

// -----------------------------------------------------------------------------
// CSV export

/**
 * Guard against CSV formula injection. A cell starting with = + - @ or a
 * tab/CR can be executed as a formula when the file is opened in Excel/Sheets,
 * so we prefix those with a single quote. (OWASP CSV injection.)
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** RFC-4180 field: always-quote, escape embedded quotes by doubling. */
function csvField(value: string): string {
  return `"${neutralizeFormula(value).replace(/"/g, '""')}"`;
}

/**
 * Serialize patients to CSV text. Columns adapt to the data present: Patient ID
 * and DOB columns are included only when at least one patient carries them.
 */
export function toCSV(patients: Patient[]): string {
  const hasId = patients.some((p) => p.id !== "");
  const hasDob = patients.some((p) => p.dob !== "");
  const header = ["First Name", "Last Name"];
  if (hasDob) header.push("Date of Birth");
  if (hasId) header.push("Patient ID");

  const lines = [header.map(csvField).join(",")];
  for (const p of patients) {
    const fields = [formatName(p.first), formatName(p.last)];
    if (hasDob) fields.push(p.dob);
    if (hasId) fields.push(p.id);
    lines.push(fields.map(csvField).join(","));
  }
  return lines.join("\r\n");
}
