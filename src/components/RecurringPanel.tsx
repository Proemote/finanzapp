"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Repeat, X } from "lucide-react";
import { formatEUR } from "@/lib/analytics";
import { useFinanzapp } from "@/context/finanzapp-context";
import {
  annualEquivalent,
  detectRecurring,
  FREQUENCY_LABEL,
  monthlyEquivalent,
  type RecurringSeries,
} from "@/lib/recurring";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const CONFIRMED_KEY = "finanzapp-recurring-confirmed";
const DISMISSED_KEY = "finanzapp-recurring-dismissed";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

/** Días que faltan hasta la fecha dada (puede ser negativo si ya pasó). */
function daysUntil(date: string): number {
  const ms = new Date(date).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86_400_000);
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set();
  }
}

export default function RecurringPanel({ transactions }: Props) {
  const { setStatus } = useFinanzapp();
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setConfirmed(loadSet(CONFIRMED_KEY));
    setDismissed(loadSet(DISMISSED_KEY));
  }, []);

  const persistConfirmed = (next: Set<string>) => {
    setConfirmed(next);
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify([...next]));
  };

  const persistDismissed = (next: Set<string>) => {
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  };

  /** El usuario confirma que sí es una suscripción/gasto recurrente real. */
  const confirm = (s: RecurringSeries) => {
    const nextConfirmed = new Set(confirmed);
    nextConfirmed.add(s.key);
    persistConfirmed(nextConfirmed);
    setStatus({ kind: "ok", message: `"${s.description}" confirmada como recurrente` });
  };

  /** Descarta la serie (no es recurrente / ya no aplica), con deshacer. */
  const dismiss = (s: RecurringSeries) => {
    const nextDismissed = new Set(dismissed);
    nextDismissed.add(s.key);
    persistDismissed(nextDismissed);
    if (confirmed.has(s.key)) {
      const nextConfirmed = new Set(confirmed);
      nextConfirmed.delete(s.key);
      persistConfirmed(nextConfirmed);
    }
    setStatus({
      kind: "ok",
      message: `"${s.description}" marcado como no recurrente`,
      undo: () => {
        const restored = new Set(dismissed);
        restored.delete(s.key);
        persistDismissed(restored);
        setStatus({ kind: "ok", message: "Recurrente restaurado" });
      },
    });
  };

  const allSeries = useMemo(() => detectRecurring(transactions), [transactions]);
  const series = useMemo(() => allSeries.filter((s) => !dismissed.has(s.key)), [allSeries, dismissed]);

  /** Solo las confirmadas cuentan para los totales — nada se asume sin que el usuario lo confirme. */
  const confirmedSeries = useMemo(() => series.filter((s) => confirmed.has(s.key)), [series, confirmed]);
  const monthlyCost = useMemo(
    () =>
      confirmedSeries
        .filter((s) => s.avgAmount < 0)
        .reduce((sum, s) => sum + Math.abs(monthlyEquivalent(s)), 0),
    [confirmedSeries]
  );
  const annualCost = monthlyCost * 12;

  if (allSeries.length === 0) return null;

  return (
    <section id="recurrentes" className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Suscripciones y Recurrentes</h3>
          <p className="mt-0.5 text-xs text-muted">
            Detectados automáticamente por patrón · confirma los que sean reales para que cuenten en
            el resumen
          </p>
        </div>
        <div className="flex flex-wrap gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Suscripciones activas</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">{confirmedSeries.length}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Coste mensual</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">{formatEUR(monthlyCost)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">Coste anual</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums">{formatEUR(annualCost)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2 font-medium">Concepto</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Frecuencia</th>
              <th className="px-3 py-2 text-right font-medium">Importe</th>
              <th className="px-3 py-2 text-right font-medium">Mensual</th>
              <th className="px-3 py-2 text-right font-medium">Anual</th>
              <th className="px-3 py-2 text-right font-medium">Próximo</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => {
              const daysLeft = daysUntil(s.nextDate);
              const isConfirmed = confirmed.has(s.key);
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
                          {s.account} · último {formatDate(s.lastDate)}
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
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-secondary">
                    {formatEUR(monthlyEquivalent(s))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-secondary">
                    {formatEUR(annualEquivalent(s))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <span className="tabular-nums text-secondary">{formatDate(s.nextDate)}</span>
                    {daysLeft >= 0 && daysLeft <= 7 && (
                      <span className="ml-1.5 rounded-full border border-violet/40 bg-violet/10 px-1.5 py-0.5 text-[10px] text-violet">
                        {daysLeft === 0 ? "hoy" : `en ${daysLeft}d`}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {isConfirmed ? (
                      <span className="rounded-full border border-good/40 bg-good/10 px-2 py-0.5 text-[11px] font-medium text-good">
                        Confirmada
                      </span>
                    ) : (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                        Detectada
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {!isConfirmed && (
                        <button
                          onClick={() => confirm(s)}
                          aria-label={`Confirmar "${s.description}" como recurrente`}
                          title="Confirmar como suscripción/recurrente"
                          className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-good/15 hover:text-good"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(s)}
                        aria-label={`Marcar "${s.description}" como no recurrente`}
                        title="Ya no es recurrente"
                        className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-bad/15 hover:text-bad"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dismissed.size > 0 && (
        <button
          onClick={() => persistDismissed(new Set())}
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
