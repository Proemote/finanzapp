import ExcelJS from "exceljs";
import {
  accountSummaries,
  categorySummaries,
  monthlySummaries,
  totals,
  weeklySummaries,
  yearlySummaries,
} from "./analytics";
import type { Transaction } from "./types";

/** Hojas opcionales del Excel — Movimientos y Resumen mensual son siempre el núcleo. */
export interface ExportSections {
  categorias: boolean;
  cuentas: boolean;
  resumenAnual: boolean;
  mensualSemanal: boolean;
}

export interface ExportOptions {
  accountLabel?: string;
  /** Etiqueta del período elegido en el modal (para el nombre del archivo). */
  periodLabel?: string;
  sections: ExportSections;
}

const COLOR = {
  header: "FF1F3864",
  headerText: "FFFFFFFF",
  bandA: "FFFFFFFF",
  bandB: "FFEAF0FA",
  total: "FFFBD9C0",
  totalText: "FF7A3E1D",
  border: "FFD9DEE7",
  income: "FF1E7B34",
  expense: "FFB42318",
  muted: "FF6B7280",
};

const EUR_FMT = '#,##0.00 "€"';
const DATE_FMT = "dd/mm/yyyy";

function border(color = COLOR.border): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = { style: "thin", color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLOR.headerText }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.header } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = border("FFFFFFFF");
  });
  row.height = 22;
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { ...cell.font, bold: true, color: { argb: COLOR.totalText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.total } };
    cell.border = border();
  });
}

function styleBodyRow(row: ExcelJS.Row, band: boolean) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: band ? COLOR.bandB : COLOR.bandA } };
    cell.border = border();
  });
}

function freezeHeader(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

const monthLabel = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
};

/**
 * Genera y descarga el "Excel maestro de finanzas". Movimientos y Resumen
 * mensual son el núcleo (siempre se incluyen); Categorías, Cuentas, Resumen
 * anual y las hojas mensuales con desglose semanal son opcionales, elegidas
 * por el usuario en el modal de exportación.
 */
export async function exportMasterExcel(transactions: Transaction[], options: ExportOptions) {
  const { accountLabel, sections } = options;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Finanzapp";
  workbook.created = new Date();

  buildResumenSheet(workbook, transactions);
  buildMovimientosSheet(workbook, transactions);
  if (sections.categorias) buildCategoriasSheet(workbook, transactions);
  if (sections.cuentas) buildCuentasSheet(workbook, transactions);
  if (sections.resumenAnual) buildResumenAnualSheet(workbook, transactions);
  if (sections.mensualSemanal) buildMonthlyWeeklySheets(workbook, transactions);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const slug = accountLabel
    ? `-${accountLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
    : "";
  const a = document.createElement("a");
  a.href = url;
  a.download = `finanzas-maestro${slug}-${today}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildResumenSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Resumen");
  sheet.columns = [
    { header: "Mes", key: "mes", width: 20 },
    { header: "Ingresos", key: "ingresos", width: 16 },
    { header: "Gastos", key: "gastos", width: 16 },
    { header: "Balance", key: "balance", width: 16 },
    { header: "Acumulado", key: "acumulado", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const months = monthlySummaries(transactions);
  const t = totals(transactions);
  let cumulative = 0;

  months.forEach((m, i) => {
    cumulative += m.balance;
    const row = sheet.addRow({
      mes: monthLabel(m.month),
      ingresos: round2(m.income),
      gastos: round2(m.expense),
      balance: round2(m.balance),
      acumulado: round2(cumulative),
    });
    styleBodyRow(row, i % 2 === 1);
    ["ingresos", "gastos", "balance", "acumulado"].forEach((k) => {
      row.getCell(k).numFmt = EUR_FMT;
    });
    row.getCell("balance").font = {
      bold: true,
      color: { argb: m.balance >= 0 ? COLOR.income : COLOR.expense },
    };
  });

  const totalRow = sheet.addRow({
    mes: "TOTAL",
    ingresos: round2(t.income),
    gastos: round2(t.expense),
    balance: round2(t.balance),
    acumulado: round2(t.balance),
  });
  ["ingresos", "gastos", "balance", "acumulado"].forEach((k) => {
    totalRow.getCell(k).numFmt = EUR_FMT;
  });
  styleTotalRow(totalRow);

  freezeHeader(sheet);
}

function buildMovimientosSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Movimientos");
  sheet.columns = [
    { header: "Mes", key: "mes", width: 16 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Concepto", key: "concepto", width: 46 },
    { header: "Categoría", key: "categoria", width: 24 },
    { header: "Cuenta", key: "cuenta", width: 16 },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Importe", key: "importe", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const months = monthlySummaries(transactions);
  const byMonth = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(tx);
  }

  let bandIndex = 0;

  for (const m of months) {
    const rows = (byMonth.get(m.month) ?? []).sort((a, b) => a.date.localeCompare(b.date));

    for (const tx of rows) {
      const row = sheet.addRow({
        mes: monthLabel(m.month),
        fecha: new Date(tx.date),
        concepto: tx.description,
        categoria: tx.category,
        cuenta: tx.account || "Sin cuenta",
        tipo: tx.amount >= 0 ? "Ingreso" : "Gasto",
        importe: round2(tx.amount),
      });
      styleBodyRow(row, bandIndex % 2 === 1);
      bandIndex++;
      row.getCell("fecha").numFmt = DATE_FMT;
      row.getCell("importe").numFmt = EUR_FMT;
      row.getCell("importe").font = {
        color: { argb: tx.amount >= 0 ? COLOR.income : COLOR.expense },
      };
      row.getCell("mes").font = { color: { argb: COLOR.muted }, italic: true };
    }

    const totalRow = sheet.addRow({
      mes: "",
      fecha: "",
      concepto: `TOTAL ${monthLabel(m.month).toUpperCase()}`,
      categoria: "",
      cuenta: "",
      tipo: "",
      importe: round2(m.balance),
    });
    sheet.mergeCells(totalRow.number, 1, totalRow.number, 5);
    totalRow.getCell("importe").numFmt = EUR_FMT;
    styleTotalRow(totalRow);
  }

  freezeHeader(sheet);
}

function buildCategoriasSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Categorías");
  sheet.columns = [
    { header: "Tipo", key: "tipo", width: 12 },
    { header: "Categoría", key: "categoria", width: 30 },
    { header: "Total", key: "total", width: 16 },
    { header: "Nº movimientos", key: "count", width: 16 },
    { header: "% del total", key: "pct", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const rows = [
    ...categorySummaries(transactions, "expense").map((c) => ({ tipo: "Gasto" as const, c })),
    ...categorySummaries(transactions, "income").map((c) => ({ tipo: "Ingreso" as const, c })),
  ];

  rows.forEach(({ tipo, c }, i) => {
    const row = sheet.addRow({
      tipo,
      categoria: c.category,
      total: round2(c.total),
      count: c.count,
      pct: `${c.percentage.toFixed(1)}%`,
    });
    styleBodyRow(row, i % 2 === 1);
    row.getCell("total").numFmt = EUR_FMT;
    row.getCell("tipo").font = { color: { argb: tipo === "Ingreso" ? COLOR.income : COLOR.expense }, bold: true };
  });

  freezeHeader(sheet);
}

function buildCuentasSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Cuentas");
  sheet.columns = [
    { header: "Cuenta", key: "cuenta", width: 24 },
    { header: "Ingresos", key: "ingresos", width: 16 },
    { header: "Gastos", key: "gastos", width: 16 },
    { header: "Balance", key: "balance", width: 16 },
    { header: "Nº movimientos", key: "count", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const accounts = accountSummaries(transactions);
  accounts.forEach((a, i) => {
    const row = sheet.addRow({
      cuenta: a.account,
      ingresos: round2(a.income),
      gastos: round2(a.expense),
      balance: round2(a.balance),
      count: a.count,
    });
    styleBodyRow(row, i % 2 === 1);
    ["ingresos", "gastos", "balance"].forEach((k) => (row.getCell(k).numFmt = EUR_FMT));
    row.getCell("balance").font = {
      bold: true,
      color: { argb: a.balance >= 0 ? COLOR.income : COLOR.expense },
    };
  });

  const t = totals(transactions);
  const totalRow = sheet.addRow({
    cuenta: "TOTAL",
    ingresos: round2(t.income),
    gastos: round2(t.expense),
    balance: round2(t.balance),
    count: transactions.length,
  });
  ["ingresos", "gastos", "balance"].forEach((k) => (totalRow.getCell(k).numFmt = EUR_FMT));
  styleTotalRow(totalRow);

  freezeHeader(sheet);
}

function buildResumenAnualSheet(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const sheet = workbook.addWorksheet("Resumen anual");
  sheet.columns = [
    { header: "Año", key: "year", width: 12 },
    { header: "Ingresos", key: "ingresos", width: 16 },
    { header: "Gastos", key: "gastos", width: 16 },
    { header: "Balance", key: "balance", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const years = yearlySummaries(transactions);
  years.forEach((y, i) => {
    const row = sheet.addRow({
      year: y.year,
      ingresos: round2(y.income),
      gastos: round2(y.expense),
      balance: round2(y.balance),
    });
    styleBodyRow(row, i % 2 === 1);
    ["ingresos", "gastos", "balance"].forEach((k) => (row.getCell(k).numFmt = EUR_FMT));
    row.getCell("balance").font = {
      bold: true,
      color: { argb: y.balance >= 0 ? COLOR.income : COLOR.expense },
    };
  });

  const t = totals(transactions);
  const totalRow = sheet.addRow({
    year: "TOTAL",
    ingresos: round2(t.income),
    gastos: round2(t.expense),
    balance: round2(t.balance),
  });
  ["ingresos", "gastos", "balance"].forEach((k) => (totalRow.getCell(k).numFmt = EUR_FMT));
  styleTotalRow(totalRow);

  freezeHeader(sheet);
}

/** Nombre de hoja válido para Excel: máx. 31 caracteres, sin \ / ? * [ ] : */
function sheetSafeName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, "-").slice(0, 31);
}

/** Una hoja por mes con el desglose semanal (ingresos/gastos por Semana 1-5), como en el Excel de referencia. */
function buildMonthlyWeeklySheets(workbook: ExcelJS.Workbook, transactions: Transaction[]) {
  const months = monthlySummaries(transactions);
  const usedNames = new Set<string>();

  for (const m of months) {
    let name = sheetSafeName(monthLabel(m.month));
    let suffix = 2;
    while (usedNames.has(name)) {
      name = sheetSafeName(`${monthLabel(m.month)} (${suffix++})`);
    }
    usedNames.add(name);

    const sheet = workbook.addWorksheet(name);
    sheet.columns = [
      { header: "Semana", key: "semana", width: 14 },
      { header: "Ingresos", key: "ingresos", width: 16 },
      { header: "Gastos", key: "gastos", width: 16 },
      { header: "Balance", key: "balance", width: 16 },
    ];
    styleHeaderRow(sheet.getRow(1));

    const weeks = weeklySummaries(transactions, m.month);
    weeks.forEach((w, i) => {
      const balance = w.income - w.expense;
      const row = sheet.addRow({
        semana: w.label,
        ingresos: round2(w.income),
        gastos: round2(w.expense),
        balance: round2(balance),
      });
      styleBodyRow(row, i % 2 === 1);
      ["ingresos", "gastos", "balance"].forEach((k) => (row.getCell(k).numFmt = EUR_FMT));
      row.getCell("balance").font = { color: { argb: balance >= 0 ? COLOR.income : COLOR.expense } };
    });

    const totalRow = sheet.addRow({
      semana: "TOTAL",
      ingresos: round2(m.income),
      gastos: round2(m.expense),
      balance: round2(m.balance),
    });
    ["ingresos", "gastos", "balance"].forEach((k) => (totalRow.getCell(k).numFmt = EUR_FMT));
    styleTotalRow(totalRow);

    freezeHeader(sheet);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
