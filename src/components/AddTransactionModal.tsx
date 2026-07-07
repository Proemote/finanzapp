"use client";

import { useEffect, useRef, useState } from "react";
import { PencilLine, X } from "lucide-react";
import { classifyByRules, defaultCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES, UNCLASSIFIED } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

interface Props {
  /** Cuentas existentes, para sugerirlas */
  accounts: string[];
  onConfirm: (transaction: Transaction) => void;
  onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddTransactionModal({ accounts, onConfirm, onCancel }: Props) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [account, setAccount] = useState("Efectivo");
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const signed = (Math.abs(Number(amount)) || 0) * (type === "expense" ? -1 : 1);
  const options = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Sugerir categoría según el concepto mientras el usuario no la haya tocado
  useEffect(() => {
    if (categoryTouched) return;
    const byRule = classifyByRules(description, signed);
    setCategory(byRule !== UNCLASSIFIED ? byRule : defaultCategory(signed));
  }, [description, signed, categoryTouched]);

  const submit = () => {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Introduce un importe mayor que 0");
      return;
    }
    if (!description.trim()) {
      setError("Introduce un concepto");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Introduce una fecha válida");
      return;
    }
    onConfirm({
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      description: description.trim(),
      amount: Math.abs(value) * (type === "expense" ? -1 : 1),
      category,
      account: account.trim() || "Efectivo",
      source: "manual",
    });
  };

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-tx-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
              <PencilLine className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="add-tx-title" className="text-base font-semibold">
                Añadir movimiento
              </h2>
              <p className="mt-0.5 text-xs text-muted">Pagos en efectivo u otros no bancarios</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-white/[.06] hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex gap-2" role="group" aria-label="Tipo de movimiento">
          {(
            [
              ["expense", "Gasto"],
              ["income", "Ingreso"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setType(value)}
              aria-pressed={type === value}
              className={`flex-1 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                type === value
                  ? value === "expense"
                    ? "bg-bad/20 text-bad"
                    : "bg-good/20 text-good"
                  : "border border-line text-secondary hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-amount" className="block text-sm text-secondary">
              Importe (€)
            </label>
            <input
              ref={firstFieldRef}
              id="tx-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25,50"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="tx-date" className="block text-sm text-secondary">
              Fecha
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <label htmlFor="tx-description" className="mt-4 block text-sm text-secondary">
          Concepto
        </label>
        <input
          id="tx-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Comida con cliente, taxi, material…"
          className={inputCls}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-category" className="block text-sm text-secondary">
              Categoría
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCategoryTouched(true);
              }}
              className={`${inputCls} cursor-pointer`}
            >
              {options.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-account" className="block text-sm text-secondary">
              Cuenta
            </label>
            <input
              id="tx-account"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              list="tx-account-suggestions"
              className={inputCls}
            />
            <datalist id="tx-account-suggestions">
              <option value="Efectivo" />
              {accounts.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="cursor-pointer rounded-full bg-violet-deep px-5 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
