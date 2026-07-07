import * as XLSX from "xlsx";
import { accountSummaries, categorySummaries, monthlySummaries, totals } from "./analytics";
import type { Transaction } from "./types";

/**
 * Genera y descarga el "Excel maestro de finanzas": resumen mensual,
 * desglose por categorías y todos los movimientos clasificados.
 */
export function exportMasterExcel(transactions: Transaction[]) {
  const workbook = XLSX.utils.book_new();
  const t = totals(transactions);

  // Hoja 1: Resumen mensual
  const months = monthlySummaries(transactions);
  let cumulative = 0;
  const summaryRows = months.map((m) => {
    cumulative += m.balance;
    return {
      Mes: m.month,
      Ingresos: round2(m.income),
      Gastos: round2(m.expense),
      Balance: round2(m.balance),
      Acumulado: round2(cumulative),
    };
  });
  summaryRows.push({
    Mes: "TOTAL",
    Ingresos: round2(t.income),
    Gastos: round2(t.expense),
    Balance: round2(t.balance),
    Acumulado: round2(t.balance),
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Hoja 2: Por categoría (gastos e ingresos)
  const categoryRows = [
    ...categorySummaries(transactions, "expense").map((c) => ({
      Tipo: "Gasto",
      Categoría: c.category,
      Total: round2(c.total),
      "Nº movimientos": c.count,
      "% del total": `${c.percentage.toFixed(1)}%`,
    })),
    ...categorySummaries(transactions, "income").map((c) => ({
      Tipo: "Ingreso",
      Categoría: c.category,
      Total: round2(c.total),
      "Nº movimientos": c.count,
      "% del total": `${c.percentage.toFixed(1)}%`,
    })),
  ];
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);
  categorySheet["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, categorySheet, "Categorías");

  // Hoja 3: Cuentas
  const accountRows = accountSummaries(transactions).map((a) => ({
    Cuenta: a.account,
    Ingresos: round2(a.income),
    Gastos: round2(a.expense),
    Balance: round2(a.balance),
    "Nº movimientos": a.count,
  }));
  const accountSheet = XLSX.utils.json_to_sheet(accountRows);
  accountSheet["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, accountSheet, "Cuentas");

  // Hoja 4: Movimientos
  const txRows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((tx) => ({
      Fecha: tx.date,
      Concepto: tx.description,
      Categoría: tx.category,
      Cuenta: tx.account || "Sin cuenta",
      Importe: round2(tx.amount),
      Tipo: tx.amount >= 0 ? "Ingreso" : "Gasto",
      Origen: tx.source,
    }));
  const txSheet = XLSX.utils.json_to_sheet(txRows);
  txSheet["!cols"] = [
    { wch: 11 },
    { wch: 50 },
    { wch: 28 },
    { wch: 18 },
    { wch: 12 },
    { wch: 9 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(workbook, txSheet, "Movimientos");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `finanzas-maestro-${today}.xlsx`);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
