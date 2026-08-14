"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_STYLE, VizTooltip } from "@/components/charts/ChartKit";
import { formatEUR, type WeekBucket } from "@/lib/analytics";

interface Props {
  weeks: WeekBucket[];
}

/** "Evolución dentro del mes": ingresos vs. gastos por semana, en barras agrupadas. */
export default function MonthWeeklyChart({ weeks }: Props) {
  const hasData = weeks.some((w) => w.income > 0 || w.expense > 0);
  if (!hasData) return <p className="py-6 text-center text-sm text-muted">Sin movimientos este mes</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={weeks} margin={{ top: 6, right: 6, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatEUR(v).replace(",00", "")}
        />
        <Tooltip content={<VizTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="income" name="Ingresos" fill="var(--viz-income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Gastos" fill="var(--viz-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
