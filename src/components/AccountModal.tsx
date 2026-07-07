"use client";

import { useEffect, useRef, useState } from "react";
import { Landmark, X } from "lucide-react";

interface Props {
  files: File[];
  /** Cuentas ya existentes, para sugerirlas */
  accounts: string[];
  onConfirm: (account: string) => void;
  onCancel: () => void;
}

const BANK_HINTS = [
  "bbva",
  "santander",
  "caixabank",
  "sabadell",
  "bankinter",
  "openbank",
  "unicaja",
  "abanca",
  "kutxabank",
  "ibercaja",
  "revolut",
  "n26",
  "wise",
  "ing",
  "evo",
];

/** Intenta adivinar el banco por el nombre del archivo. */
function guessAccount(files: File[]): string {
  const name = files[0]?.name.toLowerCase() ?? "";
  const hit = BANK_HINTS.find((b) => name.includes(b));
  if (!hit) return "";
  return hit === "bbva" || hit === "ing" || hit === "evo" || hit === "n26"
    ? hit.toUpperCase()
    : hit.charAt(0).toUpperCase() + hit.slice(1);
}

export default function AccountModal({ files, accounts, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(() => guessAccount(files));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => onConfirm(value.trim() || "Sin cuenta");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 text-violet">
              <Landmark className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="account-modal-title" className="text-base font-semibold">
                ¿De qué cuenta es este extracto?
              </h2>
              <p className="mt-0.5 max-w-64 truncate text-xs text-muted">
                {files.map((f) => f.name).join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancelar importación"
            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors duration-150 hover:bg-white/[.06] hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <label htmlFor="account-name" className="mt-5 block text-sm text-secondary">
          Nombre de la cuenta
        </label>
        <input
          ref={inputRef}
          id="account-name"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          list="account-suggestions"
          placeholder="BBVA, Revolut, Caja empresa…"
          className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet"
        />
        <datalist id="account-suggestions">
          {accounts.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>

        {accounts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {accounts.map((a) => (
              <button
                key={a}
                onClick={() => setValue(a)}
                className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs text-secondary transition-colors duration-150 hover:border-violet hover:text-foreground"
              >
                {a}
              </button>
            ))}
          </div>
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
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
