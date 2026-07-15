"use client";

import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { formatEUR } from "@/lib/analytics";
import { detectRecurring, FREQUENCY_LABEL, monthlyEquivalent } from "@/lib/recurring";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

/** Días que faltan hasta la fecha dada (puede ser negativo si ya pasó). */
function daysUntil(date: string): number {
  const ms = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

export default function RecurringPanel({ transactions }: Props) {
  const series = useMemo(() => detectRecurring(transactions), [transactions]);

  const monthlyCommitted = useMemo(
    () =>
      series
        .filter((s) => s.avgAmount < 0)
        .reduce((sum, s) => sum + Math.abs(monthlyEquivalent(s)), 0),
    [series]
  );

  if (series.length === 0) return null;

  return (
    <section id="recurrentes" className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Movimientos Recurrentes</h3>
          <p className="mt-0.5 text-xs text-muted">
            Suscripciones y pagos periódicos detectados automáticamente
          </p>
        </div>
        <p className="text-sm text-secondary">
          Comprometido al mes:{" "}
          <span className="font-semibold text-foreground">{formatEUR(monthlyCommitted)}</span>
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Frecuencia</th>
              <th className="px-3 py-2 text-right font-medium">Importe</th>
              <th className="px-3 py-2 text-right font-medium">Próximo</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const daysLeft = daysUntil(s.nextDate);
              return (
                <tr key={s.key} className="border-t border-line">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet/15 text-violet">
                        <Repeat className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.description}</p>
                        <p className="truncate text-xs text-muted">
                          {s.account} · {s.occurrences} veces
                          {s.confidence === "media" && " · a confirmar"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-secondary">{s.category}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-secondary">
                    {FREQUENCY_LABEL[s.frequency]}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums ${
                      s.avgAmount >= 0 ? "text-good" : "text-foreground"
                    }`}
                  >
                    {s.avgAmount >= 0 ? "+" : ""}
                    {formatEUR(s.avgAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <span className="tabular-nums text-secondary">{formatDate(s.nextDate)}</span>
                    {daysLeft >= 0 && daysLeft <= 7 && (
                      <span className="ml-1.5 rounded-full border border-violet/40 bg-violet/10 px-1.5 py-0.5 text-[10px] text-violet">
                        {daysLeft === 0 ? "hoy" : `en ${daysLeft}d`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
