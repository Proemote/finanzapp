"use client";

import type { ReactNode } from "react";
import { formatEUR } from "@/lib/analytics";

export const AXIS_STYLE = { fontSize: 11, fill: "var(--viz-axis)" };

/** Paleta categórica compartida (donut, desglose por categoría, tendencias) — morado líder + 5 tonos, validada CVD. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function Panel({
  title,
  subtitle,
  children,
  className = "",
  glow = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={`card p-5 ${glow ? "card-glow" : ""} ${className}`}>
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { category?: string };
}

export function VizTooltip({
  active,
  payload,
  label,
  formatter = formatEUR,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  /** Cómo formatear cada valor — por defecto en euros; pásalo para % u otras unidades. */
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-xl">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-secondary">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-foreground">{formatter(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-secondary">
      {items.map(({ label, color, value }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
          {value && <span className="ml-1 font-medium text-foreground">{value}</span>}
        </li>
      ))}
    </ul>
  );
}
