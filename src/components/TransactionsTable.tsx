"use client";

import { useMemo, useState } from "react";
import { formatEUR } from "@/lib/analytics";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  query: string;
  onCategoryChange: (id: string, category: string) => void;
}

const PAGE_SIZE = 50;

export default function TransactionsTable({ transactions, query, onCategoryChange }: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (!q) return sorted;
    return sorted.filter(
      (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [transactions, query]);

  const shown = filtered.slice(0, visible);

  return (
    <section id="movimientos" className="card">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-base font-semibold">Movimientos Recientes</h3>
        <p className="mt-0.5 text-xs text-muted">
          {query
            ? `${filtered.length} resultados para “${query}”`
            : `Historial de tus ${filtered.length} transacciones`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-3 font-medium">Concepto</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Origen</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 text-right font-medium">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr
                key={t.id}
                className="border-t border-line transition-colors duration-150 hover:bg-white/[.02]"
              >
                <td className="max-w-sm truncate px-5 py-3 font-medium" title={t.description}>
                  {t.description}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={t.category}
                    onChange={(e) => onCategoryChange(t.id, e.target.value)}
                    aria-label={`Categoría de ${t.description}`}
                    className="w-full max-w-52 cursor-pointer rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-secondary outline-none transition-colors duration-150 hover:border-line-strong focus:border-violet"
                  >
                    {(t.amount >= 0 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {![...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].includes(t.category as never) && (
                      <option value={t.category}>{t.category}</option>
                    )}
                  </select>
                </td>
                <td className="max-w-40 truncate px-5 py-3 text-xs text-muted" title={t.source}>
                  {t.source}
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums text-secondary">
                  {t.date}
                </td>
                <td
                  className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${
                    t.amount >= 0 ? "text-good" : "text-foreground"
                  }`}
                >
                  {t.amount >= 0 ? "+" : ""}
                  {formatEUR(t.amount)}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                  No hay movimientos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > visible && (
        <div className="border-t border-line p-3 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-violet transition-colors duration-150 hover:bg-violet/10"
          >
            Mostrar {Math.min(PAGE_SIZE, filtered.length - visible)} más
          </button>
        </div>
      )}
    </section>
  );
}
