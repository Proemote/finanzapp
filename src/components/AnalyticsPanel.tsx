"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { categorySummaries, formatEUR, monthlySummaries } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const monthLabel = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
};

/** Variación porcentual vs. el valor anterior; null si no es calculable. */
function delta(current: number, previous: number | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value == null) return <span className="text-xs text-muted">—</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
        good ? "text-good" : "text-bad"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export default function AnalyticsPanel({ transactions }: Props) {
  const months = useMemo(() => {
    const list = monthlySummaries(transactions);
    let cumulative = 0;
    return list.map((m, i) => {
      cumulative += m.balance;
      const prev = list[i - 1];
      return {
        ...m,
        cumulative,
        incomeDelta: delta(m.income, prev?.income),
        expenseDelta: delta(m.expense, prev?.expense),
        savingsRate: m.income > 0 ? (m.balance / m.income) * 100 : null,
      };
    });
  }, [transactions]);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedMonth = selected ?? months[months.length - 1]?.month ?? null;

  const breakdown = useMemo(() => {
    if (!selectedMonth) return [];
    const idx = months.findIndex((m) => m.month === selectedMonth);
    const prevMonth = idx > 0 ? months[idx - 1].month : null;

    const ofMonth = (month: string) =>
      categorySummaries(
        transactions.filter((t) => t.date.startsWith(month)),
        "expense"
      );

    const prevTotals = new Map(
      prevMonth ? ofMonth(prevMonth).map((c) => [c.category, c.total]) : []
    );

    return ofMonth(selectedMonth).map((c) => ({
      ...c,
      delta: delta(c.total, prevTotals.get(c.category)),
      isNew: prevMonth != null && !prevTotals.has(c.category),
    }));
  }, [months, selectedMonth, transactions]);

  if (months.length === 0) return null;

  const rows = [...months].reverse();

  return (
    <section id="analytics" className="card p-5">
      <h3 className="text-base font-semibold">Análisis Mensual</h3>
      <p className="mt-0.5 text-xs text-muted">
        Evolución mes a mes · selecciona un mes para ver su desglose
      </p>

      <div className="mt-4 grid gap-5 xl:grid-cols-3">
        <div className="overflow-x-auto xl:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 font-medium">Mes</th>
                <th className="px-3 py-2 text-right font-medium">Ingresos</th>
                <th className="px-3 py-2 text-right font-medium">Gastos</th>
                <th className="px-3 py-2 text-right font-medium">Balance</th>
                <th className="px-3 py-2 text-right font-medium">Ahorro</th>
                <th className="px-3 py-2 text-right font-medium">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr
                  key={m.month}
                  onClick={() => setSelected(m.month)}
                  aria-selected={m.month === selectedMonth}
                  className={`cursor-pointer border-t border-line transition-colors duration-150 ${
                    m.month === selectedMonth
                      ? "bg-violet/10"
                      : "hover:bg-white/[.02]"
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium capitalize">
                    {monthLabel(m.month)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {formatEUR(m.income)}
                    <span className="ml-1.5">
                      <DeltaBadge value={m.incomeDelta} goodWhenUp />
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {formatEUR(m.expense)}
                    <span className="ml-1.5">
                      <DeltaBadge value={m.expenseDelta} goodWhenUp={false} />
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums ${
                      m.balance >= 0 ? "text-good" : "text-bad"
                    }`}
                  >
                    {formatEUR(m.balance)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-secondary">
                    {m.savingsRate != null ? `${m.savingsRate.toFixed(1)}%` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-secondary">
                    {formatEUR(m.cumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <h4 className="text-sm font-semibold capitalize">
            Gastos de {selectedMonth ? monthLabel(selectedMonth) : "—"}
          </h4>
          <p className="mt-0.5 text-xs text-muted">Por categoría, comparado con el mes anterior</p>
          <ul className="mt-3 space-y-2">
            {breakdown.length === 0 && (
              <li className="py-4 text-center text-xs text-muted">Sin gastos este mes</li>
            )}
            {breakdown.map((c) => (
              <li key={c.category} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-secondary">{c.category}</span>
                {c.isNew ? (
                  <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted">
                    nuevo
                  </span>
                ) : (
                  <DeltaBadge value={c.delta} goodWhenUp={false} />
                )}
                <span className="w-24 text-right font-medium tabular-nums">
                  {formatEUR(c.total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
