"use client";

import { CHART_COLORS } from "@/components/charts/ChartKit";
import { formatEUR } from "@/lib/analytics";
import type { CategorySummary } from "@/lib/types";

interface Props {
  categories: CategorySummary[];
  /** Al pulsar una categoría, filtra Movimientos por ella (drill-down). */
  onSelect?: (category: string) => void;
  emptyLabel?: string;
}

/** Lista "Gastos por categoría": importe + % del total, con drill-down opcional a Movimientos. */
export default function CategoryBreakdown({ categories, onSelect, emptyLabel = "Sin movimientos" }: Props) {
  if (categories.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {categories.map((c, i) => {
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const Tag = onSelect ? "button" : "div";
        return (
          <li key={c.category}>
            <Tag
              onClick={onSelect ? () => onSelect(c.category) : undefined}
              className={`w-full text-left ${onSelect ? "cursor-pointer" : ""}`}
              {...(onSelect ? { title: `Ver movimientos de ${c.category}` } : {})}
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="min-w-0 flex-1 truncate text-secondary">{c.category}</span>
                <span className="shrink-0 tabular-nums text-muted">{c.percentage.toFixed(0)}%</span>
                <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                  {formatEUR(c.total)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${Math.max(c.percentage, 2)}%`, backgroundColor: color }}
                />
              </div>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
