"use client";

import { formatEUR } from "@/lib/analytics";
import type { MonthNarrative } from "@/lib/analytics";

interface Props {
  narrative: MonthNarrative;
}

/**
 * Resumen narrativo del período, redactado a partir de cálculos deterministas
 * (monthNarrative en lib/analytics.ts) — sin IA generativa.
 */
export default function NarrativeSummary({ narrative }: Props) {
  const { income, expense, balance, savingsRate, expenseDelta } = narrative;

  if (income === 0 && expense === 0) {
    return (
      <div className="card p-5">
        <p className="text-sm text-secondary">Todavía no hay movimientos registrados este mes.</p>
      </div>
    );
  }

  return (
    <div className="card card-glow p-5">
      <p className="text-sm leading-relaxed text-secondary">
        Has ingresado <strong className="font-semibold text-foreground">{formatEUR(income)}</strong> y
        gastado <strong className="font-semibold text-foreground">{formatEUR(expense)}</strong>.
        {savingsRate != null ? (
          <>
            {" "}
            Tu {balance >= 0 ? "ahorro" : "saldo"} este período ha sido de{" "}
            <strong className={`font-semibold ${balance >= 0 ? "text-good" : "text-bad"}`}>
              {balance >= 0 ? "+" : ""}
              {formatEUR(balance)}
            </strong>
            , equivalente al{" "}
            <strong className={`font-semibold ${savingsRate >= 0 ? "text-good" : "text-bad"}`}>
              {savingsRate.toFixed(1)}%
            </strong>{" "}
            de tus ingresos.
          </>
        ) : (
          <> No ha habido ingresos este período para calcular una tasa de ahorro.</>
        )}
        {expenseDelta != null && (
          <>
            {" "}
            Has gastado{" "}
            <strong className={`font-semibold ${expenseDelta <= 0 ? "text-good" : "text-bad"}`}>
              {Math.abs(expenseDelta).toFixed(1)}% {expenseDelta <= 0 ? "menos" : "más"}
            </strong>{" "}
            que el mes anterior.
          </>
        )}
      </p>
    </div>
  );
}
