"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Etiqueta a mostrar para una opción (por defecto, la propia opción). */
  renderOption?: (option: string) => string;
}

export default function MultiSelectFilter({ label, options, selected, onChange, renderOption }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const toggle = (option: string) => {
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[11px] text-muted">{label}</label>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 hover:border-line-strong"
      >
        {selected.size > 0 ? `${label} (${selected.size})` : "Todas"}
        <ChevronDown className="h-3 w-3 text-muted" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-10 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-lg">
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-line pb-1.5 text-[11px]">
            <button
              onClick={() => onChange(new Set(options))}
              className="cursor-pointer text-violet hover:underline"
            >
              Todas
            </button>
            <button
              onClick={() => onChange(new Set())}
              className="cursor-pointer text-muted hover:underline"
            >
              Ninguna
            </button>
          </div>
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-foreground/[.04]"
            >
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => toggle(option)}
                className="cursor-pointer accent-violet"
              />
              <span className="truncate">{renderOption ? renderOption(option) : option}</span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="px-1.5 py-1 text-xs text-muted">Sin opciones</p>
          )}
        </div>
      )}
    </div>
  );
}
