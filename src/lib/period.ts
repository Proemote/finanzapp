/** Presets del selector global de período. "custom" usa customStart/customEnd. */
export type PeriodPreset =
  | "this-month"
  | "last-month"
  | "last-3"
  | "last-6"
  | "this-year"
  | "last-12"
  | "all"
  | "custom";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "this-month", label: "Este mes" },
  { value: "last-month", label: "Mes anterior" },
  { value: "last-3", label: "Últimos 3 meses" },
  { value: "last-6", label: "Últimos 6 meses" },
  { value: "this-year", label: "Este año" },
  { value: "last-12", label: "Últimos 12 meses" },
  { value: "all", label: "Todo el histórico" },
  { value: "custom", label: "Rango personalizado" },
];

export interface PeriodRange {
  /** yyyy-mm-dd inclusive, o null si no hay límite inferior (p.ej. "Todo el histórico"). */
  start: string | null;
  /** yyyy-mm-dd inclusive, o null si no hay límite superior. */
  end: string | null;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** Convierte "yyyy-mm" a Date (día 1) sin desfases de zona horaria. */
export function monthToDate(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** Resuelve un preset (o rango personalizado) al rango de fechas efectivo. */
export function resolvePeriod(
  preset: PeriodPreset,
  opts: { customStart?: string; customEnd?: string; now?: Date } = {}
): PeriodRange {
  const now = opts.now ?? new Date();
  const label = PERIOD_PRESETS.find((p) => p.value === preset)?.label ?? preset;

  switch (preset) {
    case "this-month":
      return { start: toISODate(startOfMonth(now)), end: toISODate(endOfMonth(now)), label };
    case "last-month": {
      const prev = addMonths(now, -1);
      return { start: toISODate(startOfMonth(prev)), end: toISODate(endOfMonth(prev)), label };
    }
    case "last-3":
      return { start: toISODate(startOfMonth(addMonths(now, -2))), end: toISODate(endOfMonth(now)), label };
    case "last-6":
      return { start: toISODate(startOfMonth(addMonths(now, -5))), end: toISODate(endOfMonth(now)), label };
    case "last-12":
      return { start: toISODate(startOfMonth(addMonths(now, -11))), end: toISODate(endOfMonth(now)), label };
    case "this-year":
      return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31`, label };
    case "custom":
      return { start: opts.customStart || null, end: opts.customEnd || null, label };
    case "all":
    default:
      return { start: null, end: null, label };
  }
}

/** true si la fecha (yyyy-mm-dd) cae dentro del rango (límites inclusive, null = sin límite). */
export function inPeriod(date: string, range: PeriodRange): boolean {
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}
