"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";
import { formatEUR, formatMonthLong } from "@/lib/analytics";
import { useFinanzapp } from "@/context/finanzapp-context";
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSFER_CATEGORY } from "@/lib/categories";
import type { Transaction } from "@/lib/types";
import MultiSelectFilter from "./MultiSelectFilter";

interface Props {
  transactions: Transaction[];
  /** Catálogo completo de cuentas del usuario (no solo las presentes en `transactions`). */
  accounts: string[];
  query: string;
  onCategoryChange: (id: string, category: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

type TypeFilter = "all" | "income" | "expense" | "transfer";
type SortBy = "date" | "amount";

const PAGE_SIZE = 50;
const ALL_MONTHS = "__all__";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
  { value: "transfer", label: "Transferencia interna" },
];

const filterInputCls =
  "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet";

function SortHeader({
  col,
  label,
  align,
  sortBy,
  sortDir,
  onToggle,
}: {
  col: SortBy;
  label: string;
  align?: "right";
  sortBy: SortBy;
  sortDir: "asc" | "desc";
  onToggle: (col: SortBy) => void;
}) {
  return (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>
      <button
        onClick={() => onToggle(col)}
        className={`inline-flex cursor-pointer items-center gap-1 hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        {sortBy === col &&
          (sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" aria-hidden />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden />
          ))}
      </button>
    </th>
  );
}

export default function TransactionsTable({
  transactions,
  accounts,
  query,
  onCategoryChange,
  onEdit,
  onDelete,
}: Props) {
  const { handleBulkCategoryChange, handleDeleteTransactions } = useFinanzapp();

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [month, setMonth] = useState(ALL_MONTHS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [type, setType] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);

  const months = useMemo(
    () => [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse(),
    [transactions]
  );

  const categoriesInData = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions]
  );

  const hasFilters =
    month !== ALL_MONTHS ||
    dateFrom ||
    dateTo ||
    amountMin ||
    amountMax ||
    selectedAccounts.size > 0 ||
    selectedCategories.size > 0 ||
    type !== "all";

  const resetFilters = () => {
    setMonth(ALL_MONTHS);
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setSelectedAccounts(new Set());
    setSelectedCategories(new Set());
    setType("all");
  };

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = amountMin ? Number(amountMin) : null;
    const max = amountMax ? Number(amountMax) : null;

    const result = transactions.filter((t) => {
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
      if (selectedAccounts.size > 0 && !selectedAccounts.has(t.account)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(t.category)) return false;
      if (type === "transfer" && t.category !== TRANSFER_CATEGORY) return false;
      if (type === "income" && (t.amount < 0 || t.category === TRANSFER_CATEGORY)) return false;
      if (type === "expense" && (t.amount >= 0 || t.category === TRANSFER_CATEGORY)) return false;
      return true;
    });

    return result.sort((a, b) => {
      const cmp = sortBy === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    transactions,
    query,
    month,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    selectedAccounts,
    selectedCategories,
    type,
    sortBy,
    sortDir,
  ]);

  const shown = filtered.slice(0, visible);
  const shownIds = useMemo(() => shown.map((t) => t.id), [shown]);
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAllShown = () => {
    const next = new Set(selectedIds);
    if (allShownSelected) shownIds.forEach((id) => next.delete(id));
    else shownIds.forEach((id) => next.add(id));
    setSelectedIds(next);
  };

  const bulkDelete = () => {
    handleDeleteTransactions([...selectedIds]);
    setSelectedIds(new Set());
    setConfirmingBulkDelete(false);
  };

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

          <MultiSelectFilter
            label="Cuenta"
            options={accounts}
            selected={selectedAccounts}
            onChange={setSelectedAccounts}
          />

          <MultiSelectFilter
            label="Categoría"
            options={categoriesInData}
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />

          <div>
            <label htmlFor="filter-type" className="block text-[11px] text-muted">
              Tipo
            </label>
            <select
              id="filter-type"
              value={type}
              onChange={(e) => setType(e.target.value as TypeFilter)}
              className={`${filterInputCls} mt-1 cursor-pointer`}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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

        {selectedIds.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-violet/30 bg-violet/10 px-3 py-2 text-sm">
            <span className="font-medium text-violet">{selectedIds.size} seleccionados</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                handleBulkCategoryChange([...selectedIds], e.target.value);
                setSelectedIds(new Set());
              }}
              className={`${filterInputCls} cursor-pointer`}
            >
              <option value="" disabled>
                Recategorizar a…
              </option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {confirmingBulkDelete ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-bad">¿Eliminar {selectedIds.size}?</span>
                <button
                  onClick={bulkDelete}
                  className="cursor-pointer rounded-full bg-bad px-3 py-1 text-xs font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmingBulkDelete(false)}
                  className="cursor-pointer text-xs text-secondary hover:text-foreground"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingBulkDelete(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-bad/40 px-3 py-1 text-xs font-medium text-bad transition-colors duration-150 hover:bg-bad/10"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Eliminar seleccionados
              </button>
            )}

            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto cursor-pointer text-xs text-muted hover:text-secondary"
            >
              Deseleccionar todo
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los movimientos visibles"
                  checked={allShownSelected}
                  onChange={toggleAllShown}
                  className="cursor-pointer accent-violet"
                />
              </th>
              <th className="px-5 py-3 font-medium">Concepto</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Cuenta</th>
              <SortHeader col="date" label="Fecha" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader
                col="amount"
                label="Cantidad"
                align="right"
                sortBy={sortBy}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
              <th className="px-3 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr
                key={t.id}
                className={`border-t border-line transition-colors duration-150 hover:bg-foreground/[.04] ${
                  selectedIds.has(t.id) ? "bg-violet/5" : ""
                }`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${t.description}`}
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleRow(t.id)}
                    className="cursor-pointer accent-violet"
                  />
                </td>
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
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted">
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
