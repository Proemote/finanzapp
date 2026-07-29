"use client";

import { useRef } from "react";
import { Search, Upload, Wallet } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useFinanzapp } from "@/context/finanzapp-context";

export default function Topbar() {
  const { query, setQuery, handleFiles } = useFinanzapp();
  const importRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-deep">
            <Wallet className="h-4 w-4 text-white" aria-hidden />
          </span>
          <span className="font-bold">Finanzapp</span>
        </div>

        <label className="relative hidden max-w-md flex-1 items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar movimientos, categorías…"
            aria-label="Buscar movimientos"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm outline-none transition-colors duration-150 placeholder:text-muted focus:border-violet"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <input
            ref={importRef}
            type="file"
            accept=".csv,.xls,.xlsx,.txt"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
          <button
            onClick={() => importRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-deep px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Importar CSV
          </button>
        </div>
      </div>
    </header>
  );
}
