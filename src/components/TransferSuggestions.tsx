"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useFinanzapp } from "@/context/finanzapp-context";
import { formatEUR } from "@/lib/analytics";
import { TRANSFER_CATEGORY } from "@/lib/categories";
import { detectTransferCandidates, type TransferCandidate } from "@/lib/transfers";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const DISMISSED_KEY = "finanzapp-transfer-dismissed";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

/**
 * "Posible transferencia entre tus cuentas" — sugiere pares gasto/ingreso
 * que probablemente son dinero moviéndose entre cuentas propias. Al
 * confirmar, recategoriza ambas patas a TRANSFER_CATEGORY (reutilizando
 * handleBulkCategoryChange) para que queden excluidas de ingresos/gastos
 * reales pero sigan visibles en Movimientos.
 */
export default function TransferSuggestions({ transactions }: Props) {
  const { handleBulkCategoryChange, setStatus } = useFinanzapp();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const persist = (next: Set<string>) => {
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  };

  const allCandidates = useMemo(() => detectTransferCandidates(transactions), [transactions]);
  const candidates = useMemo(
    () => allCandidates.filter((c) => !dismissed.has(c.key)),
    [allCandidates, dismissed]
  );

  const confirm = (c: TransferCandidate) => {
    handleBulkCategoryChange([c.outTx.id, c.inTx.id], TRANSFER_CATEGORY);
    setStatus({
      kind: "ok",
      message: `Transferencia ${c.outTx.account} → ${c.inTx.account} confirmada (${formatEUR(c.amount)}) — excluida de ingresos y gastos`,
    });
  };

  const dismiss = (c: TransferCandidate) => {
    const next = new Set(dismissed);
    next.add(c.key);
    persist(next);
    setStatus({
      kind: "ok",
      message: "Descartado — no se sugerirá de nuevo",
      undo: () => {
        const restored = new Set(dismissed);
        restored.delete(c.key);
        persist(restored);
      },
    });
  };

  if (candidates.length === 0) return null;

  return (
    <section className="card p-5">
      <h3 className="text-base font-semibold">Posibles transferencias entre tus cuentas</h3>
      <p className="mt-0.5 text-xs text-muted">
        Un gasto y un ingreso del mismo importe en cuentas distintas y fechas próximas — probablemente
        no es un ingreso o gasto real
      </p>

      <div className="mt-4 space-y-2">
        {candidates.map((c) => (
          <div
            key={c.key}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface-2 p-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{c.outTx.account}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden />
              <span>{c.inTx.account}</span>
            </div>
            <span className="font-semibold tabular-nums">{formatEUR(c.amount)}</span>
            <span className="text-xs text-muted">
              {formatDate(c.outTx.date)}
              {c.daysApart > 0 ? ` → ${formatDate(c.inTx.date)}` : ""}
              {c.confidence === "media" && " · a confirmar"}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => confirm(c)}
                className="cursor-pointer rounded-full bg-violet-deep px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              >
                Confirmar transferencia
              </button>
              <button
                onClick={() => dismiss(c)}
                aria-label="Descartar sugerencia"
                title="No es una transferencia"
                className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-bad/15 hover:text-bad"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
