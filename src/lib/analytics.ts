import type { CategorySummary, MonthlySummary, Transaction } from "./types";

export function monthlySummaries(transactions: Transaction[]): MonthlySummary[] {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    const entry = byMonth.get(month) ?? { income: 0, expense: 0 };
    if (t.amount >= 0) entry.income += t.amount;
    else entry.expense += -t.amount;
    byMonth.set(month, entry);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => ({
      month,
      income,
      expense,
      balance: income - expense,
    }));
}

export function categorySummaries(
  transactions: Transaction[],
  type: "income" | "expense"
): CategorySummary[] {
  const filtered = transactions.filter((t) => (type === "income" ? t.amount >= 0 : t.amount < 0));
  const total = filtered.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const t of filtered) {
    const entry = byCategory.get(t.category) ?? { total: 0, count: 0 };
    entry.total += Math.abs(t.amount);
    entry.count++;
    byCategory.set(t.category, entry);
  }
  return [...byCategory.entries()]
    .map(([category, { total: catTotal, count }]) => ({
      category,
      total: catTotal,
      count,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function totals(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.amount >= 0) income += t.amount;
    else expense += -t.amount;
  }
  return { income, expense, balance: income - expense, count: transactions.length };
}

export const formatEUR = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export const formatMonth = (month: string) => {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
};
