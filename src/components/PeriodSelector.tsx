"use client";

import { Calendar } from "lucide-react";
import { useFinanzapp } from "@/context/finanzapp-context";
import { PERIOD_PRESETS, type PeriodPreset } from "@/lib/period";

const inputCls =
  "rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 focus:border-violet";

/** Selector global de período: afecta a los gráficos y comparativas de Dashboard/Analytics. */
export default function PeriodSelector() {
  const { periodPreset, setPeriodPreset, customRange, setCustomRange } = useFinanzapp();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <select
        value={periodPreset}
        onChange={(e) => setPeriodPreset(e.target.value as PeriodPreset)}
        aria-label="Selector de período"
        className={`${inputCls} cursor-pointer`}
      >
        {PERIOD_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {periodPreset === "custom" && (
        <>
          <input
            type="date"
            aria-label="Desde"
            value={customRange?.start ?? ""}
            onChange={(e) => setCustomRange({ start: e.target.value, end: customRange?.end ?? "" })}
            className={inputCls}
          />
          <span className="text-xs text-muted">–</span>
          <input
            type="date"
            aria-label="Hasta"
            value={customRange?.end ?? ""}
            onChange={(e) => setCustomRange({ start: customRange?.start ?? "", end: e.target.value })}
            className={inputCls}
          />
        </>
      )}
    </div>
  );
}
