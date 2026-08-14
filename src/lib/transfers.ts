import { TRANSFER_CATEGORY } from "./categories";
import type { Transaction } from "./types";

export interface TransferCandidate {
  key: string;
  /** Movimiento de salida (gasto) en la cuenta origen. */
  outTx: Transaction;
  /** Movimiento de entrada (ingreso) en la cuenta destino. */
  inTx: Transaction;
  amount: number;
  daysApart: number;
  confidence: "alta" | "media";
}

/** Ventana de días entre las dos patas de la transferencia. */
const MAX_DAYS_APART = 3;

const TRANSFER_KEYWORDS = [
  "transferencia",
  "traspaso",
  "recarga",
  "bizum",
  "moneybeam",
  "revolut",
  "n26",
  "propia",
];

function daysBetween(a: string, b: string): number {
  return Math.abs(Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Detecta posibles transferencias entre cuentas propias: un gasto en una
 * cuenta y un ingreso de importe casi idéntico en otra, en una ventana de
 * pocos días. Nunca se marcan solas como transferencia — solo se sugieren
 * para que el usuario las confirme (ver TransferSuggestions.tsx).
 */
export function detectTransferCandidates(transactions: Transaction[]): TransferCandidate[] {
  const real = transactions.filter((t) => t.category !== TRANSFER_CATEGORY);
  const expenses = real.filter((t) => t.amount < 0);
  const incomes = real.filter((t) => t.amount >= 0);

  const incomesByAmount = new Map<number, Transaction[]>();
  for (const inc of incomes) {
    const amountKey = Math.round(Math.abs(inc.amount) * 100);
    const bucket = incomesByAmount.get(amountKey);
    if (bucket) bucket.push(inc);
    else incomesByAmount.set(amountKey, [inc]);
  }

  const usedIncomeIds = new Set<string>();
  const results: TransferCandidate[] = [];

  for (const out of expenses) {
    const amountKey = Math.round(Math.abs(out.amount) * 100);
    const bucket = incomesByAmount.get(amountKey);
    if (!bucket) continue;

    let best: Transaction | null = null;
    let bestDays = Infinity;
    for (const inc of bucket) {
      if (usedIncomeIds.has(inc.id) || inc.account === out.account) continue;
      const days = daysBetween(out.date, inc.date);
      if (days <= MAX_DAYS_APART && days < bestDays) {
        best = inc;
        bestDays = days;
      }
    }

    if (best) {
      usedIncomeIds.add(best.id);
      const hints = normalize(`${out.description} ${best.description}`);
      const hasKeyword = TRANSFER_KEYWORDS.some((kw) => hints.includes(kw));
      results.push({
        key: `${out.id}__${best.id}`,
        outTx: out,
        inTx: best,
        amount: Math.abs(out.amount),
        daysApart: bestDays,
        confidence: bestDays === 0 || hasKeyword ? "alta" : "media",
      });
    }
  }

  return results.sort((a, b) => b.outTx.date.localeCompare(a.outTx.date));
}
