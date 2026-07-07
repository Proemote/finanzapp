"use client";

import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatEUR } from "@/lib/analytics";
import type { MonthlySummary } from "@/lib/types";

interface Props {
  balance: number;
  months: MonthlySummary[];
}

const monthLabel = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
};

export default function SummaryCards({ balance, months }: Props) {
  const last = months[months.length - 1];
  const savingsRate = last && last.income > 0 ? (last.balance / last.income) * 100 : null;
  const subtitle = last ? `En ${monthLabel(last.month)}` : "Sin datos";

  const cards = [
    {
      label: "Balance General",
      value: formatEUR(balance),
      sub: "Historial acumulado",
      icon: Wallet,
      chip: "bg-violet/15 text-violet",
      valueClass: balance >= 0 ? "text-foreground" : "text-bad",
    },
    {
      label: "Ingresos del Mes",
      value: last ? formatEUR(last.income) : "—",
      sub: subtitle,
      icon: TrendingUp,
      chip: "bg-good/15 text-good",
      valueClass: "text-foreground",
    },
    {
      label: "Gastos del Mes",
      value: last ? formatEUR(last.expense) : "—",
      sub: subtitle,
      icon: TrendingDown,
      chip: "bg-bad/15 text-bad",
      valueClass: "text-foreground",
    },
    {
      label: "Tasa de Ahorro",
      value: savingsRate != null ? `${savingsRate.toFixed(1)}%` : "—",
      sub: subtitle,
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
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chip}`}
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
