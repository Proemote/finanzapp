"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatEUR } from "@/lib/analytics";

interface Props {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number | null;
}

/** KPIs del período activo: Ingresos, Gastos, Balance, Tasa de ahorro. */
export default function SummaryCards({ income, expense, balance, savingsRate }: Props) {
  const cards = [
    {
      label: "Ingresos",
      value: formatEUR(income),
      sub: "En el período",
      icon: TrendingUp,
      chip: "bg-good/15 text-good",
      valueClass: "text-foreground",
    },
    {
      label: "Gastos",
      value: formatEUR(expense),
      sub: "En el período",
      icon: TrendingDown,
      chip: "bg-bad/15 text-bad",
      valueClass: "text-foreground",
    },
    {
      label: "Balance",
      value: `${balance >= 0 ? "+" : ""}${formatEUR(balance)}`,
      sub: "Ingresos − gastos",
      icon: Wallet,
      chip: "bg-violet/15 text-violet",
      valueClass: balance >= 0 ? "text-good" : "text-bad",
    },
    {
      label: "Tasa de Ahorro",
      value: savingsRate != null ? `${savingsRate.toFixed(1)}%` : "—",
      sub: "Del ingreso total",
      icon: PiggyBank,
      chip: "bg-violet/15 text-violet",
      valueClass: savingsRate != null && savingsRate < 0 ? "text-bad" : "text-violet",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, chip, valueClass }) => (
        <div key={label} className="card p-5 transition-colors duration-200 hover:border-line-strong">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-secondary">{label}</p>
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${chip}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <p className={`mt-1 text-[1.7rem] font-bold tracking-tight ${valueClass}`}>{value}</p>
          <p className="mt-1 text-xs text-muted">{sub}</p>
        </div>
      ))}
    </div>
  );
}
