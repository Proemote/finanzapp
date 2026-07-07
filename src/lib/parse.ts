import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParseResult, Transaction } from "./types";

export type Cell = string | number | boolean | Date | null | undefined;
export type Row = Cell[];

const DATE_HEADERS = ["fecha", "f. valor", "f.valor", "fecha operacion", "fecha operación", "fecha valor", "date", "dia", "día"];
const DESC_HEADERS = ["concepto", "descripcion", "descripción", "description", "detalle", "movimiento", "memo", "beneficiario", "payee"];
const AMOUNT_HEADERS = ["importe", "amount", "cantidad", "valor", "importe (€)", "importe eur"];
const DEBIT_HEADERS = ["cargo", "debe", "debit", "gasto", "salidas", "pagos"];
const CREDIT_HEADERS = ["abono", "haber", "credit", "ingreso", "entradas", "cobros"];

function norm(value: Cell): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function matchHeader(cell: Cell, candidates: string[]): boolean {
  const n = norm(cell);
  if (!n) return false;
  return candidates.some((c) => {
    const cn = norm(c);
    return n === cn || n.startsWith(cn) || cn.startsWith(n) && n.length >= 4;
  });
}

/**
 * Interpreta un importe en formato europeo ("1.234,56"), americano ("1,234.56")
 * o plano ("1234.56"). Acepta símbolo €, espacios y negativos con paréntesis.
 */
export function parseAmount(value: Cell): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date || typeof value === "boolean") return null;

  let s = String(value).trim().replace(/[€$\s]/g, "");
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // El separador que aparece más a la derecha es el decimal
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // Solo comas: decimal europeo salvo que parezca separador de miles (ej. "1,234")
    const digitsAfter = s.length - lastComma - 1;
    if (digitsAfter === 3 && s.indexOf(",") !== lastComma) s = s.replace(/,/g, "");
    else s = s.replace(/,/g, ".");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Convierte fechas dd/mm/yyyy, yyyy-mm-dd, seriales de Excel o Date a ISO. */
export function parseDate(value: Cell): string | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toISO(value);
  }

  if (typeof value === "number") {
    // Serial de Excel (días desde 1900); rango plausible 1990-2100
    if (value > 32874 && value < 73415) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return `${pad(parsed.y, 4)}-${pad(parsed.m)}-${pad(parsed.d)}`;
    }
    return null;
  }

  const s = String(value).trim();

  // yyyy-mm-dd / yyyy/mm/dd
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;

  // dd/mm/yyyy o dd-mm-yy (formato europeo)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let year = +m[3];
    if (year < 100) year += year > 70 ? 1900 : 2000;
    const day = +m[1];
    const month = +m[2];
    if (month > 12 && day <= 12) return `${year}-${pad(day)}-${pad(month)}`; // era mm/dd
    if (month > 12) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface ColumnMap {
  date: number;
  description: number;
  amount?: number;
  debit?: number;
  credit?: number;
}

/** Busca la fila de cabeceras y mapea las columnas relevantes. */
function detectColumns(rows: Row[]): { headerRow: number; map: ColumnMap } | null {
  const limit = Math.min(rows.length, 15);
  for (let r = 0; r < limit; r++) {
    const row = rows[r];
    if (!row) continue;
    let date = -1, description = -1, amount = -1, debit = -1, credit = -1;
    row.forEach((cell, i) => {
      if (date === -1 && matchHeader(cell, DATE_HEADERS)) date = i;
      else if (description === -1 && matchHeader(cell, DESC_HEADERS)) description = i;
      else if (amount === -1 && matchHeader(cell, AMOUNT_HEADERS)) amount = i;
      else if (debit === -1 && matchHeader(cell, DEBIT_HEADERS)) debit = i;
      else if (credit === -1 && matchHeader(cell, CREDIT_HEADERS)) credit = i;
    });
    if (date > -1 && description > -1 && (amount > -1 || debit > -1 || credit > -1)) {
      return {
        headerRow: r,
        map: {
          date,
          description,
          amount: amount > -1 ? amount : undefined,
          debit: debit > -1 ? debit : undefined,
          credit: credit > -1 ? credit : undefined,
        },
      };
    }
  }
  return null;
}

/** Sin cabeceras reconocibles: intenta inferir por el contenido de las filas. */
function inferColumns(rows: Row[]): ColumnMap | null {
  const sample = rows.slice(0, 20).filter((r) => r && r.length >= 2);
  if (sample.length === 0) return null;

  const width = Math.max(...sample.map((r) => r.length));
  let dateCol = -1, amountCol = -1, descCol = -1;

  for (let c = 0; c < width; c++) {
    const values = sample.map((r) => r[c]).filter((v) => v != null && v !== "");
    if (values.length === 0) continue;
    const dateHits = values.filter((v) => parseDate(v) !== null).length;
    const numHits = values.filter((v) => parseAmount(v) !== null && parseDate(v) === null).length;
    const textHits = values.filter(
      (v) => typeof v === "string" && parseAmount(v) === null && parseDate(v) === null && v.trim().length > 2
    ).length;

    if (dateCol === -1 && dateHits >= values.length * 0.7) dateCol = c;
    else if (amountCol === -1 && numHits >= values.length * 0.7) amountCol = c;
    else if (descCol === -1 && textHits >= values.length * 0.7) descCol = c;
  }

  if (dateCol > -1 && amountCol > -1 && descCol > -1) {
    return { date: dateCol, description: descCol, amount: amountCol };
  }
  return null;
}

function rowsToTransactions(
  rows: Row[],
  source: string,
  forced?: { map: ColumnMap; startRow: number }
): ParseResult {
  let map: ColumnMap | null;
  let startRow: number;

  if (forced) {
    map = forced.map;
    startRow = forced.startRow;
  } else {
    const detected = detectColumns(rows);
    if (detected) {
      map = detected.map;
      startRow = detected.headerRow + 1;
    } else {
      map = inferColumns(rows);
      startRow = 0;
    }
  }

  if (!map) return { transactions: [], skippedRows: rows.length, totalRows: rows.length };

  const transactions: Omit<Transaction, "category" | "account">[] = [];
  let skipped = 0;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || c === "")) continue;

    const date = parseDate(row[map.date]);
    const description = String(row[map.description] ?? "").trim();

    let amount: number | null = null;
    if (map.amount != null) {
      amount = parseAmount(row[map.amount]);
    } else {
      const debit = map.debit != null ? parseAmount(row[map.debit]) : null;
      const credit = map.credit != null ? parseAmount(row[map.credit]) : null;
      if (debit != null && debit !== 0) amount = -Math.abs(debit);
      else if (credit != null) amount = Math.abs(credit);
    }

    if (!date || amount == null || !description) {
      skipped++;
      continue;
    }

    transactions.push({
      id: `${source}-${r}-${date}-${amount}`,
      date,
      description,
      amount,
      source,
    });
  }

  return { transactions, skippedRows: skipped, totalRows: rows.length - startRow };
}

/** Lee las filas crudas de un File (CSV, XLS o XLSX). */
export async function readFileRows(file: File): Promise<Row[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    return result.data as Row[];
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true });
}

/** Parsea un File (CSV, XLS o XLSX) y devuelve movimientos normalizados. */
export async function parseFile(file: File): Promise<ParseResult> {
  const rows = await readFileRows(file);
  return rowsToTransactions(rows, file.name);
}

export interface ManualMapping {
  date: number;
  description: number;
  amount: number;
  skipFirstRow: boolean;
}

/** Parsea filas con columnas elegidas a mano por el usuario (importador visual). */
export function parseWithMapping(rows: Row[], source: string, m: ManualMapping): ParseResult {
  return rowsToTransactions(rows, source, {
    map: { date: m.date, description: m.description, amount: m.amount },
    startRow: m.skipFirstRow ? 1 : 0,
  });
}
