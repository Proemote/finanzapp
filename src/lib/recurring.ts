import type { Transaction } from "./types";

export type Frequency = "semanal" | "quincenal" | "mensual" | "trimestral" | "anual";

export interface RecurringSeries {
  key: string;
  description: string;
  category: string;
  account: string;
  frequency: Frequency;
  /** Importe medio de las ocurrencias (positivo = ingreso, negativo = gasto). */
  avgAmount: number;
  occurrences: number;
  lastDate: string;
  /** Próxima fecha estimada, proyectada a partir del intervalo mediano. */
  nextDate: string;
  confidence: "alta" | "media";
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
};

/** Nº de veces al mes que se repite cada frecuencia, para el equivalente mensual. */
const MONTHLY_FACTOR: Record<Frequency, number> = {
  semanal: 4.345,
  quincenal: 2.17,
  mensual: 1,
  trimestral: 1 / 3,
  anual: 1 / 12,
};

/** Rango de días entre ocurrencias que identifica cada frecuencia. */
const FREQUENCY_RANGES: [Frequency, number, number][] = [
  ["semanal", 6, 8],
  ["quincenal", 13, 16],
  ["mensual", 27, 33],
  ["trimestral", 85, 97],
  ["anual", 355, 375],
];

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*?\d[\d*]*/g, "") // referencias de tarjeta / números variables ("*6033")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function classifyFrequency(medianDays: number): Frequency | null {
  for (const [freq, min, max] of FREQUENCY_RANGES) {
    if (medianDays >= min && medianDays <= max) return freq;
  }
  return null;
}

/**
 * Detecta series de movimientos recurrentes (suscripciones, nóminas, alquiler…)
 * agrupando por descripción normalizada + cuenta + signo, y comprobando que el
 * intervalo entre ocurrencias sea consistente con alguna frecuencia conocida.
 */
export function detectRecurring(transactions: Transaction[]): RecurringSeries[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const norm = normalizeDescription(t.description);
    if (!norm) continue;
    const sign = t.amount >= 0 ? "in" : "out";
    const key = `${norm}__${t.account}__${sign}`;
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }

  const results: RecurringSeries[] = [];
  for (const [key, txs] of groups) {
    if (txs.length < 2) continue;
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const deltas = sorted.slice(1).map((t, i) => daysBetween(sorted[i].date, t.date));
    if (deltas.some((d) => d <= 0)) continue; // mismo día, no aporta periodicidad

    const med = median(deltas);
    const freq = classifyFrequency(med);
    if (!freq) continue;

    const avgDeviation = deltas.reduce((s, d) => s + Math.abs(d - med), 0) / deltas.length;
    if (avgDeviation > med * 0.25) continue; // intervalos demasiado irregulares

    const last = sorted[sorted.length - 1];
    const avgAmount = txs.reduce((s, t) => s + t.amount, 0) / txs.length;

    results.push({
      key,
      description: last.description,
      category: last.category,
      account: last.account,
      frequency: freq,
      avgAmount,
      occurrences: txs.length,
      lastDate: last.date,
      nextDate: addDays(last.date, Math.round(med)),
      confidence: txs.length >= 3 ? "alta" : "media",
    });
  }

  return results.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

/** Coste (o ingreso) equivalente mensual de una serie recurrente. */
export function monthlyEquivalent(series: RecurringSeries): number {
  return series.avgAmount * MONTHLY_FACTOR[series.frequency];
}
