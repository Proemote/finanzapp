"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categorySummaries, formatEUR, formatMonth, monthlySummaries } from "@/lib/analytics";
import type { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

const AXIS_STYLE = { fontSize: 11, fill: "var(--viz-axis)" };

/** Paleta categórica para el donut: escala de morados. */
const DONUT_COLORS = ["#8b5cf6", "#ddd6fe", "#6d28d9", "#a78bfa", "#4c1d95", "#c4b5fd"];

function Panel({
  title,
  subtitle,
  children,
  className = "",
  glow = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { category?: string };
}

function VizTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-sm shadow-xl">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-secondary">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}:{" "}
          <span className="font-medium text-foreground">{formatEUR(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
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

export default function ChartsPanel({ transactions }: Props) {
  const months = monthlySummaries(transactions).map((m) => ({
    ...m,
    label: formatMonth(m.month),
  }));

  const expenseCats = categorySummaries(transactions, "expense");
  const totalExpense = expenseCats.reduce((s, c) => s + c.total, 0);
  const donutData = [
    ...expenseCats.slice(0, 5),
    ...(expenseCats.length > 5
      ? [
          {
            category: "Otros",
            total: expenseCats.slice(5).reduce((s, c) => s + c.total, 0),
            count: 0,
            percentage: 0,
          },
        ]
      : []),
  ];

  const incomeCats = categorySummaries(transactions, "income");

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel
        title="Evolución de Ingresos y Gastos"
        subtitle="Histórico mensual de movimientos bancarios"
        className="xl:col-span-2"
        glow
      >
        <ResponsiveContainer width="100%" height={290}>
          <AreaChart data={months} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-income)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--viz-income)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-expense)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--viz-expense)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="income"
              name="Ingresos"
              stroke="var(--viz-income)"
              strokeWidth={2}
              fill="url(#gradIncome)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="expense"
              name="Gastos"
              stroke="var(--viz-expense)"
              strokeWidth={2}
              fill="url(#gradExpense)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Ingresos", color: "var(--viz-income)" },
            { label: "Gastos", color: "var(--viz-expense)" },
          ]}
        />
      </Panel>

      <Panel title="Distribución de Gastos" subtitle="Análisis porcentual por categorías" glow>
        <div className="relative">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Tooltip content={<VizTooltip />} />
              <Pie
                isAnimationActive={false}
                data={donutData}
                dataKey="total"
                nameKey="category"
                innerRadius={68}
                outerRadius={92}
                paddingAngle={3}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={entry.category} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">Gastos</p>
            <p className="text-xl font-bold">{formatEUR(totalExpense)}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-xs">
          {donutData.map((c, i) => (
            <li key={c.category} className="flex items-center gap-2 text-secondary">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="truncate">{c.category}</span>
              <span className="ml-auto font-medium tabular-nums text-foreground">
                {formatEUR(c.total)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Balance Mensual"
        subtitle="Resultado neto de cada mes"
        className="xl:col-span-2"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={months} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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
            <Bar dataKey="balance" name="Balance" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {months.map((m) => (
                <Cell key={m.month} fill={m.balance >= 0 ? "var(--good)" : "var(--bad)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Legend
          items={[
            { label: "Mes positivo", color: "var(--good)" },
            { label: "Mes negativo", color: "var(--bad)" },
          ]}
        />
      </Panel>

      <Panel title="Ingresos por Categoría" subtitle="De dónde viene el dinero">
        <ResponsiveContainer width="100%" height={Math.max(180, incomeCats.length * 44)}>
          <BarChart data={incomeCats} layout="vertical" margin={{ left: 4, right: 60 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={130}
              tick={{ ...AXIS_STYLE, fill: "var(--text-secondary)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<VizTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar
              isAnimationActive={false}
              dataKey="total"
              name="Total"
              fill="var(--good)"
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
              label={{
                position: "right",
                fontSize: 11,
                fill: "var(--text-secondary)",
                formatter: (v: unknown) => formatEUR(Number(v)).replace(",00", ""),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
