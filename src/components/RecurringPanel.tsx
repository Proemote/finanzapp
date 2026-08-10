"use client";

import { useEffect, useMemo, useState } from "react";
import { Repeat, X } from "lucide-react";
import { formatEUR } from "@/lib/analytics";
import { useFinanzapp } from "@/context/finanzapp-context";
import { detectRecurring, FREQUENCY_LABEL, monthlyEquivalent } from "@/lib/recurring";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const DISMISSED_KEY = "finanzapp-recurring-dismissed";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

/** Días que faltan hasta la fecha dada (puede ser negativo si ya pasó). */
function daysUntil(date: string): number {
  const ms = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function RecurringPanel({ transactions }: Props) {
  const { setStatus } = useFinanzapp();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const persist = (next: Set<string>) => {
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  };

  const dismiss = (key: string, description: string) => {
    const next = new Set(dismissed);
    next.add(key);
    persist(next);
    setStatus({
      kind: "ok",
      message: `"${description}" marcado como no recurrente`,
      undo: () => {
        const restored = new Set(dismissed);
        restored.delete(key);
        persist(restored);
        setStatus({ kind: "ok", message: "Recurrente restaurado" });
      },
    });
  };

  const allSeries = useMemo(() => detectRecurring(transactions), [transactions]);
  const series = useMemo(
    () => allSeries.filter((s) => !dismissed.has(s.key)),
    [allSeries, dismissed]
  );

  const monthlyCommitted = useMemo(
    () =>
      series
        .filter((s) => s.avgAmount < 0)
        .reduce((sum, s) => sum + Math.abs(monthlyEquivalent(s)), 0),
    [series]
  );

  if (allSeries.length === 0) return null;

  return (
    <section id="recurrentes" className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Movimientos Recurrentes</h3>
          <p className="mt-0.5 text-xs text-muted">
            Suscripciones y pagos periódicos detectados automáticamente · marca los que ya no
            apliquen
          </p>
        </div>
        <p className="text-sm text-secondary">
          Comprometido al mes:{" "}
          <span className="font-semibold text-foreground">{formatEUR(monthlyCommitted)}</span>
        </p>
      </div>

      {series.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Has marcado como no recurrentes todos los patrones detectados.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 font-medium">Concepto</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium">Frecuencia</th>
                <th className="px-3 py-2 text-right font-medium">Importe</th>
                <th className="px-3 py-2 text-right font-medium">Próximo</th>
                <th className="px-3 py-2">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const daysLeft = daysUntil(s.nextDate);
                return (
                  <tr key={s.key} className="border-t border-line">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet/15 text-violet">
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
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <button
                        onClick={() => dismiss(s.key, s.description)}
                        aria-label={`Marcar "${s.description}" como no recurrente`}
                        title="Ya no es recurrente"
                        className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-bad/15 hover:text-bad"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dismissed.size > 0 && (
        <button
          onClick={() => persist(new Set())}
          className="mt-3 cursor-pointer text-xs text-muted underline-offset-2 hover:text-secondary hover:underline"
        >
          {dismissed.size === 1
            ? "1 recurrente descartado"
            : `${dismissed.size} recurrentes descartados`}{" "}
          · restaurar todos
        </button>
      )}
    </section>
  );
}
