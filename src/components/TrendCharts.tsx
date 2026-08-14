"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_STYLE, CHART_COLORS, Legend, Panel, VizTooltip } from "@/components/charts/ChartKit";
import {
  categoryMonthlyTrend,
  formatEUR,
  formatMonth,
  monthlySummaries,
  withCumulative,
} from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const formatPercent = (v: number) => `${v.toFixed(1)}%`;

/**
 * Gráficos para la vista comparativa de varios meses: ingresos vs. gastos
 * (barras agrupadas), tasa de ahorro, balance acumulado y evolución de
 * categorías — todo dinámico según los movimientos recibidos (ya filtrados
 * por el período/cuenta activos).
 */
export default function TrendCharts({ transactions }: Props) {
  const months = withCumulative(monthlySummaries(transactions)).map((m) => ({
    ...m,
    label: formatMonth(m.month),
  }));

  if (months.length === 0) return null;

  const expenseTrend = categoryMonthlyTrend(transactions, "expense");
  const expenseTrendData = expenseTrend.data.map((d) => ({ ...d, label: formatMonth(d.month) }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Ingresos vs. Gastos por mes" subtitle="Comparativa mensual" glow>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={months} margin={{ top: 6, right: 6, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatEUR(v).replace(",00", "")}
            />
            <Tooltip content={<VizTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="income" name="Ingresos" fill="var(--viz-income)" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="expense" name="Gastos" fill="var(--viz-expense)" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Ingresos", color: "var(--viz-income)" },
            { label: "Gastos", color: "var(--viz-expense)" },
          ]}
        />
      </Panel>

      <Panel title="Tasa de ahorro mensual" subtitle="% del ingreso que queda como ahorro">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={months} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<VizTooltip formatter={formatPercent} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="savingsRate" name="Ahorro" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {months.map((m) => (
                <Cell key={m.month} fill={(m.savingsRate ?? 0) >= 0 ? "var(--good)" : "var(--bad)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Mes con ahorro", color: "var(--good)" },
            { label: "Mes sin ahorro", color: "var(--bad)" },
          ]}
        />
      </Panel>

      <Panel title="Evolución del balance" subtitle="Balance acumulado a lo largo del tiempo">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={months} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v: number) => formatEUR(v).replace(",00", "")}
            />
            <Tooltip content={<VizTooltip />} cursor={{ stroke: "var(--border-strong)" }} />
            <Line
              isAnimationActive={false}
              type="monotone"
              dataKey="cumulative"
              name="Acumulado"
              stroke="var(--violet)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Evolución de categorías" subtitle="Gasto mensual de tus principales categorías">
        {expenseTrend.categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sin gastos categorizados</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={expenseTrendData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
                <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
                <YAxis
                  tick={AXIS_STYLE}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => formatEUR(v).replace(",00", "")}
                />
                <Tooltip content={<VizTooltip />} />
                {expenseTrend.categories.map((category, i) => (
                  <Line
                    key={category}
                    isAnimationActive={false}
                    type="monotone"
                    dataKey={category}
                    name={category}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <Legend
              items={expenseTrend.categories.map((c, i) => ({
                label: c,
                color: CHART_COLORS[i % CHART_COLORS.length],
              }))}
            />
          </>
        )}
      </Panel>
    </div>
  );
}
