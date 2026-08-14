import { TRANSFER_CATEGORY } from "./categories";
import type { AccountSummary, CategorySummary, MonthlySummary, Transaction } from "./types";

export const SIN_CUENTA = "Sin cuenta";

/**
 * Movimientos que cuentan como ingreso/gasto real. Las transferencias entre
 * cuentas propias (TRANSFER_CATEGORY) quedan fuera de todos los totales
 * pero siguen siendo visibles en Movimientos — ver sección "Transferencias
 * internas" del roadmap.
 */
export function excludeTransfers(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => t.category !== TRANSFER_CATEGORY);
}

export function accountSummaries(transactions: Transaction[]): AccountSummary[] {
  const byAccount = new Map<string, { income: number; expense: number; count: number }>();
  for (const t of excludeTransfers(transactions)) {
    const account = t.account || SIN_CUENTA;
    const entry = byAccount.get(account) ?? { income: 0, expense: 0, count: 0 };
    if (t.amount >= 0) entry.income += t.amount;
    else entry.expense += -t.amount;
    entry.count++;
    byAccount.set(account, entry);
  }
  return [...byAccount.entries()]
    .map(([account, { income, expense, count }]) => ({
      account,
      income,
      expense,
      balance: income - expense,
      count,
    }))
    .sort((a, b) => b.balance - a.balance);
}

export interface YearlySummary {
  year: string;
  income: number;
  expense: number;
  balance: number;
}

/** Igual que monthlySummaries pero agrupado por año — para el "Resumen general" multi-año del Excel. */
export function yearlySummaries(transactions: Transaction[]): YearlySummary[] {
  const byYear = new Map<string, { income: number; expense: number }>();
  for (const t of excludeTransfers(transactions)) {
    const year = t.date.slice(0, 4);
    const entry = byYear.get(year) ?? { income: 0, expense: 0 };
    if (t.amount >= 0) entry.income += t.amount;
    else entry.expense += -t.amount;
    byYear.set(year, entry);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, { income, expense }]) => ({ year, income, expense, balance: income - expense }));
}

export function monthlySummaries(transactions: Transaction[]): MonthlySummary[] {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of excludeTransfers(transactions)) {
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
  const filtered = excludeTransfers(transactions).filter((t) =>
    type === "income" ? t.amount >= 0 : t.amount < 0
  );
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
  const real = excludeTransfers(transactions);
  for (const t of real) {
    if (t.amount >= 0) income += t.amount;
    else expense += -t.amount;
  }
  return { income, expense, balance: income - expense, count: real.length };
}

/** Variación porcentual de `current` respecto a `previous`; null si no es calculable. */
export function percentDelta(current: number, previous: number | undefined | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface MonthlySummaryWithCumulative extends MonthlySummary {
  cumulative: number;
  savingsRate: number | null;
}

/** Añade balance acumulado y tasa de ahorro a una serie mensual — para la tabla y el gráfico de "Evolución del balance". */
export function withCumulative(months: MonthlySummary[]): MonthlySummaryWithCumulative[] {
  let cumulative = 0;
  return months.map((m) => {
    cumulative += m.balance;
    return { ...m, cumulative, savingsRate: m.income > 0 ? (m.balance / m.income) * 100 : null };
  });
}

export interface CategoryTrendPoint {
  month: string;
  [category: string]: number | string;
}

/**
 * Serie mensual por categoría (top N + "Otros") para el gráfico de
 * "Evolución de categorías" — formato ancho, una columna por categoría,
 * listo para un LineChart de Recharts con varias <Line>.
 */
export function categoryMonthlyTrend(
  transactions: Transaction[],
  type: "income" | "expense",
  topN = 5
): { data: CategoryTrendPoint[]; categories: string[] } {
  const real = excludeTransfers(transactions).filter((t) => (type === "income" ? t.amount >= 0 : t.amount < 0));

  const totalByCategory = new Map<string, number>();
  for (const t of real) {
    totalByCategory.set(t.category, (totalByCategory.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const topCategories = [...totalByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([category]) => category);
  const hasOthers = totalByCategory.size > topN;
  const categories = hasOthers ? [...topCategories, "Otros"] : topCategories;

  const byMonth = new Map<string, Record<string, number>>();
  for (const t of real) {
    const month = t.date.slice(0, 7);
    const category = topCategories.includes(t.category) ? t.category : "Otros";
    const entry = byMonth.get(month) ?? {};
    entry[category] = (entry[category] ?? 0) + Math.abs(t.amount);
    byMonth.set(month, entry);
  }

  const data = [...byMonth.keys()].sort().map((month) => {
    const entry = byMonth.get(month)!;
    const point: CategoryTrendPoint = { month };
    for (const c of categories) point[c] = entry[c] ?? 0;
    return point;
  });

  return { data, categories };
}

export interface WeekBucket {
  week: number;
  label: string;
  income: number;
  expense: number;
}

/**
 * Agrupa los movimientos de un mes ("yyyy-mm") en 5 tramos semanales
 * (1–7, 8–14, 15–21, 22–28, 29–fin), igual que el desglose del Excel de
 * referencia. Sirve para ver cómo se acumulan ingresos/gastos dentro del mes.
 */
export function weeklySummaries(transactions: Transaction[], month: string): WeekBucket[] {
  const buckets: WeekBucket[] = [1, 2, 3, 4, 5].map((week) => ({
    week,
    label: `Sem. ${week}`,
    income: 0,
    expense: 0,
  }));
  for (const t of excludeTransfers(transactions)) {
    if (!t.date.startsWith(month)) continue;
    const day = Number(t.date.slice(8, 10));
    const idx = Math.min(4, Math.floor((day - 1) / 7));
    if (t.amount >= 0) buckets[idx].income += t.amount;
    else buckets[idx].expense += -t.amount;
  }
  return buckets;
}

export const formatEUR = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export const formatMonth = (month: string) => {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
};

export const formatMonthLong = (month: string) => {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

export interface MonthNarrative {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number | null;
  expenseDelta: number | null;
}

/**
 * Datos deterministas para el resumen narrativo del período (sin IA
 * generativa): ingresos, gastos, ahorro y variación de gasto vs. el mes
 * anterior. El componente que lo consume se encarga solo de redactarlo.
 */
export function monthNarrative(monthTransactions: Transaction[], prevMonthTransactions: Transaction[]): MonthNarrative {
  const cur = totals(monthTransactions);
  const prev = totals(prevMonthTransactions);
  return {
    income: cur.income,
    expense: cur.expense,
    balance: cur.balance,
    savingsRate: cur.income > 0 ? (cur.balance / cur.income) * 100 : null,
    expenseDelta: percentDelta(cur.expense, prev.expense > 0 ? prev.expense : null),
  };
}
