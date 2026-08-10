"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { formatEUR, formatMonthLong } from "@/lib/analytics";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
  query: string;
  onCategoryChange: (id: string, category: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const PAGE_SIZE = 50;
const ALL_MONTHS = "__all__";

const filterInputCls =
  "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet";

export default function TransactionsTable({
  transactions,
  query,
  onCategoryChange,
  onEdit,
  onDelete,
}: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [month, setMonth] = useState(ALL_MONTHS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const months = useMemo(
    () => [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse(),
    [transactions]
  );

  const hasFilters = month !== ALL_MONTHS || dateFrom || dateTo || amountMin || amountMax;

  const resetFilters = () => {
    setMonth(ALL_MONTHS);
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = amountMin ? Number(amountMin) : null;
    const max = amountMax ? Number(amountMax) : null;

    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.filter((t) => {
      if (q) {
        const matchesQuery =
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (month !== ALL_MONTHS && !t.date.startsWith(month)) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      const abs = Math.abs(t.amount);
      if (min != null && abs < min) return false;
      if (max != null && abs > max) return false;
      return true;
    });
  }, [transactions, query, month, dateFrom, dateTo, amountMin, amountMax]);

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

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filter-month" className="block text-[11px] text-muted">
              Mes
            </label>
            <select
              id="filter-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`${filterInputCls} mt-1 cursor-pointer capitalize`}
            >
              <option value={ALL_MONTHS}>Todos los meses</option>
              {months.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {formatMonthLong(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-date-from" className="block text-[11px] text-muted">
              Desde
            </label>
            <input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${filterInputCls} mt-1`}
            />
          </div>

          <div>
            <label htmlFor="filter-date-to" className="block text-[11px] text-muted">
              Hasta
            </label>
            <input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${filterInputCls} mt-1`}
            />
          </div>

          <div>
            <label htmlFor="filter-amount-min" className="block text-[11px] text-muted">
              Importe mín. (€)
            </label>
            <input
              id="filter-amount-min"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              className={`${filterInputCls} mt-1 w-24`}
            />
          </div>

          <div>
            <label htmlFor="filter-amount-max" className="block text-[11px] text-muted">
              Importe máx. (€)
            </label>
            <input
              id="filter-amount-max"
              type="number"
              min="0"
              step="0.01"
              placeholder="Sin límite"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              className={`${filterInputCls} mt-1 w-24`}
            />
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mb-0.5 inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground"
            >
              <X className="h-3 w-3" aria-hidden />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-3 font-medium">Concepto</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Cuenta</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 text-right font-medium">Cantidad</th>
              <th className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr
                key={t.id}
                className="border-t border-line transition-colors duration-150 hover:bg-foreground/[.04]"
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
                <td
                  className="max-w-40 truncate px-5 py-3 text-xs text-secondary"
                  title={`Archivo: ${t.source}`}
                >
                  {t.account || "Sin cuenta"}
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
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      aria-label={`Editar ${t.description}`}
                      className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-foreground/[.08] hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      aria-label={`Eliminar ${t.description}`}
                      className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-bad/15 hover:text-bad"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                  No hay movimientos que coincidan con la búsqueda o los filtros.
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
