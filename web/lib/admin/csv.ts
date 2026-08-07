"use client";

/**
 * Citire CSV pentru importul de abonați.
 *
 * Fișierele vin de la organizatori, nu de la un sistem: pot fi salvate din
 * Excel (cu `;` și diacritice în Windows-1252), din Google Sheets (cu `,` și
 * UTF-8), cu sau fără antet, cu numele și emailul în orice ordine. Parserul de
 * mai jos acoperă cazurile astea fără să adăugăm o bibliotecă.
 */

export interface ParsedSubscriber {
  name: string;
  email: string;
}

export interface ParsedCsv {
  rows: ParsedSubscriber[];
  /** Rânduri fără email valid — le arătăm ca să știe ce n-a intrat. */
  skipped: string[];
  /** Delimitatorul detectat, afișat în previzualizare. */
  delimiter: "," | ";" | "\t";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Decodează fișierul: UTF-8 întâi, iar dacă apar caractere de înlocuire
 * (semnul întrebării negru) reîncearcă Windows-1252 — așa salvează Excel-ul
 * românesc, iar „Ștefan” nu mai devine „�tefan”.
 */
export function decodeCsv(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("�")) return utf8;
  try {
    return new TextDecoder("windows-1252").decode(buffer);
  } catch {
    return utf8;
  }
}

/** Delimitatorul cel mai frecvent pe primul rând. */
function detectDelimiter(text: string): "," | ";" | "\t" {
  const line = text.split(/\r?\n/, 1)[0] ?? "";
  const semi = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  if (semi >= comma && semi >= tab && semi > 0) return ";";
  if (tab >= comma && tab > 0) return "\t";
  return ",";
}

/** CSV → matrice de celule, respectând ghilimelele și `""` din interior. */
export function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Indexul coloanelor de nume și email, din antet sau ghicit din conținut. */
function pickColumns(rows: string[][]): {
  nameAt: number;
  emailAt: number;
  hasHeader: boolean;
} {
  const first = (rows[0] ?? []).map((c) => c.trim().toLowerCase());
  const headerEmail = first.findIndex((c) =>
    ["email", "e-mail", "adresa", "adresă", "adresa de email", "mail"].includes(c)
  );
  const headerName = first.findIndex((c) =>
    ["nume", "name", "nume complet", "prenume", "nume si prenume", "nume și prenume"].includes(c)
  );
  if (headerEmail >= 0) {
    return { nameAt: headerName, emailAt: headerEmail, hasHeader: true };
  }

  // Fără antet: coloana cu adrese e cea care conține „@”.
  const sample = rows.slice(0, 5);
  let emailAt = 0;
  const width = Math.max(...sample.map((r) => r.length), 1);
  for (let col = 0; col < width; col++) {
    if (sample.some((r) => (r[col] ?? "").includes("@"))) {
      emailAt = col;
      break;
    }
  }
  const nameAt = width > 1 ? (emailAt === 0 ? 1 : 0) : -1;
  return { nameAt, emailAt, hasHeader: false };
}

/** Fișier CSV → abonați (nume + email), fără dubluri în cadrul fișierului. */
export function parseSubscribersCsv(text: string): ParsedCsv {
  const delimiter = detectDelimiter(text);
  const rows = parseRows(text, delimiter);
  if (rows.length === 0) return { rows: [], skipped: [], delimiter };

  const { nameAt, emailAt, hasHeader } = pickColumns(rows);
  const body = hasHeader ? rows.slice(1) : rows;

  const out: ParsedSubscriber[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const row of body) {
    const email = (row[emailAt] ?? "").trim().toLowerCase();
    const name = nameAt >= 0 ? (row[nameAt] ?? "").trim() : "";
    if (!EMAIL_RE.test(email)) {
      const raw = row.join(" ").trim();
      if (raw && skipped.length < 20) skipped.push(raw);
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    out.push({ name: name.replace(/\s+/g, " "), email });
  }
  return { rows: out, skipped, delimiter };
}
