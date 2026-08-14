"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLong } from "@/lib/analytics";
import { useFinanzapp } from "@/context/finanzapp-context";

/** "← Mes anterior · Agosto 2026 · Mes siguiente →" — navegador mes a mes de la vista mensual. */
export default function MonthNav() {
  const { selectedMonth, goToPrevMonth, goToNextMonth, canGoNextMonth } = useFinanzapp();

  return (
    <div className="flex items-center justify-center gap-3 sm:justify-start">
      <button
        onClick={goToPrevMonth}
        aria-label="Mes anterior"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <h2 className="min-w-[11rem] text-center text-xl font-bold capitalize tracking-tight sm:text-2xl">
        {formatMonthLong(selectedMonth)}
      </h2>
      <button
        onClick={goToNextMonth}
        disabled={!canGoNextMonth}
        aria-label="Mes siguiente"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-secondary transition-colors duration-150 hover:border-line-strong hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-line disabled:hover:text-secondary"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
